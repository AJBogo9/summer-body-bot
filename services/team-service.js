const Team = require('../models/team-model')
const User = require('../models/user-model')

const createTeam = async (teamName, guild) => {
  try {
    const team = new Team({ name: teamName, guild: guild })
    await team.save()
    return team
  } catch (error) {
    console.error('Error occurred in createTeam:', error)
    throw error
  }
}

const deleteTeam = async (teamId) => {
  try {
    const result = await Team.deleteOne({ _id: teamId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteTeam:', error)
    throw new Error('Error deleting team')
  }
}

const joinTeam = async (userId, teamId) => {
  try {
    const team = await Team.findById(teamId)
    const user = await User.findById(userId)
    for (const key in user.points) {
      team.points[key] = (team.points[key] || 0) + user.points[key]
    }
    team.members.push(userId)
    await team.save()
  } catch (error) {
    console.error('Error occurred in joinTeam:', error)
    throw new Error('Error joining team')
  }
}

const leaveTeam = async (userId, teamId) => {
  try {
    const team = await Team.findById(teamId)

    const memberIndex = team.members.indexOf(userId)

    if (memberIndex === -1) {
      console.error(`User with ID ${userId} is not a member of team ${teamId}`)
      throw new Error('User not in team')
    }

    const user = await User.findById(userId)
    for (const key in user.points) {
      team.points[key] = (team.points[key] || 0) - user.points[key]
    }

    team.members.splice(memberIndex, 1)
    await team.save()
    if (team.members.length === 0) {
      await deleteTeam(teamId)
    }
  } catch (error) {
    console.error('Error occurred in leaveTeam:', error)
    throw new Error('Error leaving team')
  }
}

const getTeamById = async (teamId) => {
  try {
    const team = await Team.findById(teamId)
    return team
  } catch (error) {
    console.error('Error occurred in getTeamById:', error)
    throw new Error('Error retrieving team')
  }
}

module.exports = {
  createTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  getTeamById
}
