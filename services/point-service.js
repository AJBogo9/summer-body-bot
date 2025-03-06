const Team = require('../models/team-model')
const User = require('../models/user-model')

const addPoints = async (userId, pointsData) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) {
      throw new Error('User not found')
    }

    const team = await Team.findById(user.team)

    Object.keys(pointsData).forEach((key) => {
      user.points[key] += pointsData[key]
      user.lastSubmission = new Date()
    })

    await user.save()
    
    if (team) {
      Object.keys(pointsData).forEach((key) => {
        team.points[key] += pointsData[key]
      })
      await team.save()
    }

    return user
  } catch (error) {
    console.error('Error occurred in addPoints:', error)
    throw new Error('Error adding points')
  }
}

const getTeamRankings = async () => {
  try {
    const teams = await Team.find()

    const teamsWithAverages = await Promise.all(teams.map(async (team) => {
      const teamMembersCount = await User.countDocuments({ team: team._id })
      const averagePointsPerMember = teamMembersCount > 0 ? team.points.total / teamMembersCount : 0

      return {
        _id: team._id,
        name: team.name,
        totalPoints: team.points.total,
        averagePointsPerMember,
      }
    }))

    const sortedTeams = teamsWithAverages.sort((a, b) => b.averagePointsPerMember - a.averagePointsPerMember).slice(0, 30)

    return sortedTeams.map(team => ({
      name: team.name,
      totalPoints: team.totalPoints,
      averagePointsPerMember: team.averagePointsPerMember.toFixed(1)
    }))
  } catch (error) {
    console.error('Error occurred in getTeamRankings:', error)
    throw new Error('Error fetching team rankings')
  }
}

const getTeamMemberRankings = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) {
      throw new Error('User not found')
    }

    const team = await Team.find({ _id: user.team })
    if (!team) {
      throw new Error('Team not found')
    }
    const teamName = team[0].name
    
    const teamMembers = await User.find({ team: user.team }).sort({ 'points.total': -1 })
    return teamMembers.map(member => ({
      name: member.name,
      totalPoints: member.points.total,
      teamName: teamName
    }))
  } catch (error) {
    console.error('Error occurred in getTeamMemberRankings:', error)
    throw new Error('Error fetching team member rankings')
  }
}

const getUserSummary = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    if (!user) {
      throw new Error('User not found')
    }

    return user.points
  } catch (error) {
    console.error('Error occurred in getUserSummary:', error)
    throw new Error('Error fetching user summary')
  }
}

const getGuildsLeaderboards = async () => {
  try {
    const guildAggregation = await User.aggregate([{
        $group: {
          _id: "$guild",
          totalPoints: { $sum: "$points.total" },
          count: { $sum: 1 }
        }
      }])

    const resultsWithAverage = guildAggregation.map(item => {
      const averagePoints = item.count > 0 ? (item.totalPoints / item.count).toFixed(1) : 0
      return {
        guild: item._id,
        average: averagePoints
      }
    })

    return resultsWithAverage
  } catch (error) {
    console.error('Error occurred in getGuildsLeaderboards:', error)
    throw new Error('Error fetching guild average points')
  }
}

const getGuildsTotals = async () => {
  try {
    const categories = User.validCategories
    const allGuilds = User.validGuilds

    const guilds = {}
    allGuilds.forEach(guildName => {
      guilds[guildName] = { guild: guildName, participants: 0 }
      categories.forEach(category => {
        guilds[guildName][category] = { total: 0, average: 0 }
      })
    })

    const users = await User.find({})
    users.forEach(user => {
      if (guilds[user.guild]) {
        guilds[user.guild].participants += 1
        categories.forEach(category => {
          guilds[user.guild][category].total += user.points[category] || 0
        })
      }
    })

    for (const guildName in guilds) {
      const guildData = guilds[guildName]
      categories.forEach(category => {
        const total = guildData[category].total
        const count = guildData.participants
        guildData[category].average = count > 0 ? (total / count).toFixed(1) : "0"
      })
    }
    return Object.values(guilds)
  } catch (error) {
    console.error('Error occurred in getGuildsTotals:', error)
    throw new Error('Error fetching guild totals with averages and participant counts')
  }
}

module.exports = {
  addPoints,
  getTeamRankings,
  getTeamMemberRankings,
  getUserSummary,
  getGuildsLeaderboards,
  getGuildsTotals,
}
