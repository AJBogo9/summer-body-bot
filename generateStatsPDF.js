const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const config = require('./config')
const User = require('./models/user-model')
const Team = require('./models/team-model')

const guildLogos = {
  TiK: path.join(__dirname, 'logos', 'tik_logo.png'),
  PT: path.join(__dirname, 'logos', 'pt_logo.png'),
  IK: path.join(__dirname, 'logos', 'ik_logo.png'),
  FK: path.join(__dirname, 'logos', 'fk_logo.png'),
  MK: path.join(__dirname, 'logos', 'mk_logo.png'),
  KIK: path.join(__dirname, 'logos', 'kik_logo.png'),
  SIK: path.join(__dirname, 'logos', 'sik_logo.png'),
  Inkubio: path.join(__dirname, 'logos', 'inkubio_logo.png'),
  DG: path.join(__dirname, 'logos', 'dg_logo.png'),
  AS: path.join(__dirname, 'logos', 'as_logo.png'),
  Prodeko: path.join(__dirname, 'logos', 'prodeko_logo.png'),
  Athene: path.join(__dirname, 'logos', 'athene_logo.png'),
  KY: path.join(__dirname, 'logos', 'ky_logo.png'),
  TOKYO: path.join(__dirname, 'logos', 'tokyo_logo.png'),
}

async function getGuildStats() {
  const teams = await Team.find({})
  const users = await User.find({})

  const guildStats = {}

  teams.forEach(team => {
    if (!guildStats[team.guild]) {
      guildStats[team.guild] = { guild: team.guild, totalPoints: 0, participants: 0, teams: [], users: [] }
    }
    guildStats[team.guild].totalPoints += team.points.total
    guildStats[team.guild].teams.push(team)
  })
  users.forEach(user => {
    if (!guildStats[user.guild]) {
      guildStats[user.guild] = { guild: user.guild, totalPoints: 0, participants: 0, teams: [], users: [] }
    }
    guildStats[user.guild].participants += 1
    guildStats[user.guild].users.push(user)
  })

  for (const guild in guildStats) {
    const stats = guildStats[guild]
    stats.average = stats.participants > 0
      ? (stats.totalPoints / stats.participants).toFixed(1)
      : "0"
  }
  return Object.values(guildStats)
}

async function getTopUsersForGuild(guild, limit = 5) {
  return await User.find({ guild }).sort({ "points.total": -1 }).limit(limit)
}

async function getTopTeamsForGuild(guild, limit = 5) {
  return await Team.aggregate([
    { $match: { guild: guild, "members.2": { $exists: true } } },
    { $addFields: { memberCount: { $size: "$members" } } },
    { $addFields: { averagePoints: { $divide: ["$points.total", "$memberCount"] } } },
    { $sort: { averagePoints: -1 } },
    { $limit: limit }
  ])
}

