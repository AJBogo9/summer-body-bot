const { Scenes, Markup } = require('telegraf')

const pointService = require('../services/point-service')
const userService = require('../services/user-service')

const texts = require('../utils/texts')
const canAddPoints = require('../utils/can-add-points')
const { formatList } = require('../utils/format-list')

const PointMultipliers = {
  sportsTurn: 5,
  trySport: 5,
  tryRecipe: 5, // VegeAppro theme week --> can be chosen many times
  goodSleep: 8, 
  meditate: 5,
  lessAlc: 10,  
}

const DefaultPoints = {
  sportsTurn: 0,
  trySport: 0,
  tryRecipe: 0,
  goodSleep: 0,
  lessAlc: 0,
  meditate: 0,
  total: 0,
}

const healthQuestions = [
  { key: 'goodSleep', label: 'Good Sleep', points: PointMultipliers.goodSleep },
  { key: 'meditate', label: 'Meditation', points: PointMultipliers.meditate },
  { key: 'lessAlc', label: 'Less Alcohol', points: PointMultipliers.lessAlc },
]

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

    ctx.wizard.state.pointsData = { ...DefaultPoints }

    await ctx.reply(
      'Did you attend any sports sessions this week (for example, your guild\'s regular weekly session or a sports try-out / jogging session)?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_sports_session'),
        Markup.button.callback('No', 'no_sports_session'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }

    if (ctx.wizard.state.extraSportsPending) {
      const buttons = []
      for (let i = 1; i <= 8; i++) {
        buttons.push(Markup.button.callback(String(i), `sports_${i}`))
      }
      const rows = []
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(buttons.slice(i, i + 4))
      }
      rows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
      const sentMessage = await ctx.reply(
        'How many sports sessions did you attend this week?',
        Markup.inlineKeyboard(rows)
      )
      ctx.wizard.state.questionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    }
    await ctx.wizard.steps[ctx.wizard.cursor + 1](ctx)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }
    await ctx.reply(
      'Did you try any new recipes/foods this week?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_recipe'),
        Markup.button.callback('No', 'no_recipe'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }
    if (ctx.wizard.state.extraRecipePending) {
      const buttons = []
      for (let i = 1; i <= 8; i++) {
        buttons.push(Markup.button.callback(String(i), `recipe_${i}`))
      }
      const rows = []
      for (let i = 0; i < buttons.length; i += 4) {
        rows.push(buttons.slice(i, i + 4))
      }
      rows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
      const sentMessage = await ctx.reply(
        'How many new recipes/foods did you try this week?',
        Markup.inlineKeyboard(rows)
      )
      ctx.wizard.state.recipeQuestionMessageId = sentMessage.message_id
      return ctx.wizard.next()
    }
    await ctx.wizard.steps[ctx.wizard.cursor + 1](ctx)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }
    await ctx.reply(
      'Did you try a new sport or one you haven’t done in a while?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes', 'yes_new_sport'),
        Markup.button.callback('No', 'no_new_sport'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }
    const promptMsg = await ctx.reply(
      'Next up are some health-related questions. Would you like to answer them?',
      Markup.inlineKeyboard([
        Markup.button.callback('Next', 'health_next'),
        Markup.button.callback('Skip', 'health_skip'),
        Markup.button.callback('Cancel & Exit', 'exit_wizard')
      ])
    )
    ctx.wizard.state.promptMsgId = promptMsg.message_id
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an activity.')
      return
    }

    if (ctx.wizard.state.promptMsgId) {
      try {
        await ctx.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.wizard.state.promptMsgId, null, {})
      } catch (_err) { /**/ }
    }

    const { pointsData } = ctx.wizard.state
    const titlePadding = 26
    const valuePadding = 4
    let message = '*Do you confirm this information?*\n\n'
        message += formatList('Attended Sports Sessions', pointsData.sportsTurn > 0 ? pointsData.sportsTurn / PointMultipliers.sportsTurn : 'No', pointsData.sportsTurn > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried New Recipes/Foods', pointsData.tryRecipe > 0 ? pointsData.tryRecipe / PointMultipliers.tryRecipe : 'No', pointsData.tryRecipe > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Meditated', pointsData.meditate ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', pointsData.total, titlePadding, valuePadding) + '\n\n'

    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('Yes, confirm', 'confirm_details')],
          [Markup.button.callback('No, start over', 'start_over')],
          [Markup.button.callback('Cancel & Exit', 'exit_wizard')]
        ]
      }
    })  
  },
)

weekScoresWizard.action('health_next', async (ctx) => {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return
  }
  ctx.wizard.state.healthAnswers = {}
  healthQuestions.forEach(q => ctx.wizard.state.healthAnswers[q.key] = false)
  const keyboard = healthQuestions.map(q => 
    [Markup.button.callback(`${q.label}: ❌`, `toggle_${q.key}`)]
  )
  keyboard.push([
    Markup.button.callback('Submit', 'health_submit'),
    Markup.button.callback('Cancel & Exit', 'exit_wizard')
  ])
  await ctx.editMessageText(
    'Please select which of the following health-related activities you did this week:',
    Markup.inlineKeyboard(keyboard)
  )
  await ctx.answerCbQuery()
})

