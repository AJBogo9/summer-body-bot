require('dotenv').config()

const allowedDates = process.env.ALLOWED_DATES ? process.env.ALLOWED_DATES.split(',') : []
const commands = process.env.SECRET_COMMANDS ? process.env.SECRET_COMMANDS.split(',') : []

const responses = {}
commands.forEach(cmd => {
  const envVarName = `SECRET_RESPONSE_${cmd.toUpperCase()}`
  responses[cmd] = process.env[envVarName]
})

const maxUsage = process.env.SECRET_MAX_USAGE ? parseInt(process.env.SECRET_MAX_USAGE, 10) : 5

module.exports = {
  telegramToken: process.env.TELEGRAM_TOKEN,
  mongodbUri: process.env.MONGODB_URI,
  startDate: process.env.COMPETITION_START_DATE,
  endDate: process.env.COMPETITION_END_DATE,
  reminderTime: process.env.REMINDER_TIME,
  reminderMessage: process.env.REMINDER_MSG,
  allowedDates,
  commands,
  responses,
  maxUsage,
}