const { BotOwnerId } = require("@root/config.json")

const { getLanguage, getTranslation } = require("@features/language")

module.exports = {
    commands: ["setstatus", "status"],
    expectedArgs: "[Status text]",
    permissionError: "err_BotOwner",
    minArgs: 0,
    maxArgs: null,
    callback: async (message, arguments, text, client) => {
        const { member, guild } = message

        const permissionError = "err_BotOwner"

        if (member.id !== BotOwnerId) {
            message.channel.send(getTranslation(guild, permissionError))
            return
        }

        if (!member.roles.cache.find(role => role.name === `${client.user.tag} - Bot Owner`)) {
            message.channel.send(getTranslation(guild, permissionError))
            return
        }

        client.user.setPresence({
            activity: {
                name: text,
                type: 0
            }
        })
        
        message.channel.send(getTranslation(guild, "inf_StatusChanged"))
    },
    requiredPermissions: [],
    requiredRoles: ["Activity Creation - Bot Owner"]
}