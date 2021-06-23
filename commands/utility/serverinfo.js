const Discord = require("discord.js")

module.exports = {
    commands: ["serverinfo", "servinfo"],
    permissionError: "err_MissingAdminPermission",
    minArgs: 0,
    maxArgs: null,
    callback: (message, arguments, text, client) => {
        const { guild } = message

        const { name, region, memberCount, owner, afkTimeout } = guild
        const icon = guild.iconURL()

        const embed = new Discord.MessageEmbed()
            .setTitle(`Server info for "${name}"`)
            .setThumbnail(icon)
            .addFields(
                {
                    name: "Region",
                    value: region
                },
                {
                    name: "Members",
                    value: memberCount
                },
                {
                    name: "Owner",
                    value: owner
                },
                {
                    name: "AFK Timeout",
                    value: afkTimeout / 60
                }
            )
        message.channel.send(embed)
    },
    requiredPermissions: [],
    requiredRoles: []
}