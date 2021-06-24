const mongoose = require("mongoose")

const reqString = {
    type: String,
    required: true
}

const reqArray = {
    type: Array,
    required: true
}

const activityObjectSchema = mongoose.Schema({
    guildId: reqString,
    channelId: reqString,
    messageId: reqString,
    author: {
        type: Object,
        required: true
    },
    description: reqString,
    nbMaxParticipant: {
        type: Number,
        required: true
    },
    participants: reqArray,
    reservists: reqArray,
    maybes: reqArray,
    unavailables: reqArray
})

const activitySchema = mongoose.Schema({
    _guildId: reqString, // Guild ID
    _channelId: reqString, // Channel ID
    _messageId: reqString, // Message ID
    activity: {
        type: activityObjectSchema,
        required: true
    } // Activity Object
})

module.exports = mongoose.model("activity", activitySchema)
