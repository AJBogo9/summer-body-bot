const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const texts = require('../../utils/texts')
const { formatList } = require('../../utils/format-list')

// leaderboards command
const teamRankingsScene = new Scenes.BaseScene('team_rankings_scene')
teamRankingsScene.enter(async (ctx) => {
  try {
    const rankings = await pointService.getTeamRankings()
    if (!rankings || rankings.length === 0) {
      await ctx.reply("There are no teams with three or more members where all members have more than 0 points.")
      return ctx.scene.leave()
    }
    let message = '*Team Rankings \\(by average points\\)* ⚡\n\n'
    const titlePadding = 21
    const valuePadding = 6

    const emojis = ['🥇', '🥈', '🥉', ' ⒋ ', ' ⒌ ', ' ⒍ ', ' ⒎ ', ' ⒏ ', ' ⒐ ', ' ⒑ ', ' ⒒ ', ' ⒓ ', ' ⒔ ', ' ⒕ ', ' ⒖ ', ' ⒗ ', ' ⒘ ', ' ⒙ ', ' ⒚ ', ' ⒛ ']

    rankings.forEach((team, index) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      const points = team.averagePointsPerMember.toString()
      message += emoji + formatList(team.name, points, titlePadding, valuePadding) + '\n'
    })

    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { teamRankingsScene }