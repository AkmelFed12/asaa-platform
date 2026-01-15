import React, { useState, useEffect } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import '../styles/Quiz.css';

/**
 * Enhanced Quiz Component with Real-Time Updates
 */
const QuizLive = () => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(10);
  const [completed, setCompleted] = useState(false);
  const [liveLeaderboard, setLiveLeaderboard] = useState([]);
  const [userId] = useState(`user_${Date.now()}`);
  const [userName] = useState('Player ' + Math.floor(Math.random() * 1000));
  const [userEmail] = useState('player@asaa.com');
  const [attemptId, setAttemptId] = useState(null);

  // WebSocket connection
  const {
    connected,
    data: wsData,
    joinRoom,
    send: sendWs
  } = useWebSocket(null, {
    autoJoinRooms: ['leaderboard-daily'],
    autoReconnect: true
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (wsData?.type === 'LEADERBOARD_UPDATE') {
      setLiveLeaderboard(prev => {
        // Add or update leaderboard entry
        const existing = prev.findIndex(l => l.name === wsData.payload.name);
        if (existing !== -1) {
          const updated = [...prev];
          updated[existing] = wsData.payload;
          return updated.sort((a, b) => b.score - a.score);
        }
        return [...prev, wsData.payload].sort((a, b) => b.score - a.score);
      });
    }
  }, [wsData]);

  // Load quiz on mount
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch('/api/quiz/daily/quiz');
        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error('Error loading quiz:', error);
      }
    };

    loadQuiz();
  }, []);

  // Start quiz
  const startQuiz = async () => {
    try {
      const response = await fetch('/api/quiz/daily/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name: userName, email: userEmail })
      });
      const data = await response.json();
      setAttemptId(data.attemptId);
      setTime(10);
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!attemptId || completed) return;

    const timer = setTimeout(() => {
      if (time > 1) {
        setTime(time - 1);
      } else {
        handleNext();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [time, attemptId, completed]);

  // Submit answer
  const submitAnswer = async (selectedIndex) => {
    if (!quiz || !attemptId) return;

    try {
      const startTime = performance.now();
      const response = await fetch('/api/quiz/daily/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          questionIndex: currentQuestion,
          selectedIndex,
          timeSpent: Math.round((performance.now() - startTime) / 1000)
        })
      });
      const data = await response.json();

      if (data.isCorrect) {
        setScore(data.currentScore);
      }

      // Auto move to next
      setTimeout(() => handleNext(), 500);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  // Move to next question
  const handleNext = () => {
    if (!quiz) return;

    if (currentQuestion < quiz.totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTime(10);
    } else {
      completeQuiz();
    }
  };

  // Complete quiz
  const completeQuiz = async () => {
    try {
      const response = await fetch('/api/quiz/daily/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();

      setCompleted(true);

      // Broadcast completion
      sendWs('USER_COMPLETED_QUIZ', {
        name: userName,
        score: data.score,
        percentage: data.percentage,
        level: data.level,
        rank: data.rank
      });
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  // Render loading state
  if (!quiz) {
    return (
      <div className="quiz-container">
        <div className="loading">Chargement du quiz...</div>
      </div>
    );
  }

  // Render quiz not started
  if (!attemptId) {
    return (
      <div className="quiz-container">
        <h2>🎯 Quiz ASAA Quotidien</h2>
        <p>Questions: {quiz.totalQuestions}</p>
        <p>Temps par question: {quiz.timePerQuestion}s</p>
        <button onClick={startQuiz} className="quiz-btn-start">
          Commencer le Quiz
        </button>
        <div className="connection-status">
          WebSocket: {connected ? '✅ Connecté' : '❌ Déconnecté'}
        </div>
      </div>
    );
  }

  // Render quiz completed
  if (completed) {
    return (
      <div className="quiz-container">
        <h2>🎉 Quiz Terminé!</h2>
        <div className="quiz-result">
          <div className="score-large">{score}/{quiz.totalQuestions}</div>
          <p className="percentage">
            {Math.round((score / quiz.totalQuestions) * 100)}%
          </p>
          <p className="player-name">Bravo {userName}! 🏆</p>
        </div>

        <div className="leaderboard-live">
          <h3>🏅 Classement en direct</h3>
          {liveLeaderboard.length === 0 ? (
            <p>Attente des participants...</p>
          ) : (
            <div className="leaderboard-items">
              {liveLeaderboard.slice(0, 10).map((entry, idx) => (
                <div
                  key={idx}
                  className={`leaderboard-item ${entry.name === userName ? 'highlight' : ''}`}
                >
                  <span className="rank">#{entry.rank || idx + 1}</span>
                  <span className="name">{entry.name}</span>
                  <span className="score">{entry.score} pts</span>
                  <span className="badge">{entry.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => window.location.reload()} className="quiz-btn-start">
          Recommencer Demain
        </button>
      </div>
    );
  }

  // Render active quiz
  const question = quiz.questions[currentQuestion];
  const timerClass = time <= 3 ? 'timer-warning' : '';

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-title">🎯 Quiz ASAA</div>
        <div className={`timer ${timerClass}`}>{time}s</div>
      </div>

      <div className="progress-bar">
        <div
          className="progress"
          style={{
            width: `${((currentQuestion + 1) / quiz.totalQuestions) * 100}%`
          }}
        />
      </div>

      <p className="question-number">
        Question {currentQuestion + 1}/{quiz.totalQuestions}
      </p>

      <div className="question-text">{question.question}</div>

      <div className="options">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            className="option-btn"
            onClick={() => submitAnswer(idx)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="quiz-footer">
        <div className="current-score">Score: {score}/{quiz.totalQuestions}</div>
        <div className="connection-status">
          {connected ? '✅ En direct' : '⚠️  Offline'}
        </div>
      </div>
    </div>
  );
};

export default QuizLive;
