const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const userService = require('../../services/user-service')
const teamService = require('../../services/team-service')
const texts = require('../../utils/texts')
const { formatList, escapeMarkdownV2 } = require('../../utils/format-list')

// team command
const teamMemberRankingsScene = new Scenes.BaseScene('team_member_rankings_scene')
teamMemberRankingsScene.enter(async (ctx) => {
  try {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)
    if (!user) {
      await ctx.reply("User not found. Please register first using /register.")
      return ctx.scene.leave()
    }
    const teamExists = await teamService.getTeamById(user.team)
    if (!user.team || !teamExists) {
      await ctx.reply("You are not a part of any team. Please join or create a team first.")
      return ctx.scene.leave()
    }

    const rankings = await pointService.getTeamMemberRankings(userId)
    let message = `*${escapeMarkdownV2(rankings[0].teamName)} Rankings* 🏅\n\n`
    const titlePadding = 25
    const valuePadding = 8

    rankings.forEach((member, index) => {
      const rank = (index + 1).toString() + '.'
      const points = member.totalPoints.toString()
      message += formatList(rank + ' ' + member.name, points, titlePadding, valuePadding, 'pts') + '\n'
    })

    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { teamMemberRankingsScene }
