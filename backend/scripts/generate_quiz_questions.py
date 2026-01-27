import argparse
import csv
import json
import os
import random
import sys
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
QURAN_PATH = os.path.join(DATA_DIR, 'quran-uthmani.json')
QURAN_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani'


def ensure_quran_data():
  if os.path.exists(QURAN_PATH):
    return
  os.makedirs(DATA_DIR, exist_ok=True)
  with urllib.request.urlopen(QURAN_URL) as response:
    content = response.read()
  with open(QURAN_PATH, 'wb') as handle:
    handle.write(content)


def load_quran():
  ensure_quran_data()
  with open(QURAN_PATH, 'r', encoding='utf-8') as handle:
    payload = json.load(handle)
  return payload['data']['surahs']


def normalize_text(value):
  return ' '.join(str(value or '').lower().split())


def make_excerpt(text, limit=14):
  parts = str(text).split()
  if len(parts) <= limit:
    return text
  return ' '.join(parts[:limit]) + ' ...'


def pick_unique(seq, count, rng):
  if count >= len(seq):
    return list(seq)
  return rng.sample(seq, count)


def build_surah_options(correct_name, all_names, rng):
  options = [correct_name]
  while len(options) < 4:
    candidate = rng.choice(all_names)
    if candidate not in options:
      options.append(candidate)
  rng.shuffle(options)
  return options, options.index(correct_name)


def build_number_options(correct_value, min_value, max_value, rng):
  if min_value > max_value:
    min_value, max_value = max_value, min_value
  candidates = list(range(min_value, max_value + 1))
  if len(candidates) < 4:
    return None, None
  options = rng.sample(candidates, 4)
  if correct_value not in options:
    options[rng.randrange(4)] = correct_value
    if len(set(options)) < 4:
      return None, None
  rng.shuffle(options)
  return options, options.index(correct_value)


def add_question(questions, seen, text, options, correct_index, difficulty, source=None, tags=None):
  key = normalize_text(text)
  if key in seen:
    return False
  if len(options) != 4 or len(set(options)) != 4:
    return False
  seen.add(key)
  questions.append((text, options, correct_index, difficulty, source, tags or []))
  return True


