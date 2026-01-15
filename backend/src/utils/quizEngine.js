// Islamic quiz questions database - generated dynamically each day
const islamicQuestionBank = {
  // Surah and Quran questions
  quran: [
    {
      question: "Quel est le nom du premier Surah du Coran?",
      options: ["Al-Fatiha", "Al-Baqarah", "Al-Imran", "An-Nisa"],
      correct: 0,
      difficulty: "easy"
    },
    {
      question: "Combien de sourates compte le Coran?",
      options: ["104", "114", "124", "134"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "Quel est le verset le plus long du Coran?",
      options: ["Ayat al-Kursī", "Ayat al-Dain", "Ayat al-Nur", "Ayat al-Rahman"],
      correct: 1,
      difficulty: "hard"
    },
    {
      question: "En quelle année le Coran a-t-il été révélé?",
      options: ["610 AC", "620 AC", "630 AC", "640 AC"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "Quel Surah est connu comme le cœur du Coran?",
      options: ["Ya-Sin", "Al-Fatiha", "Al-Ikhlas", "Al-Qadr"],
      correct: 0,
      difficulty: "hard"
    }
  ],

  // Hadith questions
  hadith: [
    {
      question: "Qui est le narrateur le plus fiable des hadiths?",
      options: ["Abu Huraira", "Aïcha", "Ali ibn Abi Talib", "Abdullah ibn Abbas"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "Quel est le plus important recueil de hadith?",
      options: ["Sahih al-Bukhari", "Sahih Muslim", "Sunan Abu Dawood", "Jami' at-Tirmidhi"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que la 'Sunna'?",
      options: ["Les pratiques du Prophète", "Les versets du Coran", "Les interprétations", "Les débats théologiques"],
      correct: 0,
      difficulty: "easy"
    },
    {
      question: "Combien de hadiths fiables sont dans Sahih al-Bukhari?",
      options: ["7275", "9144", "5374", "6236"],
      correct: 0,
      difficulty: "hard"
    }
  ],

  // Islamic history
  history: [
    {
      question: "En quelle année l'Hégire a-t-elle lieu?",
      options: ["610 AC", "622 AC", "632 AC", "650 AC"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Qui est le prophète Adam?",
      options: ["Le premier prophète", "Le deuxième prophète", "Le prophète des montagnes", "Le prophète des villes"],
      correct: 0,
      difficulty: "easy"
    },
    {
      question: "Combien de prophètes sont mentionnés dans le Coran?",
      options: ["25", "28", "30", "32"],
      correct: 1,
      difficulty: "hard"
    },
    {
      question: "Quel est le plus grand hadj jamais enregistré?",
      options: ["Hadj du Prophète", "Hadj de Umar", "Hadj de Ali", "Hadj moderne"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "Qui a compilé le Coran pendant le règne d'Uthman?",
      options: ["Zaid ibn Thabit", "Abdullah ibn Mas'ud", "Ali ibn Abi Talib", "Abdullah ibn Abbas"],
      correct: 0,
      difficulty: "hard"
    }
  ],

  // Islamic practices
  practices: [
    {
      question: "Combien de piliers l'Islam a-t-il?",
      options: ["3", "5", "7", "9"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Quel est le premier pilier de l'Islam?",
      options: ["Salah", "Shahada", "Zakat", "Hajj"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Combien de prières obligatoires par jour?",
      options: ["3", "4", "5", "6"],
      correct: 2,
      difficulty: "easy"
    },
    {
      question: "En quel mois du calendrier musulman on observe le jeûne?",
      options: ["Muharram", "Ramadan", "Dhul-Hijjah", "Shawwal"],
      correct: 1,
      difficulty: "easy"
    },
    {
      question: "Quel est le taux minimal de Zakat?",
      options: ["1%", "2%", "2.5%", "5%"],
      correct: 2,
      difficulty: "medium"
    },
    {
      question: "Quel est le nombre de stations du Hajj?",
      options: ["3", "5", "7", "9"],
      correct: 2,
      difficulty: "hard"
    }
  ],

  // Islamic scholars
  scholars: [
    {
      question: "Qui est l'Imam Al-Bukhari?",
      options: ["Un collecteur de Hadith", "Un juriste", "Un théologien", "Un grammairien"],
      correct: 0,
      difficulty: "medium"
    },
    {
      question: "Combien d'écoles juridiques principales l'Islam sunnite compte-t-il?",
      options: ["3", "4", "5", "6"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "Qui est Ibn Taymiyyah?",
      options: ["Un juriste hanbalite", "Un hadith", "Un grammairien", "Un poète"],
      correct: 0,
      difficulty: "hard"
    }
  ],

  // Islamic ethics
  ethics: [
    {
      question: "Quel est le concept d'Adl en Islam?",
      options: ["Injustice", "Justice", "Miséricorde", "Charité"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "Qu'est-ce que le 'Ihsan'?",
      options: ["La prière", "L'excellence et la perfection", "Le jeûne", "L'aumône"],
      correct: 1,
      difficulty: "medium"
    },
    {
      question: "Quel est le plus grand péché en Islam?",
      options: ["Le vol", "Le meurtre", "L'associationnisme", "Le mensonge"],
      correct: 2,
      difficulty: "medium"
    }
  ]
};

// Helper function to generate daily questions
function generateDailyQuestions() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = parseInt(today.replace(/-/g, '')); // Convert date to number for seeding
  
  // Use a seeded random for consistent daily questions
  const rng = mulberry32(seed);
  
  const questions = [];
  const categories = Object.keys(islamicQuestionBank);
  
  // Generate 20 questions
  while (questions.length < 20) {
    const category = categories[Math.floor(rng() * categories.length)];
    const questionList = islamicQuestionBank[category];
    const question = questionList[Math.floor(rng() * questionList.length)];
    
    // Avoid duplicates
    if (!questions.some(q => q.question === question.question)) {
      questions.push(question);
    }
  }
  
  return questions;
}

// Seeded random number generator
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Calculate difficulty level based on correct answers
function calculateLevel(correctAnswers) {
  if (correctAnswers < 5) return 'beginner';
  if (correctAnswers < 10) return 'intermediate';
  if (correctAnswers < 15) return 'advanced';
  return 'expert';
}

module.exports = {
  islamicQuestionBank,
  generateDailyQuestions,
  calculateLevel,
  mulberry32
};
