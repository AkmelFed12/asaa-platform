const { runQuizReminder, runQuizSummary } = require('./quizJobs');

const ENABLE_QUIZ_JOBS = process.env.ENABLE_QUIZ_JOBS === 'true';
const QUIZ_TIMEZONE = process.env.QUIZ_TIMEZONE || 'Africa/Abidjan';
const CHECK_INTERVAL_SECONDS = Math.max(
  Number(process.env.QUIZ_JOB_CHECK_INTERVAL_SECONDS) || 60,
  15
);

const parseTime = (value, fallback) => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return { hour, minute };
};

const getTimeInZone = (now, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return { hour, minute };
};

const getDateInZone = (now, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
};

const buildSchedule = () => ({
  reminder: parseTime(process.env.QUIZ_REMINDER_TIME, { hour: 18, minute: 0 }),
  summary: parseTime(process.env.QUIZ_SUMMARY_TIME, { hour: 23, minute: 50 })
});

const startQuizJobScheduler = () => {
  if (!ENABLE_QUIZ_JOBS) {
    return;
  }

  const schedule = buildSchedule();
  const lastRun = {
    reminder: null,
    summary: null
  };

  const tick = async () => {
    const now = new Date();
    const dateStr = getDateInZone(now, QUIZ_TIMEZONE);
    const time = getTimeInZone(now, QUIZ_TIMEZONE);

    if (time.hour === schedule.reminder.hour && time.minute === schedule.reminder.minute) {
      if (lastRun.reminder !== dateStr) {
        lastRun.reminder = dateStr;
        runQuizReminder({ quizDate: dateStr }).catch((error) => {
          console.error('Quiz reminder job error:', error.message);
        });
      }
    }

    if (time.hour === schedule.summary.hour && time.minute === schedule.summary.minute) {
      if (lastRun.summary !== dateStr) {
        lastRun.summary = dateStr;
        runQuizSummary({ quizDate: dateStr }).catch((error) => {
          console.error('Quiz summary job error:', error.message);
        });
      }
    }
  };

  tick();
  setInterval(tick, CHECK_INTERVAL_SECONDS * 1000);
};

module.exports = {
  startQuizJobScheduler
};
