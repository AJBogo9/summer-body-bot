const { Telegraf, Scenes, session } = require('telegraf')
const { telegramToken, commands, responses, maxUsage } = require('./config')
const https = require('https')

const agent = new https.Agent({
  keepAlive: false,
})

const bot = new Telegraf(telegramToken, {
  telegram: { agent },
})

const { startWizard } = require('./flows/information-flows/start')
const { howToGetPoints } = require('./flows/information-flows/how-to-points')
const { statsInfoScene } = require('./flows/information-flows/stats-info')
const { helpScene } = require('./flows/information-flows/help')
const { termsScene } = require('./flows/information-flows/terms')

const { deleteUserWizard } = require('./flows/delete-user')
const { registerWizard } = require('./flows/register')
const { createTeamWizard } = require('./flows/create-team')
const { joinTeamWizard } = require('./flows/join-team')
const { weekScoresWizard } = require('./flows/week-scores')
const { sportsActivityWizard } = require('./flows/exercise-scores')

const { teamRankingsScene } = require('./flows/statistics-flows/team-rankings')
const { teamMemberRankingsScene } = require('./flows/statistics-flows/team-member-rankings')
const { userSummaryScene } = require('./flows/statistics-flows/user-summary')
const { guildStandingsScene } = require('./flows/statistics-flows/guild-standings')
const { guildComparisonScene } = require('./flows/statistics-flows/guild-comparison')
const { topUsersScene } = require('./flows/statistics-flows/top-users')

const onlyPrivate = require('./utils/check-private')

const texts = require('./utils/texts')

const stage = new Scenes.Stage([
                startWizard,
                howToGetPoints,
                statsInfoScene,
                helpScene,
                termsScene,
                deleteUserWizard,
                registerWizard,
                createTeamWizard,
                joinTeamWizard,
                weekScoresWizard,
                sportsActivityWizard,
                teamRankingsScene,
                teamMemberRankingsScene,
                userSummaryScene,
                guildStandingsScene,
                guildComparisonScene,
                topUsersScene,
              ])

bot.use(session())
bot.use(stage.middleware())

const allowedCommands = ['start', 'register', 'jointeam', 'createteam', 'rmuser', 'team'];

bot.use(async (ctx, next) => {
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    const command = ctx.message.text.split(' ')[0].substring(1).toLowerCase();
    if (!allowedCommands.includes(command)) {
      return ctx.reply('Competition hasn’t started yet, use /register to register to the competition.');
    }
  }
  await next();
});

bot.command('help', (ctx) => { ctx.scene.enter('help_scene') })

bot.command('start', onlyPrivate, (ctx) => { ctx.scene.enter('start_wizard') })
bot.command('howtogetpoints', onlyPrivate, (ctx) => { ctx.scene.enter('how_to_get_points_scene') })
bot.command('statsinfo', onlyPrivate, (ctx) => { ctx.scene.enter('stats_info_scene') })
bot.command('terms', onlyPrivate, (ctx) => { ctx.scene.enter('terms_scene') })

bot.command('rmuser', onlyPrivate, (ctx) => { ctx.scene.enter('delete_user_wizard') })
bot.command('register', onlyPrivate, (ctx) => { ctx.scene.enter('register_wizard') })
bot.command('createteam', onlyPrivate, (ctx) => { ctx.scene.enter('create_team_wizard') })
bot.command('jointeam', onlyPrivate, (ctx) => { ctx.scene.enter('join_team_wizard') })
bot.command('weekscores', onlyPrivate, (ctx) => { ctx.scene.enter('week_scores_wizard') })
bot.command('addexercise', onlyPrivate, (ctx) => { ctx.scene.enter('sports_activity_wizard') })

bot.command('leaderboards', (ctx) => { ctx.scene.enter('team_rankings_scene') })
bot.command('team', (ctx) => { ctx.scene.enter('team_member_rankings_scene') })
bot.command('summary', (ctx) => { ctx.scene.enter('user_summary_scene') })
bot.command('topguilds', (ctx) => { ctx.scene.enter('guild_standings_scene') })
bot.command('topguildsall', (ctx) => { ctx.scene.enter('guild_comparison_scene') })
bot.command('topusers', (ctx) => { ctx.scene.enter('top_users_scene') })

const usedCommands = {}
commands.forEach(cmd => {
  usedCommands[cmd] = new Set()
})

commands.forEach(cmd => {
  bot.command(cmd, async (ctx) => {
    try {
      await ctx.deleteMessage()
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
    const userId = ctx.from.id
    if (usedCommands[cmd].size >= maxUsage) {
      return 
    }
    if (usedCommands[cmd].has(userId)) {
      return
    }
    usedCommands[cmd].add(userId)
    return ctx.replyWithSticker(responses[cmd])
  })
})

bot.catch((err, ctx) => { 
  console.error(`Encountered an error for ${ctx.updateType}`, err) 
  ctx.reply(texts.actions.error.error)
})

module.exports = bot