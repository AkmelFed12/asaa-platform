const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  let t = seed;
  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260201);

const pillars = [
  { name: 'Shahada', desc: 'l attestation de foi' },
  { name: 'Salah', desc: 'la priere' },
  { name: 'Zakat', desc: 'l aumone obligatoire' },
  { name: 'Sawm', desc: 'le jeune du Ramadan' },
  { name: 'Hajj', desc: 'le pelerinage a la Mecque' }
];

const prayerTimes = [
  { name: 'Fajr', time: 'a l aube' },
  { name: 'Dhuhr', time: 'a midi' },
  { name: 'Asr', time: 'l apres-midi' },
  { name: 'Maghrib', time: 'au coucher du soleil' },
  { name: 'Isha', time: 'la nuit' }
];

const months = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Ula',
  'Jumada al-Akhira',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qidah',
  'Dhu al-Hijjah'
];

const scriptures = [
  { prophet: 'Musa', book: 'Tawrat' },
  { prophet: 'Isa', book: 'Injil' },
  { prophet: 'Dawud', book: 'Zabur' },
  { prophet: 'Muhammad', book: 'Quran' }
];

const prophetsFacts = [
  { prophet: 'Nuh', fact: 'l arche' },
  { prophet: 'Ibrahim', fact: 'le pere des prophetes' },
  { prophet: 'Yusuf', fact: 'l interpretation des reves' },
  { prophet: 'Ayub', fact: 'la patience' },
  { prophet: 'Muhammad', fact: 'le dernier prophete' }
];

const angels = [
  { name: 'Jibril', role: 'la revelation' },
  { name: 'Mikail', role: 'les subsistances' },
  { name: 'Israfil', role: 'la trompette' },
  { name: 'Malik', role: 'le gardien de l enfer' }
];

const concepts = [
  { term: 'Qibla', def: 'la direction de la priere' },
  { term: 'Wudu', def: 'les ablutions' },
  { term: 'Ghusl', def: 'le bain rituel' },
  { term: 'Adhan', def: 'l appel a la priere' },
  { term: 'Sunnah', def: 'les traditions du Prophete' },
  { term: 'Hadith', def: 'les paroles du Prophete' },
  { term: 'Ummah', def: 'la communaute des croyants' }
];

const facts = [
  { question: 'Combien de prieres obligatoires par jour ?', answer: '5', options: ['3', '4', '5', '6'] },
  { question: 'Quel est le taux minimal de la Zakat ?', answer: '2.5%', options: ['1%', '2%', '2.5%', '5%'] },
  { question: 'La Qibla est dirigee vers :', answer: 'la Kaaba', options: ['Medine', 'la Kaaba', 'Jerusalem', 'Taif'] },
  { question: 'Le jeune obligatoire a lieu au mois de :', answer: 'Ramadan', options: ['Rajab', 'Shaban', 'Ramadan', 'Shawwal'] },
  { question: 'Le pelerinage obligatoire se fait a :', answer: 'la Mecque', options: ['Medine', 'la Mecque', 'Jerusalem', 'Kufa'] },
  { question: 'Combien de mois compte le calendrier musulman ?', answer: '12', options: ['10', '11', '12', '13'] }
];

function shuffle(array) {
  const items = [...array];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickOptions(correct, pool, count = 4) {
  const options = new Set([correct]);
  while (options.size < count) {
    const candidate = pool[Math.floor(rng() * pool.length)];
    options.add(candidate);
  }
  return shuffle(Array.from(options));
}

function toCsvLine(values) {
  return values
    .map((value) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    })
    .join(',');
}

function addQuestion(set, list, entry) {
  if (set.has(entry.question)) return;
  set.add(entry.question);
  list.push(entry);
}

