import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/Quiz.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const LOCK_TTL_MS = 15 * 60 * 1000;

const Quiz = ({ user }) => {
  const fallbackUserIdRef = useRef(`guest_${Date.now()}`);
  const [status, setStatus] = useState('loading'); // loading, start, quiz, results, closed, completed, error
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [quizDate, setQuizDate] = useState('');
  const [userResult, setUserResult] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [openWindow, setOpenWindow] = useState({ from: '20:00', until: '23:59' });
  const [selectedLevel, setSelectedLevel] = useState('random');
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('ambiguous');
  const [reportNote, setReportNote] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const submittingRef = useRef(false);
  const tabIdRef = useRef(sessionStorage.getItem('quizTabId') || `quiz_${Date.now()}_${Math.random()}`);
  const resolvedUserId = user?.id || fallbackUserIdRef.current;
  const resolvedName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Participant';
  const reportReasons = [
    { value: 'ambiguous', label: 'Question ambigue' },
    { value: 'error', label: 'Erreur dans la question' },
    { value: 'hors-theme', label: 'Hors theme' },
    { value: 'mauvaise-source', label: 'Source incorrecte' },
    { value: 'doublon', label: 'Doublon' },
    { value: 'autre', label: 'Autre' }
  ];
  const canReport = Boolean(user?.id && localStorage.getItem('token'));

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  });

  // Charger le quiz du jour
  useEffect(() => {
    loadDailyQuiz();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('quizTabId', tabIdRef.current);
  }, []);

  const loadDailyQuiz = async (levelOverride) => {
    const level = levelOverride || selectedLevel || 'random';
    try {
      setStatus('loading');
      const response = await axios.get(`${API_URL}/api/quiz/daily/quiz`, {
        params: { level }
      });
      setQuestions(response.data.questions);
      setTimePerQuestion(response.data.timePerQuestion || 20);
      setQuizDate(response.data?.date || '');
      setStatus('start');
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error)) {
        setErrorMessage('Erreur lors du chargement du quiz.');
        setStatus('error');
      }
    }
  };

  const handleQuizClosed = (error) => {
    const data = error?.response?.data;
    if (error?.response?.status === 403 && data?.error === 'Quiz closed') {
      setOpenWindow({
        from: data.openFrom || '20:00',
        until: data.openUntil || '23:59'
      });
      setErrorMessage('');
      setStatus('closed');
      return true;
    }
    return false;
  };

  const handleQuizCompleted = (error) => {
    if (error?.response?.status === 409 && error?.response?.data?.error === 'Quiz already completed today') {
      setErrorMessage('');
      setStatus('completed');
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (status !== 'quiz' || !quizDate) return;
    const lockKey = `dailyQuizLock:${quizDate}`;
    const tabId = tabIdRef.current;
    const now = Date.now();

    try {
      const existing = localStorage.getItem(lockKey);
      if (existing) {
        const parsed = JSON.parse(existing);
        const isStale = !parsed?.timestamp || now - parsed.timestamp > LOCK_TTL_MS;
        if (!isStale && parsed?.tabId && parsed.tabId !== tabId) {
          setErrorMessage('Quiz deja ouvert dans un autre onglet.');
          setStatus('error');
          return;
        }
      }
    } catch (error) {
      // ignore storage errors
    }

    const updateLock = () => {
      localStorage.setItem(lockKey, JSON.stringify({ tabId, timestamp: Date.now() }));
    };
    updateLock();

    const interval = setInterval(updateLock, 30000);
    const handleStorage = (event) => {
      if (event.key !== lockKey || !event.newValue) return;
      try {
        const data = JSON.parse(event.newValue);
        if (data?.tabId && data.tabId !== tabId) {
          setErrorMessage('Quiz deja ouvert dans un autre onglet.');
          setStatus('error');
        }
      } catch (error) {
        // ignore storage errors
      }
    };
    const handleBeforeUnload = () => {
      const current = localStorage.getItem(lockKey);
      try {
        const parsed = current ? JSON.parse(current) : null;
        if (parsed?.tabId === tabId) {
          localStorage.removeItem(lockKey);
        }
      } catch (error) {
        // ignore storage errors
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const current = localStorage.getItem(lockKey);
      try {
        const parsed = current ? JSON.parse(current) : null;
        if (parsed?.tabId === tabId) {
          localStorage.removeItem(lockKey);
        }
      } catch (error) {
        // ignore storage errors
      }
    };
  }, [status, quizDate]);

  // Timer
  useEffect(() => {
    if (status !== 'quiz' || answered) return;

    if (timeLeft <= 0) {
      handleSubmitAnswer(null);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, status, answered]);

  const startQuiz = async () => {
    try {
      await axios.post(`${API_URL}/api/quiz/daily/start`, {
        userId: resolvedUserId,
        email: user?.email,
        name: resolvedName,
        level: selectedLevel
      });
      setStatus('quiz');
      setTimeLeft(timePerQuestion);
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error) && !handleQuizCompleted(error)) {
        setErrorMessage('Erreur lors du demarrage du quiz.');
        setStatus('error');
      }
    }
  };

  const submitReport = async (questionId) => {
    if (!questionId) {
      setReportStatus('Question introuvable.');
      return;
    }
    setReportStatus('');
    try {
      await axios.post(`${API_URL}/api/quiz/daily/report`, {
        questionId,
        reason: reportReason,
        note: reportNote,
        quizDate: quizDate || undefined
      }, {
        headers: getAuthHeaders()
      });
      setReportStatus('Signalement envoye. Merci.');
      setReportNote('');
      setReporting(false);
    } catch (error) {
      console.error('Error:', error);
      setReportStatus('Impossible d envoyer le signalement.');
    }
  };

  const handleSubmitAnswer = async (selectedIndex) => {
    if (submittingRef.current || answered) {
      return;
    }
    submittingRef.current = true;
    setAnswered(true);
    setSelectedOption(selectedIndex);

    try {
      const response = await axios.post(`${API_URL}/api/quiz/daily/answer`, {
        userId: resolvedUserId,
        questionIndex: currentIndex,
        selectedIndex,
        timeSpent: timePerQuestion - timeLeft,
        level: selectedLevel
      });

      if (response.data.isCorrect) {
        setScore((prevScore) => prevScore + 1);
      }

      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(currentIndex + 1);
          setTimeLeft(timePerQuestion);
          setAnswered(false);
          setSelectedOption(null);
          setReporting(false);
          setReportNote('');
          setReportStatus('');
          submittingRef.current = false;
        } else {
          completeQuiz();
        }
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      submittingRef.current = false;
      if (error?.response?.status === 429) {
        setAnswered(false);
        setSelectedOption(null);
        setReportStatus('Attendez une seconde avant de reessayer.');
        return;
      }
      if (handleQuizClosed(error) || handleQuizCompleted(error)) {
        return;
      }
      if (error?.response?.status === 409 && error?.response?.data?.error === 'Question already answered') {
        setTimeout(() => {
          if (currentIndex + 1 < questions.length) {
            setCurrentIndex(currentIndex + 1);
            setTimeLeft(timePerQuestion);
            setAnswered(false);
            setSelectedOption(null);
            submittingRef.current = false;
          } else {
            completeQuiz();
          }
        }, 600);
        return;
      }
      setErrorMessage('Erreur lors de l\'envoi de la reponse.');
      setStatus('error');
    }
  };

  const completeQuiz = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/quiz/daily/complete`, {
        userId: resolvedUserId,
        level: selectedLevel
      });

      const result = response.data;
      setUserResult(result);
      await loadLeaderboard();
      await loadDailyLeaderboard(result?.date, selectedLevel);
      submittingRef.current = false;
      setStatus('results');
    } catch (error) {
      console.error('Error:', error);
      submittingRef.current = false;
      if (!handleQuizClosed(error) && !handleQuizCompleted(error)) {
        setErrorMessage('Erreur lors de la cloture du quiz.');
        setStatus('error');
      }
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/daily/leaderboard`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error)) {
        setErrorMessage('Erreur lors du chargement du classement.');
        setStatus('error');
      }
    }
  };

  const loadDailyLeaderboard = async (quizDate, level) => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/daily/leaderboard`, {
        params: {
          period: 'day',
          date: quizDate,
          level: level || undefined,
          limit: 20
        }
      });
      setDailyLeaderboard(response.data?.leaderboard || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: '#4CAF50',
      intermediate: '#FF9800',
      advanced: '#2196F3',
      expert: '#9C27B0'
    };
    return colors[level] || '#666';
  };

  const levelOptions = [
    {
      value: 'medium',
      label: 'Moyen',
      description: 'Questions solides pour progresser'
    },
    {
      value: 'hard',
      label: 'Difficile',
      description: 'Defi exigeant pour experts'
    },
    {
      value: 'random',
      label: 'Aleatoire',
      description: 'Melange de niveaux'
    }
  ];

  const handleLevelSelect = (level) => {
    if (level === selectedLevel) {
      return;
    }
    setSelectedLevel(level);
    loadDailyQuiz(level);
  };

  // Start screen
  if (status === 'start') {
    return (
      <div className="quiz-container">
        <div className="quiz-header-card">
          <h2>📚 Quiz Islamique Quotidien</h2>
          <p>Commence à 20h00 • 20 questions • {timePerQuestion} secondes par question</p>
        </div>

        <div className="quiz-level-picker">
          <h3>Choisissez votre niveau</h3>
          <div className="quiz-level-grid">
            {levelOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`quiz-level-card ${selectedLevel === option.value ? 'active' : ''}`}
                onClick={() => handleLevelSelect(option.value)}
              >
                <span className="quiz-level-title">{option.label}</span>
                <span className="quiz-level-desc">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-rules">
          <h3>Regles du jour</h3>
          <ul>
            <li>20 questions uniques chaque jour.</li>
            <li>{timePerQuestion} secondes par question.</li>
            <li>Disponible de {openWindow.from} a {openWindow.until}.</li>
            <li>Une participation par membre et par jour.</li>
          </ul>
        </div>

        <div className="quiz-info-grid">
          <div className="info-card">
            <h3>🎯 Format</h3>
            <p>20 questions différentes chaque jour</p>
          </div>
          <div className="info-card">
            <h3>⏱️ Temps</h3>
            <p>{timePerQuestion} secondes par question</p>
          </div>
          <div className="info-card">
            <h3>📈 Difficulté</h3>
            <p>Adaptée à votre niveau</p>
          </div>
          <div className="info-card">
            <h3>🏆 Classement</h3>
            <p>Remis à zéro chaque semaine</p>
          </div>
        </div>

        <button className="quiz-start-btn" onClick={startQuiz}>
          Commencer le Quiz 🚀
        </button>
      </div>
    );
  }

  // Quiz screen
  if (status === 'quiz' && questions.length > 0) {
    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="quiz-container">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: progress + '%' }}></div>
          </div>
          <p>{currentIndex + 1}/{questions.length} questions</p>
        </div>

        <div className="quiz-card">
          <div className="timer-section">
            <div className={`timer ${timeLeft <= 3 ? 'warning' : ''}`}>
              {timeLeft}
            </div>
          </div>

          <h3 className="question-text">{question.question}</h3>

          <div className="options-grid">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                className={`option-btn ${selectedOption === idx ? 'selected' : ''}`}
                onClick={() => !answered && handleSubmitAnswer(idx)}
                disabled={answered}
                style={{
                  backgroundColor: answered && selectedOption === idx 
                    ? question.correct === idx ? '#4CAF50' : '#F44336'
                    : ''
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="quiz-report">
            {canReport ? (
              <>
                <button
                  type="button"
                  className="quiz-report-btn"
                  onClick={() => setReporting(!reporting)}
                >
                  {reporting ? 'Fermer le signalement' : 'Signaler cette question'}
                </button>
                {reporting && (
                  <div className="quiz-report-panel">
                    <label>
                      Raison
                      <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                        {reportReasons.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Details (optionnel)
                      <textarea
                        rows={3}
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                      />
                    </label>
                    <div className="quiz-report-actions">
                      <button type="button" onClick={() => submitReport(question.id)}>
                        Envoyer
                      </button>
                      <button type="button" className="ghost" onClick={() => setReporting(false)}>
                        Annuler
                      </button>
                    </div>
                    {reportStatus && <p className="result-subtle">{reportStatus}</p>}
                  </div>
                )}
              </>
            ) : (
              <p className="quiz-report-hint">Connectez-vous pour signaler une question.</p>
            )}
          </div>

          <div className="quiz-stats">
            <div className="stat">
              <span>Score</span>
              <strong>{score}/{currentIndex + 1}</strong>
            </div>
            <div className="stat">
              <span>Moyenne</span>
              <strong>{Math.round((score / (currentIndex + 1)) * 100)}%</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (status === 'results' && userResult) {
    const totalQuestions = userResult.totalQuestions || userResult.total_questions || 20;
    return (
      <div className="quiz-container">
        <div className="results-card">
          <h2>✅ Quiz Terminé!</h2>
          
          <div className="results-summary">
            <div className="result-item">
              <div className="score-circle">
                <span className="score-number">{userResult.score}/{totalQuestions}</span>
              </div>
            </div>
            <div className="result-item">
              <p className="result-label">Pourcentage</p>
              <p className="result-value">{userResult.percentage}%</p>
            </div>
            <div className="result-item">
              <p className="result-label">Niveau</p>
              <p className="result-value" style={{ color: getLevelColor(userResult.level) }}>
                {userResult.level.toUpperCase()}
              </p>
            </div>
            <div className="result-item">
              <p className="result-label">Rang du jour</p>
              <p className="result-value">
                {userResult.dailyRank ? `#${userResult.dailyRank}` : '-'}
              </p>
              {userResult.dailyRankLevel && (
                <small className="result-subtle">Niveau: #{userResult.dailyRankLevel}</small>
              )}
            </div>
            <div className="result-item">
              <p className="result-label">Rang hebdo</p>
              <p className="result-value">#{userResult.rank}</p>
            </div>
            <div className="result-item">
              <p className="result-label">Rang mensuel</p>
              <p className="result-value">
                {userResult.monthlyRank ? `#${userResult.monthlyRank}` : '-'}
              </p>
            </div>
            <div className="result-item">
              <p className="result-label">Rang saison</p>
              <p className="result-value">
                {userResult.seasonRank ? `#${userResult.seasonRank}` : '-'}
              </p>
            </div>
          </div>

          <div className="leaderboard-section">
            <h3>🏅 Classement du Jour</h3>
            {dailyLeaderboard.length === 0 && <p>Aucun score disponible.</p>}
            {dailyLeaderboard.length > 0 && (
              <div className="leaderboard-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rang</th>
                      <th>Nom</th>
                      <th>Score</th>
                      <th>%</th>
                      <th>Niveau</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyLeaderboard.map((entry) => (
                      <tr key={`day-${entry.rank}`} className={entry.rank <= 3 ? 'top-rank' : ''}>
                        <td>
                          <strong>
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                          </strong>
                        </td>
                        <td>{entry.name}</td>
                        <td>{entry.score}/20</td>
                        <td>{entry.percentage}%</td>
                        <td style={{ color: getLevelColor(entry.level), fontWeight: 'bold' }}>
                          {entry.level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="leaderboard-section">
            <h3>🏆 Classement de la Semaine</h3>
            <div className="leaderboard-table">
              <table>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Nom</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 20).map((entry) => (
                    <tr key={entry.rank} className={entry.rank <= 3 ? 'top-rank' : ''}>
                      <td>
                        <strong>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                        </strong>
                      </td>
                      <td>{entry.name}</td>
                      <td>{entry.score}/20</td>
                      <td>{entry.percentage}%</td>
                      <td style={{ color: getLevelColor(entry.level), fontWeight: 'bold' }}>
                        {entry.level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button className="quiz-retry-btn" onClick={() => window.location.reload()}>
            Retour à l'Accueil
          </button>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="quiz-container">
        <div className="quiz-header-card">
          <h2>Quiz deja complete</h2>
          <p>Vous avez deja participe aujourd'hui. Revenez demain pour un nouveau quiz.</p>
        </div>
        <button className="quiz-retry-btn" onClick={() => window.location.reload()}>
          Retour
        </button>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className="quiz-container">
        <div className="quiz-header-card">
          <h2>Quiz ferme</h2>
          <p>Disponible tous les jours de {openWindow.from} a {openWindow.until}.</p>
        </div>
        <button className="quiz-retry-btn" onClick={() => window.location.reload()}>
          Reessayer
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="quiz-container">
        <div className="quiz-header-card">
          <h2>Erreur</h2>
          <p>{errorMessage || 'Une erreur est survenue.'}</p>
        </div>
        <button className="quiz-retry-btn" onClick={() => window.location.reload()}>
          Reessayer
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <p>Chargement...</p>
    </div>
  );
};

export default Quiz;
