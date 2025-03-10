const { Scenes } = require('telegraf')
const User = require('../../models/user-model')
const { formatList } = require('../../utils/format-list')
const texts = require('../../utils/texts')

// topusers command
const topUsersScene = new Scenes.BaseScene('top_users_scene')
topUsersScene.enter(async (ctx) => {
  try {
    const users = await User.find({}).sort({ "points.total": -1 }).limit(15)
    if (!users || users.length === 0) {
      await ctx.reply("No users found.")
      return ctx.scene.leave()
    }
    
    let message = "*Top 15 Participants \\(total points\\)* ⭐\n\n"
    const titlePadding = 24
    const valuePadding = 4
    
    const emojis = ['⒈ ', '⒉ ', '⒊ ', '⒋ ', '⒌ ', '⒍ ', '⒎ ', '⒏ ', '⒐ ', '⒑ ', '⒒ ', '⒓ ', '⒔ ', '⒕ ', '⒖ ', '⒗ ', '⒘ ', '⒙ ', '⒚ ', '⒛ ']

    users.forEach((user, index) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(user.name, user.points.total, titlePadding, valuePadding) + '\n'
    })
    
    await ctx.reply(message, { parse_mode: 'MarkdownV2' })
    ctx.scene.leave()
  } catch (error) {
    console.error(error)
    await ctx.reply(texts.actions.error.error)
    ctx.scene.leave()
  }
})

module.exports = { topUsersScene }