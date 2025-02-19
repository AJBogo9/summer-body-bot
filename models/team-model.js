const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  guild: {
    type: String, 
    enum: ['TiK', 'DG', 'FK', 'PT', 'AS', 'SIK', 'KIK', 'MK', 'IK', 'Athene', 'Prodeko', 'Inkubio'], 
    required: true 
  },
  points: {
    exercise: { type: Number, default: 0 },
    sportsTurn: { type: Number, default: 0 },
    trySport: { type: Number, default: 0 },
    tryRecipe: { type: Number, default: 0 },
    goodSleep: { type: Number, default: 0 },
    lessAlc: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
})

teamSchema.index({ guild: 1, 'points.total': -1 })
teamSchema.index({ _id: 1, 'points.total': -1 })

module.exports = mongoose.model('Team', teamSchema)
