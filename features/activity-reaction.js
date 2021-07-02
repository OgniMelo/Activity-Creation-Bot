const Discord = require("discord.js")
const mongo = require("@util/mongo")
const activitySchema = require("@schemas/activity-schema")
const { saveActivityToMongo } = require("@commands/activity/activity")
const { getTranslation } = require("@features/language.js")
const { BotOwnerId } = require("@root/config.json")

const ERR_NOANSWERRECEIVED = (guild) => getTranslation(guild, "err_NoAnswerReceived")
const ACT_ALREADYREGISTERED = (guild) => getTranslation(guild, "act_AlreadyRegistered")

class Activity {
    guildId
	channelId
	messageId
    author
	description
	date
    timestamp
	nbMaxParticipant
    "participants" = ["-"]
    "reservists" = ["-"]
    "maybes" = ["-"]
    "unavailables" = ["-"]
    constructor() {}
}

const emojis = {
	participant: "✅",
	reservist: "❔",
	maybe: "🤔",
	unavailable: "❌",
	add: "➕",
	remove: "➖",
	delete: "🗑️"
}

module.exports = client => {
    client.on("messageReactionAdd", async (reaction, user) => {
        // Ignore self reactions
        if (user.bot) {
            return
        }

        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            try {
                await reaction.fetch()
            } catch (error) {
                console.log('Something went wrong when fetching the message: ', error)
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }

        const { message, emoji } = reaction
        const { channel, guild } = message

        // Check if the message is an embed created by the bot (All activities should)
        if (!(message.author.id === client.user.id && message.embeds.length)) {
            console.log("Not an embed message created by the bot.")
            return
        }

        // Check id the reaction is a valid activity reaction
        if (!Object.values(emojis).find(element => element === emoji.name)) {
            console.log("Not a valid activity reaction.")
            reaction.remove(user)
            return
        }

        let activityExists = false
        let activity = new Activity()

        await mongo().then(async mongoose => {
            try {
                const results = await activitySchema.find({
                	_guildId: guild.id,
                	_channelId: channel.id,
                	_messageId: message.id
                })

                // Check if the activity exists or if it's a normal message
                if (!results.length) {
                    return
                }
                else {
                    activityExists = true
                    activity = results[0].activity
                }
            }
            finally {
                mongoose.connection.close()
            }
        })

        if (!activityExists) {
            console.log("Activity not found in database.")
            return
        }

        // Check the reaction used and add the user to the activity or delete the activity
        if (emoji.name === emojis.participant) {
			console.log("Participant : " + user.id)
			addParticipant(message, activity, user)
		}
		else if (emoji.name === emojis.reservist) {
			console.log("Reservist : " + user.id)
			addReservist(message, activity, user)
		}
		else if (emoji.name === emojis.maybe) {
			console.log("Maybe : " + user.id)
			addMaybe(message, activity, user)
		}
		else if (emoji.name === emojis.unavailable) {
			console.log("Unavailable : " + user.id)
			addUnavailable(message, activity, user)
		}
		else if (emoji.name === emojis.add) {
			console.log("Plus : " + user.id)
			changeUserAvailability(message, activity, user, "add")
		}
		else if (emoji.name === emojis.remove) {
			console.log("Minus : " + user.id)
			changeUserAvailability(message, activity, user, "remove")
		}
		else if (emoji.name === emojis.delete) {
			console.log("DelActivity : " + user.id)
			deleteActivity(message, activity, user)
		}

        saveActivityToMongo(activity)

        reaction.users.remove(user)
    })
}

const modifyArray = (message, user, arrayToUpdate) => {
    const userString = `${user.tag} - ${user}`
    const { guild } = message

    if (arrayToUpdate[0] === "-") {
        arrayToUpdate = [userString]
        return arrayToUpdate
    }

    if (arrayToUpdate.find(activityUser => activityUser === userString)) {
        message.channel.send(getTranslation(guild, "act_AlreadyRegistered", user))
        return arrayToUpdate
    }

    arrayToUpdate.push(userString)
    return arrayToUpdate
}

const delActivityUser = (user, arrayToUpdate) => {
    const userString = `${user.tag} - ${user}`

    if (arrayToUpdate.find(activityUser => activityUser === userString)) {
        arrayToUpdate.splice(arrayToUpdate.indexOf(userString), 1)
    }

    if (arrayToUpdate.length === 0) {
        arrayToUpdate = ["-"]
    }
    return arrayToUpdate
}

const addParticipant = (message, activity, user) => {
    const userString = `${user.tag} - ${user}`
    const { guild } = message

    if (activity.participants[0] === "-") {
        activity.participants = [userString]
        updateEmbedList(message, activity)
        return
    }

    if (activity.participants.find(participant => participant === userString)) {
        message.channel.send(getTranslation(guild, "act_AlreadyRegistered", user))
        return
    }

    if (activity.participants.length === activity.nbMaxParticipant) {
        message.channel.send(getTranslation(guild, "act_ActivityFull", user))
        activity.reservists = modifyArray(message, user, activity.reservists)
        updateEmbedList(message, activity)
        return
    }

    // Add the user as participant
    activity.participants.push(userString)

    // Remove the user from other fields
    activity.reservists = delActivityUser(user, activity.reservists)
    activity.maybes = delActivityUser(user, activity.maybes)
    activity.unavailables = delActivityUser(user, activity.unavailables)
    updateEmbedList(message, activity)
}

