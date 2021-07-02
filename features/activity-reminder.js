const redis = require("@util/redis")
const mongo = require("@util/mongo")
const activitySchema = require("@schemas/activity-schema")

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

module.exports = async client => {
    const reminderPrefix = "ActivityCreationBot-activity-activityReminder"

    redis.expire(async message => {
        if (message.startsWith(reminderPrefix)) {
            const split = message.split('-')
            const messageID = split[5]
            const channelID = split[4]
            const guildID = split[3]

            let activityExists = false
            let activity = new Activity()

            await mongo().then(async mongoose => {
                try {
                    const results = await activitySchema.find({
                        _guildId: guildID,
                        _channelId: channelID,
                        _messageId: messageID
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

            const guild = client.guilds.resolve(activity.guildId)

            if (!guild) {
                return
            }

            const participantsID = []
            const reservistsID = []

            activity.participants.forEach(participant => {
                participantsID.push(participant.slice(participant.lastIndexOf('@') + 1, participant.lastIndexOf('>')))
            })
            activity.reservists.forEach(reservist => {
                reservistsID.push(reservist.slice(reservist.lastIndexOf('@') + 1, reservist.lastIndexOf('>')))
            })
            
            await guild.members.fetch()

            participantsID.forEach(id => {
                const member = guild.members.cache.find(member => member.id === id)
                if (member) {
                    member.user.send(`L'activité \`${activity.description}\` commence dans moins de 30 minutes.`).catch(console.error)
                    console.log(`Reminder sent to ${member.user.tag}.`)
                }
            })
            reservistsID.forEach(id => {
                const member = guild.members.cache.find(member => member.id === id)
                if (member) {
                    member.user.send(`L'activité \`${activity.description}\` commence dans moins de 30 minutes.`).catch(console.error)
                    console.log(`Reminder sent to ${member.user.tag}.`)
                }
            })
            console.log(`Reminders sent for ${activity.description}`)
            return
        }
    })
}