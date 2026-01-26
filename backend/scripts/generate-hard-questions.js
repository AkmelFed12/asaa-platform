const fs = require('fs');
const path = require('path');

const surahs = [
  'Al-Fatiha',
  'Al-Baqara',
  'Al Imran',
  'An-Nisa',
  'Al-Ma\'ida',
  'Al-An\'am',
  'Al-A\'raf',
  'Al-Anfal',
  'At-Tawba',
  'Yunus',
  'Hud',
  'Yusuf',
  'Ar-Ra\'d',
  'Ibrahim',
  'Al-Hijr',
  'An-Nahl',
  'Al-Isra',
  'Al-Kahf',
  'Maryam',
  'Ta-Ha',
  'Al-Anbiya',
  'Al-Hajj',
  'Al-Mu\'minun',
  'An-Nur',
  'Al-Furqan',
  'Ash-Shu\'ara',
  'An-Naml',
  'Al-Qasas',
  'Al-Ankabut',
  'Ar-Rum',
  'Luqman',
  'As-Sajda',
  'Al-Ahzab',
  'Saba',
  'Fatir',
  'Ya-Sin',
  'As-Saffat',
  'Sad',
  'Az-Zumar',
  'Ghafir',
  'Fussilat',
  'Ash-Shura',
  'Az-Zukhruf',
  'Ad-Dukhan',
  'Al-Jathiya',
  'Al-Ahqaf',
  'Muhammad',
  'Al-Fath',
  'Al-Hujurat',
  'Qaf',
  'Adh-Dhariyat',
  'At-Tur',
  'An-Najm',
  'Al-Qamar',
  'Ar-Rahman',
  'Al-Waqi\'a',
  'Al-Hadid',
  'Al-Mujadila',
  'Al-Hashr',
  'Al-Mumtahana',
  'As-Saff',
  'Al-Jumu\'a',
  'Al-Munafiqun',
  'At-Taghabun',
  'At-Talaq',
  'At-Tahrim',
  'Al-Mulk',
  'Al-Qalam',
  'Al-Haqqa',
  'Al-Ma\'arij',
  'Nuh',
  'Al-Jinn',
  'Al-Muzzammil',
  'Al-Muddathir',
  'Al-Qiyama',
  'Al-Insan',
  'Al-Mursalat',
  'An-Naba',
  'An-Nazi\'at',
  'Abasa',
  'At-Takwir',
  'Al-Infitar',
  'Al-Mutaffifin',
  'Al-Inshiqaq',
  'Al-Buruj',
  'At-Tariq',
  'Al-A\'la',
  'Al-Ghashiya',
  'Al-Fajr',
  'Al-Balad',
  'Ash-Shams',
  'Al-Layl',
  'Ad-Duha',
  'Ash-Sharh',
  'At-Tin',
  'Al-Alaq',
  'Al-Qadr',
  'Al-Bayyina',
  'Az-Zalzala',
  'Al-Adiyat',
  'Al-Qari\'a',
  'At-Takathur',
  'Al-Asr',
  'Al-Humaza',
  'Al-Fil',
  'Quraysh',
  'Al-Ma\'un',
  'Al-Kawthar',
  'Al-Kafirun',
  'An-Nasr',
  'Al-Masad',
  'Al-Ikhlas',
  'Al-Falaq',
  'An-Nas'
];

function mulberry32(seed) {
  let t = seed;
  return function random() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const output = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--seed') {
      output.seed = Number(args[i + 1]);
      i += 1;
    } else if (arg === '--count') {
      output.count = Number(args[i + 1]);
      i += 1;
    } else if (arg === '--out') {
      output.out = args[i + 1];
      i += 1;
    }
  }
  return output;
}

const { seed, count, out } = parseArgs();
const rng = mulberry32(Number.isFinite(seed) ? seed : 20260124);

function pickDistinctNumbers(correct, count) {
  const options = new Set([correct]);
  while (options.size < count) {
    const candidate = Math.max(1, Math.min(114, correct + Math.floor(rng() * 11) - 5));
    options.add(candidate);
  }
  return Array.from(options);
}

function pickDistinctNames(correctName, count) {
  const options = new Set([correctName]);
  while (options.size < count) {
    const candidate = surahs[Math.floor(rng() * surahs.length)];
    options.add(candidate);
  }
  return Array.from(options);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

function generateQuestions(targetCount) {
  const questions = [];

  for (let i = 0; i < surahs.length; i += 1) {
    const index = i + 1;
    const name = surahs[i];

    const numberOptionsA = shuffle(pickDistinctNumbers(index, 4)).map(String);
    questions.push({
      question: `Quel est le numero de la sourate ${name} ?`,
      options: numberOptionsA,
      correctIndex: numberOptionsA.indexOf(String(index))
    });

    const numberOptionsB = shuffle(pickDistinctNumbers(index, 4)).map(String);
    questions.push({
      question: `Dans l'ordre du Coran, la sourate ${name} porte le numero :`,
      options: numberOptionsB,
      correctIndex: numberOptionsB.indexOf(String(index))
    });

    const nameOptionsA = shuffle(pickDistinctNames(name, 4));
    questions.push({
      question: `La sourate numero ${index} est :`,
      options: nameOptionsA,
      correctIndex: nameOptionsA.indexOf(name)
    });

    const nameOptionsB = shuffle(pickDistinctNames(name, 4));
    questions.push({
      question: `Le rang ${index} correspond a quelle sourate ?`,
      options: nameOptionsB,
      correctIndex: nameOptionsB.indexOf(name)
    });

    const nameOptionsC = shuffle(pickDistinctNames(name, 4));
    questions.push({
      question: `Parmi ces sourates, laquelle est numero ${index} ?`,
      options: nameOptionsC,
      correctIndex: nameOptionsC.indexOf(name)
    });

    if (index > 1) {
      const prevName = surahs[i - 1];
      const prevOptionsA = shuffle(pickDistinctNames(prevName, 4));
      questions.push({
        question: `Quelle sourate precede ${name} dans l'ordre du Coran ?`,
        options: prevOptionsA,
        correctIndex: prevOptionsA.indexOf(prevName)
      });

      const prevOptionsB = shuffle(pickDistinctNames(prevName, 4));
      questions.push({
        question: `Juste avant ${name}, on trouve :`,
        options: prevOptionsB,
        correctIndex: prevOptionsB.indexOf(prevName)
      });
    }

    if (index < surahs.length) {
      const nextName = surahs[i + 1];
      const nextOptionsA = shuffle(pickDistinctNames(nextName, 4));
      questions.push({
        question: `Quelle sourate suit ${name} dans l'ordre du Coran ?`,
        options: nextOptionsA,
        correctIndex: nextOptionsA.indexOf(nextName)
      });

      const nextOptionsB = shuffle(pickDistinctNames(nextName, 4));
      questions.push({
        question: `Juste apres ${name}, on trouve :`,
        options: nextOptionsB,
        correctIndex: nextOptionsB.indexOf(nextName)
      });
    }
  }

  shuffle(questions);
  return questions.slice(0, targetCount).map((item) => ({
    ...item,
    difficulty: 'hard'
  }));
}

function main() {
  const outputPath = out || path.join(__dirname, '..', 'data', 'hard_questions_generated.csv');
  const targetCount = Number.isFinite(count) ? count : 1000;
  const rows = generateQuestions(targetCount);
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