async function generateLandscapePdf() {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 30 })
  const date = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const outputPath = `stats_${hours}_${minutes}.pdf`
  doc.pipe(fs.createWriteStream(outputPath))

  doc.fontSize(20).text('Kesäkuntoon 2025 Statistics', { align: 'center' })
  //doc.moveDown(0.5)
  //doc.fontSize(12).text(`Generated on: ${new Date().toDateString()}`, { align: 'center' })
  doc.moveDown(1)

  const guildStatsArr = await getGuildStats()
  guildStatsArr.sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
  const overallTotalPoints = guildStatsArr.reduce((sum, gs) => sum + gs.totalPoints, 0)

  const margin = 30
  const availableWidth = 842 - margin * 2

  const colLogoX = margin
  const colLogoWidth = 60

  const colGuildX = colLogoX + colLogoWidth + 10
  const colGuildWidth = 50

  const colTotalX = colGuildX + colGuildWidth + 10
  const colTotalWidth = 50

  const colParticipantsX = colTotalX + colTotalWidth + 10
  const colParticipantsWidth = 75

  const colAvgX = colParticipantsX + colParticipantsWidth + 10
  const colAvgWidth = 60

  const colTopUsersX = colAvgX + colAvgWidth + 10
  const colTopUsersWidth = 200

  const colTopTeamsX = colTopUsersX + colTopUsersWidth + 10
  const colTopTeamsWidth = availableWidth - (colTopTeamsX - margin)

  doc.fontSize(13).font('Helvetica-Bold')
  const headerY = doc.y
  //doc.text('Logo', colLogoX, headerY, { width: colLogoWidth, align: 'center' })
  doc.text('Guild', colGuildX, headerY, { width: colGuildWidth, align: 'center' })
  doc.text('Total', colTotalX, headerY, { width: colTotalWidth, align: 'center' })
  doc.text('Participants', colParticipantsX, headerY, { width: colParticipantsWidth, align: 'center' })
  doc.text('Avg', colAvgX, headerY, { width: colAvgWidth, align: 'center' })
  doc.text('Top 5 Guild Members', colTopUsersX, headerY, { width: colTopUsersWidth, align: 'center' })
  doc.text('Top 5 Teams', colTopTeamsX, headerY, { width: colTopTeamsWidth, align: 'center' })
  doc.moveDown(0.5)
  doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
  doc.moveDown(0.5)

  for (let i = 0; i < guildStatsArr.length; i++) {
    const gs = guildStatsArr[i]
    doc.fontSize(12).font('Helvetica')
    const y = doc.y + 5

    if (guildLogos[gs.guild] && fs.existsSync(guildLogos[gs.guild])) {
      try {
        doc.image(guildLogos[gs.guild], colLogoX, y, { fit: [colLogoWidth, colLogoWidth], align: 'center' })
      } catch (_err) {
        doc.text('No Logo', colLogoX, y, { height: colLogoWidth, align: 'center' })
      }
    } else {
      doc.text('No Logo', colLogoX, y, { height: colLogoWidth, align: 'center' })
    }

    const titleY = y + 23

    doc.text(gs.guild, colGuildX, titleY, { width: colGuildWidth, align: 'center' })

    doc.text(gs.totalPoints.toString(), colTotalX, titleY, { width: colTotalWidth, align: 'center' })

    doc.text(gs.participants.toString(), colParticipantsX, titleY, { width: colParticipantsWidth, align: 'center' })

    doc.text(gs.average.toString(), colAvgX, titleY, { width: colAvgWidth, align: 'center' })

    doc.fontSize(10)

    const top5Y = y + 12

    const topUsers = await getTopUsersForGuild(gs.guild, 5)
    const topUsersStr = topUsers.map(u => `${u.name} (${u.points.total})`).join(', ')
    doc.text(topUsersStr, colTopUsersX, top5Y, { width: colTopUsersWidth, align: 'left' })

    const topTeams = await getTopTeamsForGuild(gs.guild, 5)
    const topTeamsStr = topTeams.map(t => `${t.name} (${t.averagePoints.toFixed(2)})`).join(', ')
    doc.text(topTeamsStr, colTopTeamsX, top5Y, { width: colTopTeamsWidth, align: 'left' })

    doc.moveDown(3.5)

    if ((i + 1) % 5 === 0 && (i + 1) < guildStatsArr.length) {
      doc.addPage({ layout: 'landscape', size: 'A4', margin: 30 })
      doc.fontSize(13).font('Helvetica-Bold')
      const headerY = doc.y
      doc.text('Guild', colGuildX, headerY, { width: colGuildWidth, align: 'center' })
      doc.text('Total', colTotalX, headerY, { width: colTotalWidth, align: 'center' })
      doc.text('Participants', colParticipantsX, headerY, { width: colParticipantsWidth, align: 'center' })
      doc.text('Avg', colAvgX, headerY, { width: colAvgWidth, align: 'center' })
      doc.text('Top 5 Guild Members', colTopUsersX, headerY, { width: colTopUsersWidth, align: 'center' })
      doc.text('Top 5 Teams', colTopTeamsX, headerY, { width: colTopTeamsWidth, align: 'center' })
      doc.moveDown(0.5)
      doc.moveTo(margin, doc.y).lineTo(842 - margin, doc.y).stroke()
      doc.moveDown(0.5)
    }
  }

  doc.fontSize(11).font('Helvetica-Bold')
  doc.text(`Overall Total Points across all guilds: ${overallTotalPoints}`, { halign: 'center' })

  doc.end()
  console.log(`PDF generated at: ${outputPath}`)
}

async function run() {
  try {
    await mongoose.connect(config.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('Connected to MongoDB')
    await generateLandscapePdf()
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error generating PDF:', error)
    process.exit(1)
  }
}

run()