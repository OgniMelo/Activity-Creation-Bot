const loadCommands = require("@commands/load-commands")
const { getPrefix } = require("@commands/command-base")
const { prefix: defaultPrefix } = require("@root/config.json")

module.exports = {
    commands: ["help", "h"],
    description: "List the supported commands of the bot.",
    callback: (message, arguments, text, client) => {
        const prefix = getPrefix(message.guild) || defaultPrefix

        let reply = "Here is the list of all my supported commands :\n\n"

        const commands = loadCommands()

        for (const command of commands) {
            let requiredPermissions = command.requiredPermissions

            if (requiredPermissions) {
                let hasPermission = true
                if (typeof requiredPermissions === "string") {
                    requiredPermissions = [requiredPermissions]
                }

                for (const permission of requiredPermissions) {
                    if (!message.member.hasPermission(permission)) {
                        hasPermission = false
                        break
                    }
                }

                if (!hasPermission) {
                    continue
                }
            }

            const mainCommand = typeof command.commands === "string" ? command.commands : command.commands[0]
            const args = command.expectedArgs ? ` ${command.expectedArgs}` : ""
            const description = command.description ? command.description : "Description not found."

            reply += `**${prefix}${mainCommand}${args}** : ${description}\n`
        }

        message.channel.send(reply)
    }
}