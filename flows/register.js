const { Scenes, Markup } = require('telegraf')
const teamService = require('../services/team-service')
const userService = require('../services/user-service')
const texts = require('../utils/texts')
const validateTeamName = require('../utils/validate-team-name')
const User = require('../models/user-model');

const cancelAndExitKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('Cancel', 'cancel')
])

const registerWizard = new Scenes.WizardScene(
  'register_wizard',
  async (ctx) => {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)
    if (user) {
        await ctx.reply("You've already registered. You can still /createteam or /jointeam")
        // await ctx.reply("You've already registered.")
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
    const userId = ctx.from.id
    const user = await userService.findUser(userId)
    if (ctx.wizard.state.action === 'create' && user) {
      const teamName = ctx.message.text
      const validation = validateTeamName(teamName)

      if (!validation.isValid) {
        await ctx.reply(validation.reason, cancelAndExitKeyboard)
        return ctx.wizard.selectStep(ctx.wizard.cursor)
      }

      try {
        const team = await teamService.createTeam(teamName, ctx.wizard.state.guild)
        await userService.addUserToTeam(user._id, team._id)
        await teamService.joinTeam(user._id, team._id)
        await ctx.reply('Team has been successfully created! Other members can join your team using this ID:')
        ctx.reply(`${team._id}`)
      } catch (error) {
        if (error.code === 11000) { // Mongoose duplicate key error
          await ctx.reply('A team with that name already exists. Please try a different name.')
          return ctx.wizard.selectStep(ctx.wizard.cursor)
        } else {
          await ctx.reply(texts.actions.error.error)
          return ctx.scene.leave()
        }
      }
    } else if (ctx.wizard.state.action === 'join') {
      const teamId = ctx.message.text
      try {
        const team = await teamService.getTeamById(teamId)
        if (!team) {
          await ctx.reply('No team with that ID found. Please ensure you\'ve entered it correctly and try again.')
          return ctx.wizard.selectStep(ctx.wizard.cursor)
        }
        if (user.guild !== team.guild) {
          await ctx.reply('You cannot join a team that belongs to a different guild.')
          return ctx.wizard.selectStep(ctx.wizard.cursor)
        }
        await userService.addUserToTeam(user._id, team._id)
        await teamService.joinTeam(user._id, team._id)
    
        await ctx.reply(`Successfully joined ${team.name}!`)
        return ctx.scene.leave()
      } catch (error) {
        await ctx.reply('Invalid team ID format. Start over with /jointeam')
        return ctx.scene.leave()
    }
    }
    
    return ctx.scene.leave()
  }
)

registerWizard.action('accept_terms', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageText('You accepted the terms and conditions.')
  const validGuilds = User.validGuilds
  await ctx.reply(
    'Please select your guild:',
    Markup.inlineKeyboard(
      validGuilds
        .map(g => [Markup.button.callback(g, `select_guild_${g}`)])
        .concat([[Markup.button.callback('Cancel & Exit', 'exit_wizard')]])
    )
  )
})

registerWizard.action('decline_terms', async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.editMessageText('You did not accept the terms and conditions necessary to enter the competition. Click /register to start again.')
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
        await ctx.editMessageText(`You successfully registered to the ${guild} Kesäkuntoon team`)
        await ctx.reply(
          'Would you like to create a new team or join an existing one?',
          Markup.inlineKeyboard([
            Markup.button.callback('Create new team', 'new_team'),
            Markup.button.callback('Join existing team', 'existing_team'),
            Markup.button.callback('Save & Exit', 'register_exit_wizard')
          ]),
          { parse_mode: 'Markdown' }
        )
    } catch (error) {
        await ctx.editMessageText(texts.actions.error.error)
        return ctx.scene.leave()
    }
})

registerWizard.action('new_team', async (ctx) => {
  ctx.wizard.state.action = 'create'

  await ctx.answerCbQuery()
  await ctx.editMessageText('You chose to create a new team. Give a name for your team', cancelAndExitKeyboard)

})

registerWizard.action('existing_team', async (ctx) => {
  ctx.wizard.state.action = 'join'

  await ctx.answerCbQuery()
  await ctx.editMessageText('You chose to join an existing team. Enter the team ID you wish to join. This ID was provided when the team was initially created.')
})

registerWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageText('Canceled & Exited. Start again with /register')
  return ctx.scene.leave()
})

registerWizard.action('register_exit_wizard', async (ctx) => {
  await ctx.editMessageText(`You successfully registered with the ${ctx.wizard.state.guild} guild. You can use /createteam or /jointeam if you want to create or join a team`)
  return ctx.scene.leave()
})

registerWizard.action('cancel', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageText('Canceled.')
  return ctx.scene.leave()
})

module.exports = { registerWizard }
