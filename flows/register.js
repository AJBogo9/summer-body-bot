const { Scenes, Markup } = require('telegraf')
const userService = require('../services/user-service')
const texts = require('../utils/texts')
const User = require('../models/user-model')

const registerWizard = new Scenes.WizardScene(
  'register_wizard',
  async (ctx) => {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)
    if (user) {
        await ctx.reply("You've already registered. You can still /createteam or /jointeam.")
        return ctx.scene.leave()
    } else {
        await ctx.reply(texts.terms.question, Markup.inlineKeyboard([
            Markup.button.callback('Accept', 'accept_terms'),
            Markup.button.callback('Decline', 'decline_terms')
        ]))
        return ctx.wizard.next()
    }
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.');
      return;
    }
  }
)

registerWizard.action('accept_terms', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageText('You accepted the terms and conditions.')
  const validGuilds = User.validGuilds
  const guildButtons = validGuilds.map(g => Markup.button.callback(g, `select_guild_${g}`))
  const guildRows = []
  for (let i = 0; i < guildButtons.length; i += 3) {
    guildRows.push(guildButtons.slice(i, i + 3))
  }
  guildRows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
  await ctx.reply(
    'Please select your team:',
    Markup.inlineKeyboard(guildRows)
  )
})

registerWizard.action('decline_terms', async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.editMessageReplyMarkup({})
    await ctx.reply('You did not accept the terms and conditions necessary to enter the competition. Click /register to start again.')
    return ctx.scene.leave()
})

registerWizard.action(/^select_guild_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery()
    const guild = ctx.match[1]

    ctx.wizard.state.guild = guild
    const firstName = ctx.from.first_name || ''
    const lastName = ctx.from.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || ctx.from.username

    try {
        await userService.createUser({
            userId: ctx.from.id,
            username: ctx.from.username,
            name: fullName,
            guild: guild,
        })
        await ctx.editMessageReplyMarkup({})
        await ctx.reply(`You successfully registered to the ${guild} Kesäkuntoon team. You can use /createteam or /jointeam if you want to create or join a team. If you selected the wrong team, you can remove your user and start again with /rmuser.`)
        return ctx.scene.leave()
    } catch (_err) {
        await ctx.editMessageText(texts.actions.error.error)
        return ctx.scene.leave()
    }
})

registerWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageText('Canceled & Exited. Start again with /register.')
  return ctx.scene.leave()
})

registerWizard.action('cancel', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageText('Canceled.')
  return ctx.scene.leave()
})

module.exports = { registerWizard }