const addReservist = (message, activity, user) => {
    // Add the user as reservist
    activity.reservists = modifyArray(message, user, activity.reservists)

    // Remove the user from other fields
    activity.participants = delActivityUser(user, activity.participants)
    activity.maybes = delActivityUser(user, activity.maybes)
    activity.unavailables = delActivityUser(user, activity.unavailables)
    updateEmbedList(message, activity)
}

const addMaybe = (message, activity, user) => {
    // Add the user as maybe
    activity.maybes = modifyArray(message, user, activity.maybes)

    // Remove the user from other fields
    activity.participants = delActivityUser(user, activity.participants)
    activity.reservists = delActivityUser(user, activity.reservists)
    activity.unavailables = delActivityUser(user, activity.unavailables)
    updateEmbedList(message, activity)
}

const addUnavailable = (message, activity, user) => {
    // Add the user as unavailable
    activity.unavailables = modifyArray(message, user, activity.unavailables)

    // Remove the user from other fields
    activity.participants = delActivityUser(user, activity.participants)
    activity.reservists = delActivityUser(user, activity.reservists)
    activity.maybes = delActivityUser(user, activity.maybes)
    updateEmbedList(message, activity)
}

const changeUserAvailability = async (message, activity, user, type) => {
    const { guild } = message

    if (!(await checkEditorPermission(message, activity, user))) {
        return
    }

    // User can add someone to the activity
    const filter = msg => msg.author.id = user.id
    const questionMessage = await message.channel.send(getTranslation(guild, "act_AddRemoveUserQuestion"))
    message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ["time"] })
    .then(collected => {
        const targetUser = collected.first().mentions.users.first()

        collected.first().delete({ timeout: 3000 }).catch(console.error)

        // Check if a user has been tagged
        if (!targetUser) {
            throw new Error("No user tagged.")
        }

        questionMessage.delete().catch(console.error)

        if (type === "add") {
            // Add the tagged user to the activity
            addParticipant(message, activity, targetUser)
            message.channel.send(getTranslation(guild, "act_UserAdded", targetUser)).then(message => {
                message.delete({ timeout: 5000 }).catch(console.error)
            })
        }
        else if (type === "remove") {
            // Remove the tagged user from the activity
            addUnavailable(message, activity, targetUser)
            message.channel.send(getTranslation(guild, "act_UserRemoved", targetUser)).then(message => {
                message.delete({ timeout: 5000 }).catch(console.error)
            })
        }
        return
    })
    .catch(collected => {
        questionMessage.delete().catch(console.error)
        message.reply(ERR_NOANSWERRECEIVED(guild))
        .then(message => message.delete({ timeout: 5000 }).catch(console.error))
    })
}

const deleteActivity = async (message, activity, user) => {
    const { channel, guild } = message

    if (!(await checkEditorPermission(message, activity, user))) {
        return
    }

    // User can delete the activity
    const redisClient = await redis()
    await mongo().then(async mongoose => {
        try {
            await activitySchema.findOneAndDelete({
                _guildId: guild.id,
                _channelId: channel.id,
                _messageId: message.id
            })

            redisClient.del(`ActivityCreationBot-activity-activityReminder-${activity.guildId}-${activity.channelId}-${activity.messageId}`)

            message.delete().catch(console.error).then(message => {
                message.channel.send(getTranslation(guild, "act_ActivityDeleted")).then(message => {
                    message.delete({ timeout: 10000 }).catch(console.error)
                })
            })
        }
        finally {
            mongoose.connection.close()
        }
    })
}

const checkEditorPermission = async (message, activity, user) => {
    const { guild } = message

    // Fetch the guildMember with the User ID
    const member = await guild.members.fetch(user.id)
    
    if (!member) {
        console.log("Fetch member error for addUser().")
        return false
    }

    // Check if member is the author of the activity / server admin / bot owner
    if (!(member.id === activity.author || member.permissions.has("ADMINISTRATOR") || member.id === BotOwnerId)) {
        message.channel.send(getTranslation(guild, "act_NotAuthor")).then(message => {
            message.delete({ timeout: 5000 }).catch(console.error)
        })
        return false
    }

    return true
}

const FIELD_INDEX = {
	"participant":0,
	"reservist":1,
	"maybe": 2,
	"unavailable":3
}

const updateEmbedList = (message, activity) => {
    const { guild } = message
    
    let newEmbed = new Discord.MessageEmbed(message.embeds[0])

    const filter = element => element !== "-"

    const newParticipantField = {
        name: getTranslation(guild, "act_ParticipantField", emojis["participant"], activity.participants.filter(filter).length, activity.nbMaxParticipant),
        value: activity.participants
    }
    const  newReservistField = {
        name: getTranslation(guild, "act_ReservistField", emojis["reservist"], activity.reservists.filter(filter).length),
        value: activity.reservists
    }
    const newMaybeField = {
        name: getTranslation(guild, "act_MaybeField", emojis["maybe"], activity.maybes.filter(filter).length),
        value: activity.maybes
    }
    const newUnavailableField = {
        name: getTranslation(guild, "act_UnavailableField", emojis["unavailable"], activity.unavailables.filter(filter).length),
        value: activity.unavailables
    }

    newEmbed.fields[FIELD_INDEX["participant"]] = newParticipantField
    newEmbed.fields[FIELD_INDEX["reservist"]] = newReservistField
    newEmbed.fields[FIELD_INDEX["maybe"]] = newMaybeField
    newEmbed.fields[FIELD_INDEX["unavailable"]] = newUnavailableField

    message.edit(message, newEmbed)
}