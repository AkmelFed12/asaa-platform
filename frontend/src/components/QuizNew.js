import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/Quiz.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Quiz = ({ user }) => {
  const fallbackUserIdRef = useRef(`guest_${Date.now()}`);
  const [status, setStatus] = useState('loading'); // loading, start, quiz, results
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userResult, setUserResult] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [openWindow, setOpenWindow] = useState({ from: '20:00', until: '23:59' });
  const resolvedUserId = user?.id || fallbackUserIdRef.current;
  const resolvedName = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Participant';

  // Charger le quiz du jour
  useEffect(() => {
    loadDailyQuiz();
  }, []);

  const loadDailyQuiz = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/quiz/daily/quiz`);
      setQuestions(response.data.questions);
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
        name: resolvedName
      });
      setStatus('quiz');
      setTimeLeft(10);
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error)) {
        setErrorMessage('Erreur lors du demarrage du quiz.');
        setStatus('error');
      }
    }
  };

  const handleSubmitAnswer = async (selectedIndex) => {
    setAnswered(true);
    setSelectedOption(selectedIndex);

    try {
      const response = await axios.post(`${API_URL}/api/quiz/daily/answer`, {
        userId: resolvedUserId,
        questionIndex: currentIndex,
        selectedIndex,
        timeSpent: 10 - timeLeft
      });

      if (response.data.isCorrect) {
        setScore(score + 1);
      }

      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(currentIndex + 1);
          setTimeLeft(10);
          setAnswered(false);
          setSelectedOption(null);
        } else {
          completeQuiz();
        }
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error)) {
        setErrorMessage('Erreur lors de l\'envoi de la reponse.');
        setStatus('error');
      }
    }
  };

  const completeQuiz = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/quiz/daily/complete`, {
        userId: resolvedUserId
      });

      setUserResult(response.data);
      await loadLeaderboard();
      setStatus('results');
    } catch (error) {
      console.error('Error:', error);
      if (!handleQuizClosed(error)) {
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

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#F44336'
    };
    return colors[difficulty] || '#2196F3';
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

  // Start screen
  if (status === 'start') {
    return (
      <div className="quiz-container">
        <div className="quiz-header-card">
          <h2>📚 Quiz Islamique Quotidien</h2>
          <p>Commence à 20h00 • 20 questions • 10 secondes par question</p>
        </div>

        <div className="quiz-info-grid">
          <div className="info-card">
            <h3>🎯 Format</h3>
            <p>20 questions différentes chaque jour</p>
          </div>
          <div className="info-card">
            <h3>⏱️ Temps</h3>
            <p>10 secondes par question</p>
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
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
            >
              {question.difficulty}
            </span>
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
    return (
      <div className="quiz-container">
        <div className="results-card">
          <h2>✅ Quiz Terminé!</h2>
          
          <div className="results-summary">
            <div className="result-item">
              <div className="score-circle">
                <span className="score-number">{userResult.score}/20</span>
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
              <p className="result-label">Rang</p>
              <p className="result-value">#{userResult.rank}</p>
            </div>
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
