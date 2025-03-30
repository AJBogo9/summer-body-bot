const User = require('../models/user-model')
const { reminderMessage } = require('../config/constants')

const createUser = async (userData) => {
  try {
    const user = new User(userData)
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in createUser: ', error)
    throw new Error('Error creating user')
  }
}

const findUser = async (userId) => {
  try {
    const user = await User.findOne({ userId: userId })
    return user
  } catch (error) {
    console.error('Error occurred in findUser: ', error)
    throw new Error('Error finding user')
  }
}

const getAllUsers = async () => {
  try {
    const users = await User.find({})
    return users
  } catch (error) {
    console.error('Error occurred in getAllUsers:', error)
    return []
  }
}

const deleteUser = async (userId) => {
  try {
    const result = await User.deleteOne({ userId: userId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteUser:', error)
    throw new Error('Error deleting user')
  }
}

const addUserToTeam = async (userId, teamId) => {
  try {
    const user = await User.findById(userId)
    user.team = teamId
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in addUserToTeam:', error)
    throw new Error('Error adding user to team')
  }
}

/*const getGuildsTotalsWithParticipants = async () => {
  try {
    const guildsWithParticipants = await User.aggregate([
      { $group: { _id: "$guild", count: { $sum: 1 } } }
    ])

    const guildsTotals = await pointService.getGuildsTotals()

    const standings = guildsTotals.map(guild => {
      const participantCount = guildsWithParticipants.find(g => g._id === guild.guild)?.count || 0
      return { ...guild, participants: participantCount }
    })

    return standings
  } catch (error) {
    console.error('Error occurred in getGuildsTotalsWithParticipants:', error)
    return []
  }
}*/

const sendReminder = async (bot) => {
  const users = await getAllUsers()
  const today = new Date().toISOString().split('T')[0]
  users.forEach((user) => {
    if (!user.lastSubmission || user.lastSubmission.toISOString().split('T')[0] !== today) {
      bot.telegram.sendMessage(user.userId, reminderMessage)
        .catch((err) => console.error(`Error sending reminder to ${user.userId}:`, err))
    }
  })
}

module.exports = {
  createUser,
  getAllUsers,
  //getGuildsTotalsWithParticipants,
  deleteUser,
  findUser,
  addUserToTeam,
  sendReminder
}
