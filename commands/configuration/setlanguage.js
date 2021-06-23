const mongo = require("@util/mongo")
const languageSchema = require("@schemas/language-schema")
const { languages } = require("@root/lang.json")
const { setLanguage, getTranslation } = require("@features/language.js")

module.exports = {
    commands: ["setlanguage", "setlang", "sl"],
    expectedArgs: "<language>",
    permissionError: "You need Administrator permission to run this command.",
    minArgs: 1,
    maxArgs: 1,
    callback: async (message, arguments, text, client) => {
        const { guild } = message

        const newLanguage = arguments[0].toLowerCase()

        if (!languages.includes(newLanguage)) {
            message.reply(getTranslation(guild, "err_LangNotSupported")).then(message => {
                message.channel.send(getTranslation(guild, "inf_SupportedLang", languages.join(" / ")))
            })
            return
        }

        setLanguage(guild, newLanguage)

        await mongo().then(async mongoose => {
            try {
                await languageSchema.findOneAndUpdate({
                    _id: guild.id
                },
                {
                    _id: guild.id,
                    language: newLanguage
                },
                {
                    upsert: true
                })

                message.reply(getTranslation(guild, "inf_LangChanged", newLanguage)).then(message => message.delete( {timeout: 30000} ).catch(console.error))
            }
            finally {
                mongoose.connection.close()
            }
        })
    },
    requiredPermissions: ["ADMINISTRATOR"],
    requiredRoles: []
}