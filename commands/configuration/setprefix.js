const mongo = require("@util/mongo")
const prefixSchema = require("@schemas/prefix-schema")
const { setPrefix } = require("@commands/command-base")
const { getLanguage, getTranslation } = require("@features/language")

module.exports = {
    commands: ["setprefix", "sp"],
    expectedArgs: "<New prefix>",
    description: "Set the prefix of the server.",
    permissionError: "err_MissingAdminPermission",
    minArgs: 1,
    maxArgs: null,
    callback: async (message, arguments, text, client) => {
        const { member, channel, guild } = message

        const prefix = text

        await mongo().then(async mongoose => {
            try {
                await prefixSchema.findOneAndUpdate({
                    _id: guild.id
                },
                {
                    _id: guild.id,
                    prefix
                },
                {
                    upsert: true
                })

                setPrefix(guild, text)
                message.channel.send(getTranslation(guild, "inf_PrefixChanged", prefix))
            }
            finally {
                mongoose.connection.close()
            }
        })
    },
    requiredPermissions: ["ADMINISTRATOR"],
    requiredRoles: []
}