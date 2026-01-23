function seedQuestions() {
  return [
    // Quran
    {
      question: 'Quel est le nom du premier Surah du Coran?',
      options: ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa'],
      correct: 0,
      difficulty: 'easy'
    },
    {
      question: 'Combien de sourates compte le Coran?',
      options: ['104', '114', '124', '134'],
      correct: 1,
      difficulty: 'medium'
    },
    {
      question: 'Quel est le verset le plus long du Coran?',
      options: ['Ayat al-Kursi', 'Ayat al-Dain', 'Ayat al-Nur', 'Ayat al-Rahman'],
      correct: 1,
      difficulty: 'hard'
    },
    {
      question: 'En quelle annee le Coran a-t-il ete revele?',
      options: ['610 AC', '620 AC', '630 AC', '640 AC'],
      correct: 0,
      difficulty: 'medium'
    },
    {
      question: 'Quel Surah est connu comme le coeur du Coran?',
      options: ['Ya-Sin', 'Al-Fatiha', 'Al-Ikhlas', 'Al-Qadr'],
      correct: 0,
      difficulty: 'hard'
    },

    // Hadith
    {
      question: 'Qui est le narrateur le plus fiable des hadiths?',
      options: ['Abu Huraira', 'Aicha', 'Ali ibn Abi Talib', 'Abdullah ibn Abbas'],
      correct: 1,
      difficulty: 'medium'
    },
    {
      question: 'Quel est le plus important recueil de hadith?',
      options: ['Sahih al-Bukhari', 'Sahih Muslim', 'Sunan Abu Dawood', 'Jami at-Tirmidhi'],
      correct: 0,
      difficulty: 'medium'
    },
    {
      question: "Qu'est-ce que la Sunna?",
      options: ['Les pratiques du Prophete', 'Les versets du Coran', 'Les interpretations', 'Les debats theologiques'],
      correct: 0,
      difficulty: 'easy'
    },
    {
      question: 'Combien de hadiths fiables sont dans Sahih al-Bukhari?',
      options: ['7275', '9144', '5374', '6236'],
      correct: 0,
      difficulty: 'hard'
    },

    // History
    {
      question: "En quelle annee l'Hegire a-t-elle lieu?",
      options: ['610 AC', '622 AC', '632 AC', '650 AC'],
      correct: 1,
      difficulty: 'easy'
    },
    {
      question: "Qui est le prophete Adam?",
      options: ['Le premier prophete', 'Le deuxieme prophete', 'Le prophete des montagnes', 'Le prophete des villes'],
      correct: 0,
      difficulty: 'easy'
    },
    {
      question: 'Combien de prophetes sont mentionnes dans le Coran?',
      options: ['25', '28', '30', '32'],
      correct: 0,
      difficulty: 'hard'
    },
    {
      question: 'Quel est le plus grand hadj jamais enregistre?',
      options: ['Hadj du Prophete', 'Hadj de Umar', 'Hadj de Ali', 'Hadj moderne'],
      correct: 0,
      difficulty: 'medium'
    },
    {
      question: "Qui a compile le Coran pendant le regne d'Uthman?",
      options: ['Zaid ibn Thabit', "Abdullah ibn Mas'ud", 'Ali ibn Abi Talib', 'Abdullah ibn Abbas'],
      correct: 0,
      difficulty: 'hard'
    },

    // Practices
    {
      question: "Combien de piliers l'Islam a-t-il?",
      options: ['3', '5', '7', '9'],
      correct: 1,
      difficulty: 'easy'
    },
    {
      question: "Quel est le premier pilier de l'Islam?",
      options: ['Salah', 'Shahada', 'Zakat', 'Hajj'],
      correct: 1,
      difficulty: 'easy'
    },
    {
      question: 'Combien de prieres obligatoires par jour?',
      options: ['3', '4', '5', '6'],
      correct: 2,
      difficulty: 'easy'
    },
    {
      question: 'En quel mois du calendrier musulman on observe le jeune?',
      options: ['Muharram', 'Ramadan', 'Dhul-Hijjah', 'Shawwal'],
      correct: 1,
      difficulty: 'easy'
    },
    {
      question: 'Quel est le taux minimal de Zakat?',
      options: ['1%', '2%', '2.5%', '5%'],
      correct: 2,
      difficulty: 'medium'
    },
    {
      question: 'Quel est le nombre de stations du Hajj?',
      options: ['3', '5', '7', '9'],
      correct: 2,
      difficulty: 'hard'
    },

    // Scholars
    {
      question: "Qui est l'Imam Al-Bukhari?",
      options: ['Un collecteur de Hadith', 'Un juriste', 'Un theologien', 'Un grammairien'],
      correct: 0,
      difficulty: 'medium'
    },
    {
      question: "Combien d'ecoles juridiques principales l'Islam sunnite compte-t-il?",
      options: ['3', '4', '5', '6'],
      correct: 1,
      difficulty: 'medium'
    },
    {
      question: 'Qui est Ibn Taymiyyah?',
      options: ['Un juriste hanbalite', 'Un hadith', 'Un grammairien', 'Un poete'],
      correct: 0,
      difficulty: 'hard'
    },

    // Ethics
    {
      question: "Quel est le concept d'Adl en Islam?",
      options: ['Injustice', 'Justice', 'Misericorde', 'Charite'],
      correct: 1,
      difficulty: 'medium'
    },
    {
      question: "Qu'est-ce que le Ihsan?",
      options: ["La priere", "L'excellence et la perfection", 'Le jeune', "L'aumone"],
      correct: 1,
      difficulty: 'medium'
    },
    {
      question: 'Quel est le plus grand peche en Islam?',
      options: ['Le vol', 'Le meurtre', "L'associationnisme", 'Le mensonge'],
      correct: 2,
      difficulty: 'medium'
    }
  ];
}

module.exports = {
  seedQuestions
};
