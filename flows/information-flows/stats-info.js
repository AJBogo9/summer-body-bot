const { Scenes } = require('telegraf')

const statsInfoScene = new Scenes.BaseScene('stats_info_scene')
statsInfoScene.enter(async (ctx) => {
    let statsMessage = '*Discover Your Stats and Rankings\\!* 🏆\n\n'
    statsMessage += 'Use these commands to track your and your team\'s progress:\n\n'
    statsMessage += '/leaderboards \\- View 30 teams with most points and their rankings\n\n'
    statsMessage += '/team \\- Check your team members\' contributions\n\n'
    statsMessage += '/summary \\- Get your personal points summary\n\n'
    statsMessage += '/tikvspt \\- See guild standings in the competition\n\n'
    statsMessage += '/tikvsptall \\- Compare guild points in more detail\n\n'
    statsMessage += 'Stay motivated and see how your efforts stack up against the competition\\!'
  
    await ctx.reply(statsMessage, { parse_mode: 'MarkdownV2' })
    await ctx.scene.leave()
})

module.exports = { statsInfoScene }