def generate_questions(target_count, difficulty='hard', seed=42):
  rng = random.Random(seed)
  surahs = load_quran()

  surah_names = [surah['englishName'] for surah in surahs]
  ayahs = []
  for surah in surahs:
    for ayah in surah['ayahs']:
      ayahs.append({
        'surah_name': surah['englishName'],
        'surah_number': surah['number'],
        'revelation_type': surah['revelationType'],
        'ayah_number': ayah['numberInSurah'],
        'juz': ayah['juz'],
        'page': ayah['page'],
        'text': ayah['text'],
        'surah_ayahs': len(surah['ayahs'])
      })

  questions = []
  seen = set()
  mode = difficulty if difficulty in ('medium', 'hard') else 'hard'

  if mode == 'medium':
    difficulty_label = 'medium'

    # Type M1: surah name -> number
    for surah in surahs:
      text = f"Quel est le numero de la sourate {surah['englishName']} ?"
      options, correct = build_number_options(surah['number'], 1, len(surahs), rng)
      if options:
        source = f"Coran - Sourate {surah['number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'sourate', 'numero'])

    # Type M2: surah -> ayah count
    for surah in surahs:
      ayah_count = len(surah['ayahs'])
      text = f"La sourate {surah['englishName']} comporte combien de versets ?"
      options, correct = build_number_options(ayah_count, 3, 286, rng)
      if options:
        source = f"Coran - Sourate {surah['number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'sourate', 'versets'])

    # Type M3: revelation type
    for surah in surahs:
      text = f"La sourate {surah['englishName']} est-elle Mecquoise ou Medinoise ?"
      correct_value = 'Mecquoise' if surah['revelationType'].lower().startswith('meccan') else 'Medinoise'
      options = [correct_value, 'Medinoise' if correct_value == 'Mecquoise' else 'Mecquoise', 'Mixte', 'Indetermine']
      rng.shuffle(options)
      correct = options.index(correct_value)
      source = f"Coran - Sourate {surah['number']}"
      add_question(questions, seen, text, options, correct, difficulty_label, source, ['coran', 'sourate', 'revelation'])

    # Type M4: surah number -> name (alternate phrasing)
    for surah in surahs:
      text = f"La sourate numero {surah['number']} se nomme comment ?"
      options, correct = build_surah_options(surah['englishName'], surah_names, rng)
      source = f"Coran - Sourate {surah['number']}"
      add_question(questions, seen, text, options, correct, difficulty_label, source, ['coran', 'sourate'])

    # Type M5: ayah -> juz (alternate phrasing)
    for ayah in ayahs:
      text = (
        f"Le verset {ayah['ayah_number']} de la sourate {ayah['surah_name']} "
        f"appartient a quel juz ?"
      )
      options, correct = build_number_options(ayah['juz'], 1, 30, rng)
      if options:
        source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'juz', 'verset'])

    # Type M6: ayah -> page (alternate phrasing)
    for ayah in ayahs:
      text = (
        f"Le verset {ayah['ayah_number']} de la sourate {ayah['surah_name']} "
        f"se trouve sur quelle page ?"
      )
      options, correct = build_number_options(ayah['page'], 1, 604, rng)
      if options:
        source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'page', 'verset'])
  else:
    difficulty_label = 'hard'

    # Type A: excerpt -> surah
    for ayah in ayahs:
      excerpt = make_excerpt(ayah['text'])
      text = f"Dans quelle sourate apparait l'extrait suivant : \"{excerpt}\" ?"
      options, correct = build_surah_options(ayah['surah_name'], surah_names, rng)
      source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
      add_question(questions, seen, text, options, correct, difficulty_label, source, ['coran', 'sourate', 'extrait'])

    # Prepare samples for additional types
    rng.shuffle(ayahs)
    juz_sample = ayahs[:2500]
    page_sample = ayahs[2500:4000]
    number_sample = ayahs[4000:5500]

    # Type B: ayah -> juz
    for ayah in juz_sample:
      text = (
        f"Dans quel juz se trouve le verset {ayah['ayah_number']} "
        f"de la sourate {ayah['surah_name']} ?"
      )
      options, correct = build_number_options(ayah['juz'], 1, 30, rng)
      if options:
        source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'juz'])

    # Type C: ayah -> page
    for ayah in page_sample:
      text = (
        f"Sur quelle page se trouve le verset {ayah['ayah_number']} "
        f"de la sourate {ayah['surah_name']} ?"
      )
      options, correct = build_number_options(ayah['page'], 1, 604, rng)
      if options:
        source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'page'])

    # Type D: surah number -> name
    for surah in surahs:
      text = f"Quelle est la sourate numero {surah['number']} ?"
      options, correct = build_surah_options(surah['englishName'], surah_names, rng)
      source = f"Coran - Sourate {surah['number']}"
      add_question(questions, seen, text, options, correct, difficulty_label, source, ['coran', 'sourate'])

    # Type E: surah -> ayah count
    for surah in surahs:
      ayah_count = len(surah['ayahs'])
      text = f"Combien de versets contient la sourate {surah['englishName']} ?"
      options, correct = build_number_options(ayah_count, 3, 286, rng)
      if options:
        source = f"Coran - Sourate {surah['number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'sourate', 'versets'])

    # Type F: revelation type
    for surah in surahs:
      text = f"Quel est le type de revelation de la sourate {surah['englishName']} ?"
      correct_value = 'Mecquoise' if surah['revelationType'].lower().startswith('meccan') else 'Medinoise'
      options = [correct_value, 'Medinoise' if correct_value == 'Mecquoise' else 'Mecquoise', 'Mixte', 'Indetermine']
      rng.shuffle(options)
      correct = options.index(correct_value)
      source = f"Coran - Sourate {surah['number']}"
      add_question(questions, seen, text, options, correct, difficulty_label, source, ['coran', 'sourate', 'revelation'])

    # Type G: excerpt -> ayah number
    for ayah in number_sample:
      if ayah['surah_ayahs'] < 4:
        continue
      excerpt = make_excerpt(ayah['text'])
      text = (
        f"Quel est le numero du verset de cet extrait dans la sourate "
        f"{ayah['surah_name']} : \"{excerpt}\" ?"
      )
      min_value = max(1, ayah['ayah_number'] - 5)
      max_value = min(ayah['surah_ayahs'], ayah['ayah_number'] + 5)
      options, correct = build_number_options(ayah['ayah_number'], min_value, max_value, rng)
      if not options:
        options, correct = build_number_options(ayah['ayah_number'], 1, ayah['surah_ayahs'], rng)
      if options:
        source = f"Coran {ayah['surah_number']}:{ayah['ayah_number']}"
        add_question(questions, seen, text, [str(o) for o in options], correct, difficulty_label, source, ['coran', 'verset', 'extrait'])

  rng.shuffle(questions)
  if len(questions) < target_count:
    raise RuntimeError(f"Not enough questions generated: {len(questions)}")
  return questions[:target_count]


def write_csv(questions, output_path):
  os.makedirs(os.path.dirname(output_path), exist_ok=True)
  with open(output_path, 'w', encoding='utf-8', newline='') as handle:
    writer = csv.writer(handle, quoting=csv.QUOTE_ALL)
    writer.writerow([
      'question',
      'option1',
      'option2',
      'option3',
      'option4',
      'correct_index',
      'difficulty',
      'source',
      'tags',
      'status'
    ])
    for text, options, correct, difficulty, source, tags in questions:
      tags_value = ', '.join(tags or [])
      writer.writerow([text, options[0], options[1], options[2], options[3], correct, difficulty, source or '', tags_value, 'validated'])


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument('--count', type=int, default=10000)
  parser.add_argument('--difficulty', choices=['hard', 'medium'], default='hard')
  parser.add_argument('--output', default=os.path.join(DATA_DIR, 'quiz_questions_10000.csv'))
  parser.add_argument('--seed', type=int, default=42)
  args = parser.parse_args()

  try:
    questions = generate_questions(args.count, difficulty=args.difficulty, seed=args.seed)
  except Exception as error:
    print(f'Generation error: {error}', file=sys.stderr)
    sys.exit(1)

  write_csv(questions, args.output)
  print(f'Generated {len(questions)} questions -> {args.output}')


if __name__ == '__main__':
  main()
