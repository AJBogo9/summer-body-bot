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
      if (key.toString() === 'sportsTurn') { user.lastSubmission = new Date() }
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
    const rankings = await User.aggregate([
      { $match: { "points.total": { $gt: 0 }, team: { $ne: null } } },
      { $group: {
          _id: "$team",
          totalPoints: { $sum: "$points.total" },
          count: { $sum: 1 },
          averagePoints: { $avg: "$points.total" }
      }},
      { $match: { count: { $gte: 3 } } },
      { $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "_id",
          as: "teamInfo"
      }},
      { $unwind: "$teamInfo" },
      { $project: {
          _id: 0,
          name: "$teamInfo.name",
          totalPoints: 1,
          averagePointsPerMember: { $round: ["$averagePoints", 1] }
      }},
      { $sort: { averagePointsPerMember: -1 } },
      { $limit: 15 }
    ]);

    return rankings;
  } catch (error) {
    console.error('Error occurred in getTeamRankings:', error);
    throw new Error('Error fetching team rankings');
  }
};

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
    const guildAggregation = await User.aggregate([
      {
        $match: {
          "points.total": {
            $gt: 0,
          },
        },
      },
      {
        $group: {
          _id: "$guild",
          totalPoints: {
            $sum: "$points.total",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $match: {
          count: {
            $gte: 3,
          },
        },
      },
    ])

    const resultsWithAverage = guildAggregation.map(item => {
      const averagePoints = item.count > 0 ? (item.totalPoints / item.count).toFixed(1) : 0
      return {
        guild: item._id,
        count: item.count,
        average: averagePoints
      }
    })

    return resultsWithAverage
  } catch (error) {
    console.error('Error occurred in getGuildsLeaderboards:', error)
    throw new Error('Error fetching guild average points')
  }
}

const getGuildsTopLeaderboards = async () => {
  try {
    const guildAggregation = await User.aggregate([
      {
        $match: {
          "points.total": { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$guild",
          pointsArray: { $push: "$points.total" },
        },
      },
      {
        $addFields: {
          count: { $size: "$pointsArray" },
        },
      },
      {
        $match: {
          count: { $gte: 3 },
        },
      },
      {
        $addFields: {
          sortedPoints: { $sortArray: { input: "$pointsArray", sortBy: -1 } },
        },
      },
      {
        $addFields: {
          topCount: { $ceil: { $divide: ["$count", 2] } },
        },
      },
      {
        $project: {
          guild: "$_id",
          count: 1,
          topPoints: { $slice: ["$sortedPoints", "$topCount"] },
        },
      },
      {
        $project: {
          guild: 1,
          count: 1,
          totalPoints: { $sum: "$topPoints" },
          average: { $avg: "$topPoints" },
        },
      },
    ])

    const resultsWithAverage = guildAggregation.map(item => ({
      guild: item.guild,
      count: item.count,
      average: item.average ? item.average.toFixed(1) : 0
    }))

    return resultsWithAverage
  } catch (error) {
    console.error(error)
    throw error
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

    const users = await User.find({ "points.total": { $gt: 0 } })
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
  getGuildsTopLeaderboards,
  getGuildsTotals,
}