weekScoresWizard.action(/toggle_(.+)/, async (ctx) => {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return
  }
  const key = ctx.match[1]
  ctx.wizard.state.healthAnswers[key] = !ctx.wizard.state.healthAnswers[key]
  const keyboard = healthQuestions.map(q => {
    const status = ctx.wizard.state.healthAnswers[q.key] ? '✅' : '❌'
    return [Markup.button.callback(`${q.label}: ${status}`, `toggle_${q.key}`)]
  })
  keyboard.push([
    Markup.button.callback('Submit', 'health_submit'),
    Markup.button.callback('Cancel & Exit', 'exit_wizard')
  ])
  await ctx.editMessageText(
    'Please select which of the following health-related activities you did this week:',
    Markup.inlineKeyboard(keyboard)
  )
  await ctx.answerCbQuery()
})

weekScoresWizard.action('health_submit', async (ctx) => {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return
  }
  const answers = ctx.wizard.state.healthAnswers
  ctx.wizard.state.pointsData.goodSleep = answers.goodSleep ? PointMultipliers.goodSleep : 0
  ctx.wizard.state.pointsData.meditate = answers.meditate ? PointMultipliers.meditate : 0
  ctx.wizard.state.pointsData.lessAlc = answers.lessAlc ? PointMultipliers.lessAlc : 0
  const addedPoints = healthQuestions.reduce((sum, q) => {
    return sum + (answers[q.key] ? q.points : 0)
  }, 0)
  ctx.wizard.state.pointsData.total += addedPoints
  await ctx.reply('Health-related responses recorded.')
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action('health_skip', async (ctx) => {
  Object.assign(ctx.wizard.state.pointsData, { goodSleep: 0, meditate: 0, lessAlc: 0 })
  await ctx.reply('Health-related questions skipped.')
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action('confirm_details', async (ctx) => {
  try {
    const { pointsData } = ctx.wizard.state
    const titlePadding = 26
    const valuePadding = 4
    let message = '*Summary of this week\'s points:*\n\n'
        message += formatList('Attended Sports Sessions', pointsData.sportsTurn > 0 ? pointsData.sportsTurn / PointMultipliers.sportsTurn : 'No', pointsData.sportsTurn > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Tried a New Sport', pointsData.trySport ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Tried New Recipes/Foods', pointsData.tryRecipe > 0 ? pointsData.tryRecipe / PointMultipliers.tryRecipe : 'No', pointsData.tryRecipe > 0 ? titlePadding + 2 : titlePadding, valuePadding) + '\n'
        message += formatList('Had Good Sleep', pointsData.goodSleep ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Meditated', pointsData.meditate ? 'Yes' : 'No', titlePadding, valuePadding) + '\n'
        message += formatList('Limited Alcohol', pointsData.lessAlc ? 'Yes' : 'No', titlePadding, valuePadding) + '\n\n'
        message += formatList('Total Points:', pointsData.total, titlePadding, valuePadding) + '\n\n'

    await pointService.addPoints(ctx.from.id, ctx.wizard.state.pointsData)
    await ctx.editMessageText(message, { parse_mode: 'MarkdownV2' })
    await ctx.answerCbQuery()
    return ctx.scene.leave()
  } catch (_err) {
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
  await ctx.editMessageReplyMarkup({})
  await ctx.reply('Canceled & Exited. You can start again by using /weekscores')
  return ctx.scene.leave()
})

weekScoresWizard.action(/^(yes|no)_sports_session$/, async (ctx) => {
  ctx.wizard.state.extraSportsPending = ctx.match[1] === 'yes'
  await ctx.editMessageReplyMarkup({})
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action(/^(yes|no)_new_sport$/, async (ctx) => {
  const isYes = ctx.match[1] === 'yes'
  ctx.wizard.state.pointsData.trySport = isYes ? PointMultipliers.trySport : 0
  if (isYes) { ctx.wizard.state.pointsData.total += PointMultipliers.trySport }
  await ctx.editMessageReplyMarkup({})
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action(/^sports_(\d+)$/, async (ctx) => {
  const sessions = parseInt(ctx.match[1], 10)
  if (isNaN(sessions) || sessions < 0 || sessions > 8) {
    await ctx.answerCbQuery('Invalid selection.')
    return
  }
  await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, `How many sports sessions did you attend this week? ${sessions} selected.`)
  const sportsPoints = sessions * PointMultipliers.sportsTurn
  ctx.wizard.state.pointsData.sportsTurn = sportsPoints
  ctx.wizard.state.pointsData.total += sportsPoints
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action(/^(yes|no)_recipe$/, async (ctx) => {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return
  }
  ctx.wizard.state.extraRecipePending = ctx.match[1] === 'yes'
  await ctx.editMessageReplyMarkup({})
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

weekScoresWizard.action(/^recipe_(\d+)$/, async (ctx) => {
  const count = parseInt(ctx.match[1], 10)
  if (isNaN(count) || count < 0 || count > 8) {
    await ctx.answerCbQuery('Invalid selection.')
    return
  }
  await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.recipeQuestionMessageId, null, `How many new recipes/foods did you try this week? ${count} selected.`)
  const recipePoints = count * PointMultipliers.tryRecipe
  ctx.wizard.state.pointsData.tryRecipe = recipePoints
  ctx.wizard.state.pointsData.total += recipePoints
  await ctx.wizard.steps[ctx.wizard.cursor](ctx)
  await ctx.answerCbQuery()
})

module.exports = { weekScoresWizard }