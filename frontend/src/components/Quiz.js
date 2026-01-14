import React, { useState, useEffect } from 'react';
import { quizService } from '../services/api';
import '../styles/Quiz.css';

function Quiz({ userId, userName }) {
  const [status, setStatus] = useState('start'); // start, loading, quiz, results
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [attemptId, setAttemptId] = useState(null);
  const [results, setResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (status === 'quiz' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'quiz' && timeLeft === 0) {
      handleSubmitQuiz();
    }
  }, [status, timeLeft]);

  const startQuiz = async () => {
    setStatus('loading');
    try {
      const response = await quizService.getQuestions();
      setQuestions(response.data.data);
      
      const startResponse = await quizService.startQuiz({
        user_id: userId,
        user_name: userName
      });
      
      setAttemptId(startResponse.data.data.attempt_id);
      setStatus('quiz');
    } catch (error) {
      console.error('Erreur', error);
      setStatus('start');
    }
  };

  const handleAnswer = (answer) => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers({...answers, [questionId]: answer});
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attemptId) return;
    
    try {
      const response = await quizService.submitQuiz({
        attempt_id: attemptId,
        answers
      });
      
      setResults(response.data.data);
      
      // Charger le classement
      const leaderboardResponse = await quizService.getLeaderboard();
      setLeaderboard(leaderboardResponse.data.data);
      
      setStatus('results');
    } catch (error) {
      console.error('Erreur', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Page de démarrage
  if (status === 'start') {
    return (
      <div className="quiz-container">
        <div className="quiz-start">
          <h1>🕌 Quiz Islamique</h1>
          <p className="subtitle">Association des Serviteurs d'Allah Azawajal</p>
          <div className="quiz-info">
            <h3>Bienvenue au Quiz Islamique ASAA!</h3>
            <ul>
              <li>✅ 20 questions sur l'Islam</li>
              <li>⏱️ Durée: 20 minutes</li>
              <li>📊 Classement automatique</li>
              <li>📖 Explications pour chaque réponse</li>
            </ul>
            <button onClick={startQuiz} className="start-btn">
              Commencer le Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Page du quiz
  if (status === 'quiz' && questions.length > 0) {
    const question = questions[currentQuestionIndex];
    const answered = answers[question.id] !== undefined;

    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Quiz Islamique</h2>
          <div className="quiz-timer">
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p>Question {currentQuestionIndex + 1} sur {questions.length}</p>
        </div>

        <div className="quiz-content">
          <h3>{question.question_text}</h3>
          
          <div className="quiz-options">
            {Object.entries(question.options).map(([key, value]) => (
              <button
                key={key}
                className={`option-btn ${answers[question.id] === key ? 'selected' : ''}`}
                onClick={() => handleAnswer(key)}
              >
                <span className="option-letter">{key.toUpperCase()}</span>
                <span className="option-text">{value}</span>
              </button>
            ))}
          </div>

          <div className="quiz-navigation">
            <button 
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="nav-btn"
            >
              ← Précédent
            </button>
            
            {currentQuestionIndex === questions.length - 1 ? (
              <button 
                onClick={handleSubmitQuiz}
                disabled={Object.keys(answers).length !== questions.length}
                className="submit-btn"
              >
                Soumettre le Quiz
              </button>
            ) : (
              <button 
                onClick={nextQuestion}
                className="nav-btn"
              >
                Suivant →
              </button>
            )}
          </div>

          <div className="answered-count">
            Réponses: {Object.keys(answers).length}/{questions.length}
          </div>
        </div>
      </div>
    );
  }

  // Page des résultats
  if (status === 'results' && results) {
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <h1>📊 Résultats</h1>
          
          <div className="score-card">
            <h2>Votre Score</h2>
            <div className="score-display">
              <span className="score-value">{results.score}</span>
              <span className="score-total">/ {results.total_questions}</span>
              <span className="score-percentage">{results.percentage}%</span>
            </div>
            <p className="time-spent">Temps écoulé: {Math.floor(results.time_spent_seconds / 60)} min {results.time_spent_seconds % 60} sec</p>
          </div>

          <div className="leaderboard-section">
            <h2>🏆 Classement</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Nom</th>
                  <th>Score</th>
                  <th>Pourcentage</th>
                  <th>Temps (sec)</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry) => (
                  <tr key={entry.rank} className={entry.user_name === userName ? 'current-user' : ''}>
                    <td>{entry.rank}</td>
                    <td>{entry.user_name}</td>
                    <td>{entry.score}/{entry.total_questions}</td>
                    <td>{entry.percentage}%</td>
                    <td>{entry.time_spent_seconds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => {
              setStatus('start');
              setAnswers({});
              setCurrentQuestionIndex(0);
              setTimeLeft(1200);
            }}
            className="restart-btn"
          >
            Refaire le Quiz
          </button>
        </div>
      </div>
    );
  }

  return <div className="quiz-container"><p>Chargement...</p></div>;
}

export default Quiz;
