const { Scenes } = require('telegraf')
const pointService = require('../../services/point-service')
const texts = require('../../utils/texts')
const { formatList } = require('../../utils/format-list')

// topguildsall
const guildComparisonScene = new Scenes.BaseScene('guild_comparison_scene')
guildComparisonScene.enter(async (ctx) => {
  try {
    const standings = await pointService.getGuildsTotals()
    if (!standings || standings.length === 0) {
      await ctx.reply("No guild data available.")
      return ctx.scene.leave()
    }
    standings.sort((a, b) => b.total.average - a.total.average)

    const titlePadding = 15
    const valuePadding = 10

    let message = '*Guilds Comparison* 🏆\n\n'

    message += '*Average / Total points*\n'
    standings.forEach(guild => {
      const text = `\(${guild.total.average.toString()}/${guild.total.total.toString()}\)`
      message += formatList(guild.guild, text, titlePadding, valuePadding) + '\n'
    })

    message += '\n'
    message += '*Participants*\n'
    const participants = standings.sort((a, b) => b.participants - a.participants)
    participants.forEach(guild => {
      message += formatList(guild.guild, guild.participants, titlePadding, valuePadding) + '\n'
    })

    const categories = {
      exercise: 'Exercise',
      sportsTurn: 'Sports Sessions Participation',
      trySport: 'Trying New Sports',
      tryRecipe: 'Trying New Recipe',
      goodSleep: 'Quality Sleep',
      lessAlc: 'Less Alcohol'
    }

    message += '\n' 
    message += '*Total Points per Category:*\n\n'

    Object.keys(categories).forEach(categoryKey => {
      message += `*${categories[categoryKey]}*\n`
      const sortedGuilds = standings.sort((a, b) => b[categoryKey].total - a[categoryKey].total)
      
      sortedGuilds.forEach(guild => { 
        const points = `${guild[categoryKey].total.toString()}`
        message += formatList(guild.guild, points, titlePadding, valuePadding) + '\n'
      })
      message += '\n'
    })

    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

module.exports = { guildComparisonScene }
