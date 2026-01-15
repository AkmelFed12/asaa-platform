const express = require('express');
const router = express.Router();
const { generateDailyQuestions, calculateLevel } = require('../utils/quizEngine');
const { sendQuizNotification } = require('../utils/emailService');
const websocketManager = require('../utils/websocketManager');

// In-memory storage for daily quiz
let dailyQuiz = {
  date: new Date().toISOString().split('T')[0],
  questions: [],
  attempts: {},
  leaderboard: []
};

// Initialize daily quiz on startup
function initializeDailyQuiz() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  if (dailyQuiz.date !== today) {
    dailyQuiz = {
      date: today,
      questions: generateDailyQuestions(),
      attempts: {},
      leaderboard: []
    };
    console.log(`[${today} 20:00] New daily quiz generated with 20 questions`);
  }
}

// Schedule quiz reset at 20:00 every day
function scheduleQuizReset() {
  const now = new Date();
  let nextReset = new Date(now);
  nextReset.setHours(20, 0, 0, 0);
  
  if (nextReset <= now) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  
  const timeUntilReset = nextReset - now;
  
  setTimeout(() => {
    initializeDailyQuiz();
    scheduleQuizReset();
  }, timeUntilReset);
  
  console.log(`Quiz reset scheduled for ${nextReset.toISOString()}`);
}

// Initialize on startup
initializeDailyQuiz();
scheduleQuizReset();

