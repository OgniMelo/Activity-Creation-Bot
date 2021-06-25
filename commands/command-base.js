const mongo = require("@util/mongo")
const prefixSchema = require("@schemas/prefix-schema")
const { getLanguage, getTranslation } = require("@features/language")

const { prefix: defaultPrefix } = require("@root/config.json")

const guildPrefixes = {} // { "guildId": "prefix" }

const validatePermissions = (permissions) => {
    const validPermissions = [
        "ADMINISTRATOR",
        "CREATE_INSTANT_INVITE",
        "KICK_MEMBERS",
        "BAN_MEMBERS",
        "MANAGE_CHANNELS",
        "MANAGE_GUILD",
        "ADD_REACTIONS",
        "VIEW_AUDIT_LOG",
        "PRIORITY_SPEAKER",
        "STREAM",
        "VIEW_CHANNEL",
        "SEND_MESSAGES",
        "SEND_TTS_MESSAGES",
        "MANAGE_MESSAGES",
        "EMBED_LINKS",
        "ATTACH_FILES",
        "READ_MESSAGE_HISTORY",
        "MENTION_EVERYONE",
        "USE_EXTERNAL_EMOJIS",
        "VIEW_GUILD_INSIGHTS",
        "CONNECT",
        "SPEAK",
        "MUTE_MEMBERS",
        "DEAFEN_MEMBERS",
        "MOVE_MEMBERS",
        "USE_VAD",
        "CHANGE_NICKNAME",
        "MANAGE_NICKNAMES",
        "MANAGE_ROLES",
        "MANAGE_WEBHOOKS",
        "MANAGE_EMOJIS"
    ]

    for (const permission of permissions) {
        if (!validPermissions.includes(permission)) {
            throw new Error(`Unknown permission "${permission}"`)
        }
    }
}

const allCommands = {}

module.exports = (commandOptions) => {
    let {
        commands,
        requiredPermissions = [],
    } = commandOptions

    if (typeof commands === "string") {
        commands = [commands]
    }

    if (commands) {
        console.log(`Loading command "${commands[0]}"`)
    }
    else {
        return
    }

    if (requiredPermissions.length) {
        if (typeof requiredPermissions === "string") {
            requiredPermissions = [requiredPermissions]
        }

        validatePermissions(requiredPermissions)
    }

    for (const command of commands) {
        allCommands[command] = {
            ...commandOptions,
            commands,
            requiredPermissions
        }
    }
}

module.exports.listenCommands = (client) => {
    client.on("message", message => {
        const { member, content, guild } = message

        if (message.author.bot) {
            return
        }

        if (!guild) {
            message.channel.send("Private messages are not taken into account.")
            return
        }

        const prefix = guildPrefixes[guild.id] || defaultPrefix

        const arguments = content.split(/[ ]+/)
        //const arguments = content.trim().split(' ')

        const commandName = arguments.shift().toLowerCase()

        if (commandName.startsWith(prefix)) {
            const command = allCommands[commandName.replace(prefix, '')]
            if (!command) {
                return
            }

            const {
                requiredPermissions,
                permissionError = getTranslation(guild, "err_MissingPermission"),//"You do not have permission to run this command.",
                requiredRoles = [],
                minArgs = 0,
                maxArgs = null,
                expectedArgs,
                callback
            } = command
            
            message.delete({ timeout: 3000 }).catch(console.error)

            for (const permission of requiredPermissions) {
                if (!member.hasPermission(permission)) {
                    if (permissionError.startsWith("err_")) {
                        message.reply(getTranslation(guild, permissionError))
                        return
                    }

                    message.reply(permissionError)
                    return
                }
            }

            // for (const requiredRole of requiredRoles) {
            //     const role = guild.roles.cache.find(role => role.name === requiredRole)

            //     if (!role || !member.role.cache.has(role.id)) {
            //         message.reply(`You must have the "${requiredRole}" role to use this command`)
            //         return
            //     }
            // }

            let roleFound = false

            for (const requiredRole of requiredRoles) {
                const role = guild.roles.cache.find(role => role.name === requiredRole)

                if (role && member.roles.cache.has(role.id)) {
                    roleFound = true
                    break
                }
            }

            if (requiredRoles.length && !roleFound) {
                message.reply(getTranslation(guild, "err_MissingRole", requiredRoles.join(" / "))) //`You must have one of the following roles to use this command :\n${requiredRoles.join(" / ")}`)
                return
            }

            if (arguments.length < minArgs || (maxArgs !== null && arguments.length > maxArgs)) {
                message.reply(getTranslation(guild, "err_IncorrectSyntax", commandName, expectedArgs))
                return
            }

            callback(message, arguments, arguments.join(' '), client)
        }
    })
}

module.exports.setPrefix = (guild, prefix) => {
    guildPrefixes[guild.id] = prefix
}

module.exports.getPrefix = guild => {
    return guildPrefixes[guild.id]
}

module.exports.loadPrefixes = async client => {
    await mongo().then(async mongoose => {
        try {
            for (const guild of client.guilds.cache) {
                const guildId = guild[0]

                const result = await prefixSchema.findOne({
                    _id: guildId
                })

                guildPrefixes[guildId] = result ? result.prefix : defaultPrefix
            }
        }
        finally {
            mongoose.connection.close()
        }
    })
}