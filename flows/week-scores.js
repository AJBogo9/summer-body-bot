const { Scenes, Markup } = require('telegraf')

const pointService = require('../services/point-service')
const userService = require('../services/user-service')

const texts = require('../utils/texts')
const canAddPoints = require('../utils/can-add-points')
const { formatList } = require('../utils/format-list')
const exitOnText = require('../utils/exit-on-text')

const weekScoresWizard = new Scenes.WizardScene(
  'week_scores_wizard',
  async (ctx) => {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)

    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }

    const check = await canAddPoints(user.lastSubmission)
    if (!check.canAdd) {
      await ctx.reply(check.reason)
      return ctx.scene.leave()
    }

    const sentMessage = await ctx.reply(
      'How many times did you exercise for at least an hour? One exercise session can count multiple times.\n\nEnter a number:',
      Markup.inlineKeyboard([
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    ctx.wizard.state.questionMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },  
  async (ctx) => {
  
    const exerciseTimes = parseInt(ctx.message.text)

    if (!ctx.wizard.state.msgChanged) {
      ctx.wizard.state.msgChanged = true
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.wizard.state.questionMessageId,
        null,
        'How many times did you exercise for at least an hour?',
      )
    }

    if (!Number.isInteger(exerciseTimes) || exerciseTimes < 0 || exerciseTimes > 21) {
      await ctx.reply('Invalid input. Please enter a valid whole number between 0 and 21. You shouldn\'t exercise more than 21 hours a week')
      return ctx.wizard.selectStep(ctx.wizard.cursor)
    }

    ctx.wizard.state.pointsData = { exercise: 0, trySport: 0, sportsTurn: 0, tryRecipe: 0, goodSleep:0, lessAlc: 0, total: 0 }
    ctx.wizard.state.pointsData.exercise = exerciseTimes
    ctx.wizard.state.pointsData.total += exerciseTimes

    await ctx.reply(
      'Did you attend any sports sessions this week (for example, your guild\'s regular weekly session or a sports try-out/jogging session)?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_sports_session'),
        Markup.button.callback('No', 'no_sports_session'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    const shouldExit = await exitOnText(ctx, '/weekscores')
    if (shouldExit) return ctx.scene.leave()

    if (ctx.wizard.state.extraSportsPending) {
      const sentMessage = await ctx.reply(
        'How many sports sessions did you attend this week?',
        Markup.inlineKeyboard([
          Markup.button.callback('Cancel & Exit', 'exit_wizard')
        ])
      )
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      ctx.wizard.state.msgChanged = false
      return ctx.wizard.next()
    }
    await ctx.wizard.steps[ctx.wizard.cursor + 1](ctx)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.wizard.state.extraSportsPending) {

      const sessions = parseInt(ctx.message.text)

      if (!ctx.wizard.state.msgChanged) {
        ctx.wizard.state.msgChanged = true
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          ctx.wizard.state.questionMessageId,
          null,
          'How many sports sessions did you attend this week?',
        )
      }

      if (!Number.isInteger(sessions) || sessions < 0 || sessions > 14) {
        await ctx.reply('Invalid input. Please enter a valid whole number between 1 and 14.')
        return ctx.wizard.selectStep(ctx.wizard.cursor)
      }

      ctx.wizard.state.pointsData.sportsTurn = sessions
      ctx.wizard.state.pointsData.total += sessions
    }

    await ctx.reply(
      'Did you try a new sport or a sport you have not done in a long time?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_new_sport'),
        Markup.button.callback('No', 'no_new_sport'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    const shouldExit = await exitOnText(ctx, '/weekscores')
    if (shouldExit) return ctx.scene.leave()
    await ctx.reply(
      'Did you try new recipe this week?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_try_recipe'),
        Markup.button.callback('No', 'no_try_recipe'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    const shouldExit = await exitOnText(ctx, '/weekscores')
    if (shouldExit) return ctx.scene.leave()

    await ctx.reply(
      'Did you sleep 7 or more hours at least 5 times this week?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_good_sleep'),
        Markup.button.callback('No', 'no_good_sleep'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    const shouldExit = await exitOnText(ctx, '/weekscores')
    if (shouldExit) return ctx.scene.leave()

    await ctx.reply(
      'Did you have less than 7 portions of alcohol this week?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_less_alcohol'),
        Markup.button.callback('No', 'no_less_alcohol'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    const shouldExit = await exitOnText(ctx, '/weekscores')
    if (shouldExit) return ctx.scene.leave()

    const titlePadding = 24
    const valuePadding = 10
    let message = '*Do you confirm this information?*\n\n'
        message += formatList('Exercise Hours', ctx.wizard.state.pointsData.exercise, titlePadding, valuePadding) + '\n'
        message += formatList('Attended Sports Sessions', ctx.wizard.state.pointsData.sportsTurn > 0 ? ctx.wizard.state.pointsData.sportsTurn : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', ctx.wizard.state.pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Recipe', ctx.wizard.state.pointsData.tryRecipe ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', ctx.wizard.state.pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', ctx.wizard.state.pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', ctx.wizard.state.pointsData.total, titlePadding, valuePadding) + '\n\n'

    await ctx.reply(
      message,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('Yes, confirm', 'confirm_details')],
            [Markup.button.callback('No, start over', 'start_over')],
            [Markup.button.callback('Cancel & Exit', 'exit_wizard')]
          ]
        }
      }
    )  
  },
)