// Legacy questions for backward compatibility
const quizQuestions = [
  {
    id: 1,
    question_text: 'Combien de piliers y a-t-il dans l\'Islam?',
    options: { a: '4', b: '5', c: '6', d: '7' },
    correct_answer: 'b',
    explanation: 'Les 5 piliers de l\'Islam sont: la Chahada, la Salat, la Zakat, le Sawm et le Hajj.'
  },
  {
    id: 2,
    question_text: 'Quel est le premier pilier de l\'Islam?',
    options: { a: 'La prière', b: 'L\'attestation de foi (Chahada)', c: 'L\'aumône', d: 'Le jeûne' },
    correct_answer: 'b',
    explanation: 'La Chahada est la première condition pour devenir musulman.'
  },
  {
    id: 3,
    question_text: 'En quel année le Coran a-t-il été révélé?',
    options: { a: '620 CE', b: '630 CE', c: '610 CE', d: '640 CE' },
    correct_answer: 'c',
    explanation: 'La première révélation du Coran au Prophète Muhammad s\'est déroulée en 610 CE.'
  },
  {
    id: 4,
    question_text: 'Quel prophète a construit la Kaaba?',
    options: { a: 'Abraham et Ismaël', b: 'Moïse et Aaron', c: 'Noé', d: 'David' },
    correct_answer: 'a',
    explanation: 'Selon le Coran, Ibrahim et Ismaïl ont construit la Kaaba.'
  },
  {
    id: 5,
    question_text: 'Combien de fois par jour un musulman doit-il prier?',
    options: { a: '3 fois', b: '4 fois', c: '5 fois', d: '6 fois' },
    correct_answer: 'c',
    explanation: 'Les 5 prières obligatoires sont: Fajr, Dhuhr, Asr, Maghrib et Isha.'
  },
  {
    id: 6,
    question_text: 'En quel mois doit-on jeûner?',
    options: { a: 'Muharram', b: 'Rajab', c: 'Ramadan', d: 'Dhul-Hijjah' },
    correct_answer: 'c',
    explanation: 'Le jeûne du Ramadan est le 4ème pilier de l\'Islam.'
  },
  {
    id: 7,
    question_text: 'Quel est le dernier prophète envoyé par Allah?',
    options: { a: 'Moïse', b: 'Jésus', c: 'Muhammad', d: 'Abraham' },
    correct_answer: 'c',
    explanation: 'Le Prophète Muhammad est le dernier prophète selon l\'Islam.'
  },
  {
    id: 8,
    question_text: 'Combien de sourates le Coran contient-il?',
    options: { a: '104', b: '114', c: '124', d: '134' },
    correct_answer: 'b',
    explanation: 'Le Coran contient exactement 114 sourates.'
  },
  {
    id: 9,
    question_text: 'Quel est le plus grand mois du calendrier islamique?',
    options: { a: 'Ramadan', b: 'Muharram', c: 'Dhul-Hijjah', d: 'Rajab' },
    correct_answer: 'a',
    explanation: 'Le Ramadan est le 9ème mois du calendrier lunaire islamique.'
  },
  {
    id: 10,
    question_text: 'Qui était le premier calife après le Prophète Muhammad?',
    options: { a: 'Omar ibn al-Khattab', b: 'Othman ibn Affan', c: 'Ali ibn Abi Talib', d: 'Abou Bakr as-Siddiq' },
    correct_answer: 'd',
    explanation: 'Abou Bakr as-Siddiq a été le premier calife bien-guidé.'
  },
  {
    id: 11,
    question_text: 'La Zakat est obligatoire sur quel type de richesse?',
    options: { a: 'Seulement l\'or', b: 'Seulement l\'argent', c: 'Toute forme de richesse qui atteint le Nisab', d: 'Seulement les terres' },
    correct_answer: 'c',
    explanation: 'La Zakat s\'applique à toute richesse accumulée dépassant le Nisab.'
  },
  {
    id: 12,
    question_text: 'Combien d\'années le Prophète Muhammad a-t-il prêché?',
    options: { a: '13 ans', b: '23 ans', c: '33 ans', d: '43 ans' },
    correct_answer: 'b',
    explanation: 'Le Prophète a prêché l\'Islam pendant 23 ans.'
  },
  {
    id: 13,
    question_text: 'Quel est le nom de la migration du Prophète de La Mecque à Médine?',
    options: { a: 'Hijrah', b: 'Hadj', c: 'Haram', d: 'Haraka' },
    correct_answer: 'a',
    explanation: 'La Hijrah marque le début du calendrier islamique.'
  },
  {
    id: 14,
    question_text: 'Combien de versets le Coran contient-il?',
    options: { a: '6000', b: '6236', c: '8000', d: '10000' },
    correct_answer: 'b',
    explanation: 'Le Coran contient 6236 versets selon la majorité des savants.'
  },
  {
    id: 15,
    question_text: 'Quel était le métier du Prophète Muhammad avant sa mission prophétique?',
    options: { a: 'Agriculteur', b: 'Marchand', c: 'Berger', d: 'Soldat' },
    correct_answer: 'b',
    explanation: 'Le Prophète était marchand, travaillant pour Khadija.'
  },
  {
    id: 16,
    question_text: 'En quel lieu a eu lieu la bataille de Badr?',
    options: { a: 'Uhud', b: 'Khandaq', c: 'Badr', d: 'Muta' },
    correct_answer: 'c',
    explanation: 'La bataille de Badr a eu lieu en 625 CE en Arabie Saoudite.'
  },
  {
    id: 17,
    question_text: 'Combien de fils avait le Prophète Muhammad?',
    options: { a: '2', b: '3', c: '4', d: '5' },
    correct_answer: 'b',
    explanation: 'Le Prophète avait 3 fils: Al-Qasim, Abdullah et Ibrahim.'
  },
  {
    id: 18,
    question_text: 'Quel est le titre donné à celui qui a mémorisé le Coran entièrement?',
    options: { a: 'Qari\'', b: 'Hafiz', c: 'Mufti', d: 'Imam' },
    correct_answer: 'b',
    explanation: 'Un Hafiz est celui qui a mémorisé les 114 sourates du Coran.'
  },
  {
    id: 19,
    question_text: 'La première mosquée construite en Islam a été construite dans quel lieu?',
    options: { a: 'La Mecque', b: 'Jérusalem', c: 'Médine', d: 'Damas' },
    correct_answer: 'c',
    explanation: 'La mosquée de Quba a été la première mosquée construite à Médine.'
  },
  {
    id: 20,
    question_text: 'Quel est le mois où a eu lieu la révélation du Coran?',
    options: { a: 'Muharram', b: 'Ramadan', c: 'Dhul-Hijjah', d: 'Safar' },
    correct_answer: 'b',
    explanation: 'Le Coran a été révélé durant le Ramadan de l\'année 610 CE.'
  }
];

// Quiz attempts storage (en production: utiliser la BD)
let quizAttempts = [];

// Get all quiz questions (sans les réponses correctes)
router.get('/questions', (req, res) => {
  const questions = quizQuestions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options
  }));
  
  res.json({
    message: 'Quiz questions retrieved',
    data: questions,
    total: questions.length
  });
});

