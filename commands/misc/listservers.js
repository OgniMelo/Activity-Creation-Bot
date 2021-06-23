const { BotOwnerId } = require("@root/config.json")

const { getLanguage, getTranslation } = require("@features/language")

module.exports = {
    commands: ["listservers", "ls"],
    permissionError: "err_BotOwner",
    minArgs: 0,
    maxArgs: null,
    callback: (message, arguments, text, client) => {
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
        client.guilds.cache.forEach(guild => {
            message.channel.send(`${guild.name} (${guild.id}) has ${guild.memberCount} members.`)
        })
    },
    requiredPermissions: [],
    requiredRoles: ["Activity Creation - Bot Owner"]
}