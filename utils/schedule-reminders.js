const schedule = require('node-schedule')
const bot = require('../bot')
const { sendReminder } = require('../services/user-service')
const { allowedDates, reminderTime } = require('../config/constants');

//couldnt get this working with other than straight cron format
const scheduleReminders = () => {
  try {
    const timeZoneAdj = - 2
    const [hourStr, minuteStr] = reminderTime.split(':')
    const hour = parseInt(hourStr, 10) + timeZoneAdj
    const minute = parseInt(minuteStr, 10)

    allowedDates.forEach((date) => {
      const [year, month, day] = date.split('-').map(Number)
      const cronString = `${minute} ${hour} ${day} ${month} *`
      schedule.scheduleJob(cronString, function() {
        console.log("Reminder is being executed with (min hour day month): ", minute, hour + 2, day, month)
        sendReminder(bot)
      })
    })

  } catch (error) {
    console.error('Scheduling error:', error)
  }
}

module.exports = scheduleReminders