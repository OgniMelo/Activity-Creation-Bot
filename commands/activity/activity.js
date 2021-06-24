const fs = require('fs')
const Discord = require("discord.js")

const mongo = require("@util/mongo")
const activitySchema = require("@schemas/activity-schema")

const { getTranslation } = require("@features/language.js")

const emojis = {
	participant: "✅",
	reservist: "❔",
	maybe: "🤔",
	unavailable: "❌",
	add: "➕",
	remove: "➖",
	delete: "🗑️"
}

const ERR_NOANSWERRECEIVED = (guild) => { return getTranslation(guild, "err_NoAnswerReceived") }
const ACT_ALREADYREGISTERED = (guild) => { return getTranslation(guild, "act_AlreadyRegistered") }

class Activity {
	guildId
	channelId
	messageId
    author
	description
	date
	nbMaxParticipant
    "participants" = ["-"]
    "reservists" = ["-"]
    "maybes" = ["-"]
    "unavailables" = ["-"]
    constructor() {}
}

const FIELD_INDEX = {
	"participant":0,
	"reservist":1,
	"maybe": 2,
	"unavailable":3
}

//
// Permissions
//

const permissionsNeeded = {
	VIEW_CHANNEL: 0x00000400,
	SEND_MESSAGES: 0x00000800,
	ADD_REACTIONS: 0x00000040,
	MANAGE_MESSAGES: 0x00002000
}

const objKeysToArray = object => {
	let keysArray = []

	for (const key in object) {
		keysArray.push(key)
	}

	return keysArray
}

//
// Permissions
//

const verifyDate = (message, arguments) => {
	const { guild } = message

	const dateArray = arguments.shift().split("/")
		const dateEntered = {
			day: dateArray.shift(),
			month: dateArray.shift(),
			year: dateArray.shift()
		}

		for (const data in dateEntered) {
			if (isNaN(dateEntered[data])) {
				message.channel.send(getTranslation(guild, "err_IncorrectDate", dateEntered.day, dateEntered.month, dateEntered.year))
				return undefined
			}
		}

		const timeArray = arguments.shift().split(":")
		const timeEntered = {
			hours: timeArray.shift(),
			minutes: timeArray.shift()
		}

		for (const data in timeEntered) {
			if (isNaN(timeEntered[data])) {
				message.channel.send(getTranslation(guild, "err_IncorrectTime", timeEntered.hours, timeEntered.minutes))
				return undefined
			}
		}

		const date = new Date(dateEntered.year, dateEntered.month - 1, dateEntered.day, timeEntered.hours, timeEntered.minutes)
		return date
}

module.exports = {
    commands: ["activity"],
    expectedArgs: "<date> <time> <nbMaxParticipants> <Description>",
    minArgs: 4,
    maxArgs: null,
    callback: async (message, arguments, text, client) => {
		const { member, channel, guild } = message
		const botPermissions = channel.permissionsFor(client.user)

		for (const permission in permissionsNeeded) {
			if (!(botPermissions & permissionsNeeded[permission])) {
				message.reply(getTranslation(guild, "err_MissingBotPermission", objKeysToArray(permissionsNeeded).join(" / ")))
				.then(message => message.delete({timeout: 30000}).catch(console.error))
				.catch(console.error)
				message.author.send(getTranslation(guild, "err_MissingBotPermission", objKeysToArray(permissionsNeeded).join(" / ")))
				.catch(console.error)
				return
			}
		}

		if (!(date = verifyDate(message, arguments))) {
			console.log("Date missing.")
			return
		}

		const activity = new Activity()
		activity.author = message.author
		activity.nbMaxParticipant = arguments.shift()
		activity.description = arguments.join(' ')
		activity.date = date.toLocaleString().replace(", ", " - ")

		if (isNaN(activity.nbMaxParticipant) || activity.nbMaxParticipant < 1) {
			channel.send(getTranslation(guild, "err_IncorrectNbParticipant", activity.nbMaxParticipant))
			return
		}

		const filter = element => element !== "-"

		let embed = new Discord.MessageEmbed()
			.setColor("#FD6B0D")
			.setTitle(date.toLocaleString().replace(", ", " - "))
			.setDescription(activity.description)
			.setAuthor(activity.author.tag, activity.author.avatarURL())
			//.setImage(infos.image)
			//.setThumbnail(infos.thumbnail)
			.addField(getTranslation(guild, "act_ParticipantField", emojis["participant"], activity.participants.filter(filter).length, activity.nbMaxParticipant), activity.participants, false)
			.addField(getTranslation(guild, "act_ReservistField", emojis["reservist"], activity.reservists.filter(filter).length), activity.reservists, false)
			.addField(getTranslation(guild, "act_MaybeField", emojis["maybe"], activity.maybes.filter(filter).length), activity.maybes, false)
			.addField(getTranslation(guild, "act_UnavailableField", emojis["unavailable"], activity.unavailables.filter(filter).length), activity.unavailables, false)
			.setFooter(activity.date)
		console.log(`Date : ${date.toLocaleString().replace(", ", " - ")}`)

		let msg = await channel.send(embed)
		for (const emoji in emojis) {
			msg.react(emojis[emoji])
		}

		activity.guildId = guild.id
		activity.channelId = channel.id
		activity.messageId = msg.id

		saveActivityToMongo(activity)
    },
    requiredPermissions: [],
    requiredRoles: []
}

const saveActivityToMongo = async activity => {
	let { messageId, channelId, guildId } = activity

	await mongo().then(async mongoose => {
		try {
			await activitySchema.findOneAndUpdate({
				_guildId: guildId,
				_channelId: channelId,
				_messageId: messageId
			},
			{
				_guildId: guildId,
				_channelId: channelId,
				_messageId: messageId,
				activity
			},
			{
				upsert: true
			})

			console.log("Activity created/updated in db.")
			// message.reply(getTranslation(guild, "inf_LangChanged", newLanguage)).then(message => message.delete( {timeout: 30000} ).catch(console.error))

			// const results = await activitySchema.find({
			// 	_guildId: guildId,
			// 	_channelId: channelId,
			// 	_messageId: messageId
			// })
		}
		finally {
			mongoose.connection.close()
		}
	})
}

module.exports.saveActivityToMongo = activity => saveActivityToMongo(activity)