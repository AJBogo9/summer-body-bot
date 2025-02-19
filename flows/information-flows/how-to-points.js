const { Scenes } = require('telegraf')

const howToGetPoints = new Scenes.BaseScene('how_to_get_points_scene')
howToGetPoints.enter(async (ctx) => {
  let pointsMessage = '*How to Earn Points* 🌟\n\n'
  pointsMessage += 'You can add points once a week, on Sundays with command /weekscores\\. Here\'s how you can earn them:\n\n'
  pointsMessage += '1\\. *Exercise*: Earn points by exercising\\. For every hour of exercise, you earn 1 point\\. If you exercise for 2 hours in one session, you earn 2 points, and so on\\.\n\n'
  pointsMessage += '2\\. *Weekly Sports Session*: Earn point by attending a weekly sports sessions (for example, your guild\'s regular weekly session or a sports try-out/jogging session)\\.\n\n'
  pointsMessage += '3\\. *New Sport*: Earn 1 point by trying a new sport or a sport you haven\'t done in a long time\\.\n\n'
  pointsMessage += '4\\. *New Recipe*: Earn 1 point by trying a new recipe this week\\.\n\n'
  pointsMessage += '5\\. *Sleep*: Earn 2 points by sleeping 7 or more hours at least 5 times this week\\.\n\n'
  pointsMessage += '6\\. *Alcohol*: Earn 1 point by having less than 7 portions of alcohol this week\\.\n\n'

  await ctx.reply(pointsMessage, { parse_mode: 'MarkdownV2' })
  await ctx.scene.leave()
})

module.exports = { howToGetPoints }