// Start a quiz attempt
router.post('/start', (req, res) => {
  const { user_id, user_name } = req.body;
  
  if (!user_id || !user_name) {
    return res.status(400).json({ error: 'User ID and name required' });
  }
  
  const attempt = {
    id: Math.random().toString(36).substr(2, 9),
    user_id,
    user_name,
    start_time: Date.now(),
    answers: {},
    status: 'in_progress'
  };
  
  quizAttempts.push(attempt);
  
  res.status(201).json({
    message: 'Quiz attempt started',
    data: { attempt_id: attempt.id }
  });
});

// Submit quiz answers
router.post('/submit', (req, res) => {
  const { attempt_id, answers } = req.body;
  
  if (!attempt_id || !answers) {
    return res.status(400).json({ error: 'Attempt ID and answers required' });
  }
  
  const attempt = quizAttempts.find(a => a.id === attempt_id);
  
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }
  
  // Calculer le score
  let score = 0;
  const answerDetails = [];
  
  Object.entries(answers).forEach(([questionId, userAnswer]) => {
    const question = quizQuestions.find(q => q.id === parseInt(questionId));
    
    if (question) {
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) score++;
      
      answerDetails.push({
        question_id: questionId,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        explanation: question.explanation
      });
    }
  });
  
  attempt.end_time = Date.now();
  attempt.time_spent = Math.round((attempt.end_time - attempt.start_time) / 1000);
  attempt.score = score;
  attempt.total_questions = 20;
  attempt.status = 'completed';
  attempt.answers = answerDetails;
  
  res.json({
    message: 'Quiz submitted successfully',
    data: {
      attempt_id: attempt.id,
      score: score,
      total_questions: 20,
      percentage: Math.round((score / 20) * 100),
      time_spent_seconds: attempt.time_spent,
      answers: answerDetails
    }
  });
});

// Get leaderboard (classement)
router.get('/leaderboard', (req, res) => {
  const leaderboard = quizAttempts
    .filter(a => a.status === 'completed')
    .map(a => ({
      rank: 0,
      user_name: a.user_name,
      score: a.score,
      total_questions: a.total_questions,
      percentage: Math.round((a.score / a.total_questions) * 100),
      time_spent_seconds: a.time_spent,
      attempt_date: new Date(a.end_time).toLocaleString('fr-FR')
    }))
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.time_spent_seconds - b.time_spent_seconds;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  
  res.json({
    message: 'Quiz leaderboard',
    data: leaderboard,
    total: leaderboard.length
  });
});

// Get user quiz history
router.get('/history/:user_id', (req, res) => {
  const { user_id } = req.params;
  
  const userAttempts = quizAttempts
    .filter(a => a.user_id === user_id && a.status === 'completed')
    .map(a => ({
      attempt_id: a.id,
      score: a.score,
      total_questions: a.total_questions,
      percentage: Math.round((a.score / a.total_questions) * 100),
      time_spent_seconds: a.time_spent,
      attempt_date: new Date(a.end_time).toLocaleString('fr-FR')
    }))
    .sort((a, b) => new Date(b.attempt_date) - new Date(a.attempt_date));
  
  res.json({
    message: 'User quiz history',
    data: userAttempts,
    total: userAttempts.length
  });
});

// === NEW DAILY QUIZ ENDPOINTS ===

// GET: Today's quiz (10 seconds per question)
router.get('/daily/quiz', (req, res) => {
  if (dailyQuiz.questions.length === 0) {
    initializeDailyQuiz();
  }
  
  const questionsWithoutAnswers = dailyQuiz.questions.map((q, idx) => ({
    index: idx,
    question: q.question,
    options: q.options,
    difficulty: q.difficulty
  }));
  
  res.json({
    success: true,
    date: dailyQuiz.date,
    totalQuestions: 20,
    timePerQuestion: 10,
    questions: questionsWithoutAnswers
  });
});

// POST: Start daily quiz attempt
router.post('/daily/start', (req, res) => {
  const { userId, email, name } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const attemptId = `attempt_${userId}_${Date.now()}`;
  
  dailyQuiz.attempts[userId] = {
    attemptId,
    userId,
    email,
    name,
    startTime: new Date(),
    answers: [],
    score: 0,
    completed: false
  };
  
  res.json({
    success: true,
    attemptId,
    message: 'Quiz started - 10 seconds per question'
  });
});