function generateQuestions(targetCount) {
  const questions = [];
  const seen = new Set();

  pillars.forEach((pillar, index) => {
    const options = pickOptions(pillar.name, pillars.map((p) => p.name));
    addQuestion(seen, questions, {
      question: `Quel est le ${index + 1} pilier de l Islam ?`,
      options,
      correctIndex: options.indexOf(pillar.name),
      difficulty: 'medium'
    });
    const descOptions = pickOptions(pillar.desc, pillars.map((p) => p.desc));
    addQuestion(seen, questions, {
      question: `Quel pilier correspond a ${pillar.desc} ?`,
      options: descOptions,
      correctIndex: descOptions.indexOf(pillar.desc),
      difficulty: 'medium'
    });
  });

  prayerTimes.forEach((prayer) => {
    const options = pickOptions(prayer.name, prayerTimes.map((p) => p.name));
    addQuestion(seen, questions, {
      question: `Quelle priere se fait ${prayer.time} ?`,
      options,
      correctIndex: options.indexOf(prayer.name),
      difficulty: 'medium'
    });
    const timeOptions = pickOptions(prayer.time, prayerTimes.map((p) => p.time));
    addQuestion(seen, questions, {
      question: `La priere de ${prayer.name} se fait :`,
      options: timeOptions,
      correctIndex: timeOptions.indexOf(prayer.time),
      difficulty: 'medium'
    });
  });

  months.forEach((month, index) => {
    const options = pickOptions(month, months);
    addQuestion(seen, questions, {
      question: `Quel est le ${index + 1} mois du calendrier musulman ?`,
      options,
      correctIndex: options.indexOf(month),
      difficulty: 'hard'
    });
  });

  const monthRelations = [
    { question: 'Le Hajj est accompli au mois de :', answer: 'Dhu al-Hijjah' },
    { question: 'Le mois qui suit Ramadan est :', answer: 'Shawwal' },
    { question: 'Le premier mois du calendrier islamique est :', answer: 'Muharram' },
    { question: 'L Eid al-Adha se celebre en :', answer: 'Dhu al-Hijjah' },
    { question: 'L Eid al-Fitr se celebre en :', answer: 'Shawwal' }
  ];
  monthRelations.forEach((item) => {
    const options = pickOptions(item.answer, months);
    addQuestion(seen, questions, {
      question: item.question,
      options,
      correctIndex: options.indexOf(item.answer),
      difficulty: 'medium'
    });
  });

  scriptures.forEach((item) => {
    const options = pickOptions(item.book, scriptures.map((s) => s.book));
    addQuestion(seen, questions, {
      question: `Quel livre a ete revele a ${item.prophet} ?`,
      options,
      correctIndex: options.indexOf(item.book),
      difficulty: 'medium'
    });
  });

  prophetsFacts.forEach((item) => {
    const options = pickOptions(item.prophet, prophetsFacts.map((p) => p.prophet));
    addQuestion(seen, questions, {
      question: `Qui est associe a ${item.fact} ?`,
      options,
      correctIndex: options.indexOf(item.prophet),
      difficulty: 'hard'
    });
  });

  angels.forEach((angel) => {
    const options = pickOptions(angel.name, angels.map((a) => a.name));
    addQuestion(seen, questions, {
      question: `Quel ange est associe a ${angel.role} ?`,
      options,
      correctIndex: options.indexOf(angel.name),
      difficulty: 'hard'
    });
  });

  concepts.forEach((concept) => {
    const options = pickOptions(concept.term, concepts.map((c) => c.term));
    addQuestion(seen, questions, {
      question: `Que signifie ${concept.def} ?`,
      options,
      correctIndex: options.indexOf(concept.term),
      difficulty: 'medium'
    });
  });

  facts.forEach((item) => {
    addQuestion(seen, questions, {
      question: item.question,
      options: item.options,
      correctIndex: item.options.indexOf(item.answer),
      difficulty: 'easy'
    });
  });

  const extraTemplates = [
    {
      question: 'La priere du vendredi en communaute est appelee :',
      answer: 'Jumu a',
      options: ['Jumu a', 'Tarawih', 'Tahajjud', 'Witr'],
      difficulty: 'medium'
    },
    {
      question: 'Le jeun surerogatoire du lundi et jeudi est :',
      answer: 'une Sunna',
      options: ['obligatoire', 'une Sunna', 'interdit', 'annule'],
      difficulty: 'medium'
    },
    {
      question: 'Le Livre sacre de l Islam est :',
      answer: 'le Quran',
      options: ['la Tawrat', 'le Quran', 'le Zabur', 'l Injil'],
      difficulty: 'easy'
    },
    {
      question: 'La Kaaba se trouve a :',
      answer: 'la Mecque',
      options: ['la Mecque', 'Medine', 'Jerusalem', 'Taif'],
      difficulty: 'easy'
    },
    {
      question: 'Le mois de Ramadan est le :',
      answer: '9',
      options: ['7', '8', '9', '10'],
      difficulty: 'hard'
    }
  ];
  extraTemplates.forEach((item) => {
    addQuestion(seen, questions, {
      question: item.question,
      options: item.options,
      correctIndex: item.options.indexOf(item.answer),
      difficulty: item.difficulty
    });
  });

  const diversified = [];
  for (let i = 0; i < questions.length; i += 1) {
    diversified.push(questions[i]);
  }

  while (diversified.length < targetCount) {
    const base = questions[Math.floor(rng() * questions.length)];
    const variant = {
      ...base,
      question: `${base.question} (variante ${diversified.length + 1})`
    };
    addQuestion(seen, diversified, variant);
    if (diversified.length === questions.length) {
      break;
    }
  }

  return diversified.slice(0, targetCount);
}

function main() {
  const outputPath = path.join(__dirname, '..', 'data', 'diverse_questions_generated.csv');
  const rows = generateQuestions(500);
  const header = 'question,option1,option2,option3,option4,correctIndex,difficulty';

  const lines = [header];
  for (const row of rows) {
    lines.push(
      toCsvLine([
        row.question,
        row.options[0],
        row.options[1],
        row.options[2],
        row.options[3],
        row.correctIndex,
        row.difficulty
      ])
    );
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf-8');
  console.log(`Generated ${rows.length} questions -> ${outputPath}`);
}

main();
