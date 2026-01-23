function calculateLevel(correctAnswers) {
  if (correctAnswers < 5) return 'beginner';
  if (correctAnswers < 10) return 'intermediate';
  if (correctAnswers < 15) return 'advanced';
  return 'expert';
}

module.exports = {
  calculateLevel
};