// POST: Submit answer to daily quiz
router.post('/daily/answer', (req, res) => {
  const { userId, questionIndex, selectedIndex, timeSpent } = req.body;
  
  if (!dailyQuiz.attempts[userId]) {
    return res.status(400).json({ error: 'Quiz not started' });
  }
  
  if (questionIndex < 0 || questionIndex >= dailyQuiz.questions.length) {
    return res.status(400).json({ error: 'Invalid question' });
  }
  
  const attempt = dailyQuiz.attempts[userId];
  const question = dailyQuiz.questions[questionIndex];
  const isCorrect = selectedIndex === question.correct;
  
  attempt.answers.push({
    questionIndex,
    selectedIndex,
    isCorrect,
    timeSpent,
    questionText: question.question
  });
  
  if (isCorrect) {
    attempt.score++;
  }
  
  res.json({
    success: true,
    isCorrect,
    correctIndex: question.correct,
    currentScore: attempt.score,
    totalQuestions: dailyQuiz.questions.length
  });
});

// POST: Complete daily quiz
router.post('/daily/complete', (req, res) => {
  const { userId } = req.body;
  
  if (!dailyQuiz.attempts[userId]) {
    return res.status(400).json({ error: 'Quiz not started' });
  }
  
  const attempt = dailyQuiz.attempts[userId];
  attempt.completed = true;
  attempt.completionTime = new Date();
  attempt.percentage = Math.round((attempt.score / dailyQuiz.questions.length) * 100);
  attempt.level = calculateLevel(attempt.score);
  
  // Add to leaderboard
  const existingIndex = dailyQuiz.leaderboard.findIndex(l => l.userId === userId);
  
  const leaderboardEntry = {
    userId,
    name: attempt.name,
    email: attempt.email,
    score: attempt.score,
    percentage: attempt.percentage,
    level: attempt.level,
    completionTime: attempt.completionTime
  };
  
  if (existingIndex !== -1) {
    dailyQuiz.leaderboard[existingIndex] = leaderboardEntry;
  } else {
    dailyQuiz.leaderboard.push(leaderboardEntry);
  }
  
  // Sort leaderboard
  dailyQuiz.leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.completionTime - b.completionTime;
  });
  
  const rank = dailyQuiz.leaderboard.findIndex(l => l.userId === userId) + 1;
  
  // Send completion email
  try {
    sendQuizNotification(attempt.email, attempt.name, {
      score: attempt.score,
      total: dailyQuiz.questions.length,
      percentage: attempt.percentage,
      level: attempt.level,
      rank
    })
      .then(() => console.log(`✉️  Quiz result email sent to ${attempt.email}`))
      .catch(err => console.error('Email error:', err.message));
  } catch (error) {
    console.error('Email service error:', error.message);
  }
  
  // Broadcast leaderboard update via WebSocket
  try {
    websocketManager.broadcastToRoom('leaderboard-daily', 'LEADERBOARD_UPDATE', {
      rank,
      name: attempt.name,
      score: attempt.score,
      percentage: attempt.percentage,
      level: attempt.level
    });
  } catch (error) {
    console.error('WebSocket broadcast error:', error.message);
  }
  
  res.json({
    success: true,
    message: 'Quiz completed successfully',
    score: attempt.score,
    totalQuestions: dailyQuiz.questions.length,
    percentage: attempt.percentage,
    level: attempt.level,
    rank,
    totalParticipants: dailyQuiz.leaderboard.length
  });
});

// GET: Daily leaderboard
router.get('/daily/leaderboard', (req, res) => {
  const leaderboard = dailyQuiz.leaderboard
    .slice(0, 100)
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      score: entry.score,
      percentage: entry.percentage,
      level: entry.level
    }));
  
  res.json({
    success: true,
    date: dailyQuiz.date,
    leaderboard,
    totalParticipants: dailyQuiz.leaderboard.length,
    quizStartTime: '20:00',
    nextQuizTime: '20:00 tomorrow'
  });
});

// GET: User's daily result
router.get('/daily/result/:userId', (req, res) => {
  const { userId } = req.params;
  const attempt = dailyQuiz.attempts[userId];
  
  if (!attempt || !attempt.completed) {
    return res.status(404).json({ error: 'Quiz not completed' });
  }
  
  const rank = dailyQuiz.leaderboard.findIndex(l => l.userId === userId) + 1;
  
  res.json({
    success: true,
    score: attempt.score,
    totalQuestions: dailyQuiz.questions.length,
    percentage: attempt.percentage,
    level: attempt.level,
    rank,
    date: dailyQuiz.date,
    answers: attempt.answers
  });
});

module.exports = router;

