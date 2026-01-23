$outputPath = Join-Path (Resolve-Path .) 'backend/data/questions_template.csv'
$dir = Split-Path $outputPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

$pillars = @(
  @{Name='Shahada'; Order=1},
  @{Name='Salah'; Order=2},
  @{Name='Zakat'; Order=3},
  @{Name='Sawm'; Order=4},
  @{Name='Hajj'; Order=5}
)

$prayers = @(
  @{Name='Fajr'; Time='dawn'},
  @{Name='Dhuhr'; Time='midday'},
  @{Name='Asr'; Time='afternoon'},
  @{Name='Maghrib'; Time='sunset'},
  @{Name='Isha'; Time='night'}
)

$months = @('Muharram','Safar','Rabi al-Awwal','Rabi al-Thani','Jumada al-Ula','Jumada al-Akhirah','Rajab','Shaban','Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah')
$prophets = @('Adam','Nuh','Ibrahim','Musa','Isa','Muhammad','Yusuf','Yunus','Ayub','Dawud','Sulayman')
$angels = @('Jibril','Mikail','Israfil','Malik')
$quranSurah = @('Al-Fatiha','Al-Baqarah','Al-Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf','Yasin','Al-Ikhlas','Al-Falaq','An-Nas')
$cities = @('Makkah','Madinah','Jerusalem','Taif','Damascus','Kufa')
$numbers = @(3,4,5,7,10,12,20,40,70)

$baseQuestions = New-Object System.Collections.Generic.List[object]

foreach ($pillar in $pillars) {
  $baseQuestions.Add(@{
    Question = "Quel est le pilier numero $($pillar.Order) de l Islam?"
    Options = @('Shahada','Salah','Zakat','Sawm','Hajj')
    Correct = ($pillars.Name).IndexOf($pillar.Name)
    Difficulty = 'easy'
  })
}

$baseQuestions.Add(@{ Question='Combien de piliers compte l Islam?'; Options=@('3','4','5','7'); Correct=2; Difficulty='easy' })

foreach ($prayer in $prayers) {
  $baseQuestions.Add(@{
    Question = "Quelle priere correspond a $($prayer.Time)?"
    Options = @($prayers.Name)
    Correct = ($prayers.Name).IndexOf($prayer.Name)
    Difficulty = 'easy'
  })
}

$baseQuestions.Add(@{ Question='Combien de prieres obligatoires par jour?'; Options=@('3','4','5','6'); Correct=2; Difficulty='easy' })
$baseQuestions.Add(@{ Question='Dans quel mois observe-t-on le jeune obligatoire?'; Options=@('Muharram','Ramadan','Shawwal','Dhul Hijjah'); Correct=1; Difficulty='easy' })
$baseQuestions.Add(@{ Question='Qui est considere comme le dernier prophete?'; Options=@('Isa','Musa','Muhammad','Ibrahim'); Correct=2; Difficulty='easy' })
$baseQuestions.Add(@{ Question='Combien de sourates compte le Coran?'; Options=@('104','114','124','134'); Correct=1; Difficulty='medium' })

foreach ($surah in $quranSurah) {
  $baseQuestions.Add(@{ Question="La sourate $surah appartient au Coran?"; Options=@('Oui','Non','Seulement partiellement','Inconnu'); Correct=0; Difficulty='easy' })
}

$baseQuestions.Add(@{ Question='Dans quelle ville se trouve la Kaaba?'; Options=@('Makkah','Madinah','Jerusalem','Damascus'); Correct=0; Difficulty='easy' })
$baseQuestions.Add(@{ Question='Quelle ville est liee a l Hegire?'; Options=@('Makkah','Madinah','Jerusalem','Taif'); Correct=1; Difficulty='medium' })
$baseQuestions.Add(@{ Question='Quel ange est associe a la revelation?'; Options=@('Jibril','Mikail','Israfil','Malik'); Correct=0; Difficulty='medium' })

foreach ($prophet in $prophets) {
  $baseQuestions.Add(@{ Question="Le prophete $prophet est mentionne dans le Coran?"; Options=@('Oui','Non','Inconnu','Seulement dans la Sunna'); Correct=0; Difficulty='medium' })
}

foreach ($month in $months) {
  $baseQuestions.Add(@{ Question="Le mois $month est un mois du calendrier islamique?"; Options=@('Oui','Non','Ancien','Moderne'); Correct=0; Difficulty='easy' })
}

foreach ($number in $numbers) {
  $baseQuestions.Add(@{ Question="Le nombre $number est-il associe au nombre de tours du tawaf?"; Options=@('Oui','Non','Parfois','Seulement au Hajj'); Correct=($number -eq 7 ? 0 : 1); Difficulty='medium' })
}

foreach ($pillar in $pillars) {
  $baseQuestions.Add(@{ Question="Quel pilier est lie a $($pillar.Name)?"; Options=@('Croyance','Priere','Aumone','Jeune','Pelerinage'); Correct=($pillar.Order - 1); Difficulty='medium' })
}

foreach ($city in $cities) {
  $baseQuestions.Add(@{ Question="La ville $city est-elle importante dans l histoire islamique?"; Options=@('Oui','Non','Ancienne','Moderne'); Correct=0; Difficulty='medium' })
}

foreach ($angel in $angels) {
  $correct = if ($angel -eq 'Jibril') { 0 } elseif ($angel -eq 'Mikail') { 1 } elseif ($angel -eq 'Israfil') { 2 } else { 3 }
  $baseQuestions.Add(@{ Question="Quel est le role principal de l ange $angel?"; Options=@('Revelation','Subsistance','Resurrection','Gardien'); Correct=$correct; Difficulty='hard' })
}

$rowsTarget = 100000

$encoding = New-Object System.Text.UTF8Encoding($false)
$writer = New-Object System.IO.StreamWriter($outputPath, $false, $encoding, 1048576)
try {
  $writer.WriteLine('question,option1,option2,option3,option4,correctIndex,difficulty')
  for ($i = 0; $i -lt $rowsTarget; $i++) {
    $base = $baseQuestions[$i % $baseQuestions.Count]
    $opts = $base.Options
    $opts4 = @($opts[0], $opts[1], $opts[2], $opts[3])
    $line = "{0} Q{1},{2},{3},{4},{5},{6},{7}" -f $base.Question, ($i + 1), $opts4[0], $opts4[1], $opts4[2], $opts4[3], $base.Correct, $base.Difficulty
    $writer.WriteLine($line)
  }
}
finally {
  $writer.Flush()
  $writer.Dispose()
}

Write-Host "Wrote $rowsTarget questions to $outputPath"