weekScoresWizard.action(/^(yes|no)_(new_sport|sports_turn|try_recipe|good_sleep|less_alcohol)$/, async (ctx) => {
  const [actionResponse, context] = ctx.match.slice(1)
  const isAffirmative = actionResponse === 'yes'
  const pointsDataPropertyMap = {
    new_sport: 'trySport',
    sports_turn: 'sportsTurn',
    try_recipe: 'tryRecipe',
    good_sleep: 'goodSleep',
    less_alcohol: 'lessAlc',
  }

  const stateProperty = pointsDataPropertyMap[context]
  const isSleepData = stateProperty === 'goodSleep'

  ctx.wizard.state.pointsData[stateProperty] = isAffirmative ? isSleepData ? 2 : 1 : 0
  if (isAffirmative) {
    ctx.wizard.state.pointsData.total += isSleepData ? 2 : 1
  }

  await ctx.deleteMessage()
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action('confirm_details', async (ctx) => {
  try {
    const titlePadding = 24
    const valuePadding = 4
    let message = '*Summary of this week\'s points:*\n\n'
        message += formatList('Exercise Hours', ctx.wizard.state.pointsData.exercise, titlePadding, valuePadding) + '\n'
        message += formatList('Attended Sports Sessions', ctx.wizard.state.pointsData.sportsTurn > 0 ? ctx.wizard.state.pointsData.sportsTurn : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', ctx.wizard.state.pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Recipe', ctx.wizard.state.pointsData.tryRecipe ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', ctx.wizard.state.pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', ctx.wizard.state.pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', ctx.wizard.state.pointsData.total, titlePadding, valuePadding) + '\n\n'

    await pointService.addPoints(ctx.from.id, ctx.wizard.state.pointsData)
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2' })
    await ctx.answerCbQuery()
    return ctx.scene.leave()
  } catch (error) {
    await ctx.answerCbQuery()
    await ctx.editMessageText(texts.actions.error.error)
    return ctx.scene.leave()
  }
})

weekScoresWizard.action('start_over', async (ctx) => {
  await ctx.editMessageText('starting over!')
  ctx.wizard.selectStep(0)
  await ctx.answerCbQuery()
  return ctx.wizard.steps[0](ctx)
})

weekScoresWizard.action('exit_wizard', async (ctx) => {
  await ctx.editMessageText('Canceled & Exited. Start again with /weekscores')
  return ctx.scene.leave()
})

weekScoresWizard.action(/^(yes|no)_sports_session$/, async (ctx) => {
  const response = ctx.match[1]
  ctx.wizard.state.extraSportsPending = (response === 'yes');
  await ctx.deleteMessage()
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

module.exports = { weekScoresWizard }