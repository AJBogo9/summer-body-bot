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
      await ctx.reply("No team rankings available.")
      return ctx.scene.leave()
    }
    let message = '*Team Rankings \\(by average points\\)* ⚡\n\n'
    const titlePadding = 25
    const valuePadding = 8

    rankings.forEach((team, index) => {
      const rank = (index + 1).toString() + '.'
      const spaces = (index + 1) < 10 ? '  ' : ' '
      const points = team.averagePointsPerMember.toString()
      message += formatList(rank + spaces + team.name, points, titlePadding, valuePadding) + '\n'
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