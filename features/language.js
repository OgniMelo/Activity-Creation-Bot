const mongo = require("@util/mongo")
const languageSchema = require("@schemas/language-schema")
const lang = require("@root/lang.json")

// { "guildId": "language" }
const guildLanguages = {}

const loadLanguages = async client => {
    await mongo().then(async mongoose => {
        try {
            for (const guild of client.guilds.cache) {
                const guildId = guild[0]

                const result = await languageSchema.findOne({
                    _id: guildId
                })

                guildLanguages[guildId] = result ? result.language : "english"
            }
        }
        finally {
            mongoose.connection.close()
        }
    })
}

const setLanguage = (guild, language) => {
    guildLanguages[guild.id] = language.toLowerCase()
}

const getLanguage = (guild) => {
    return guildLanguages[guild.id].toLowerCase()
}

const replaceVars = (language, textId, ...vars) => {
    let translatedText = lang.translations[language][textId]
    	
		let count = 0;
		translatedText = translatedText.replace(/%VAR%/g, () => vars[count] !== null ? vars[count++] : "%VAR%");

	return translatedText;
}

const getTranslation = (guild, textId, ...vars) => {
    const currentGuildLanguage = guildLanguages[guild.id].toLowerCase()

    if (!lang.translations[currentGuildLanguage][textId]) {
        throw new Error(`Unknown Text ID "${textId}"`)
    }

    return replaceVars(currentGuildLanguage, textId, vars)
}

module.exports = (client) => { loadLanguages(client) }

module.exports.loadLanguages = loadLanguages
module.exports.setLanguage = setLanguage
module.exports.getLanguage = getLanguage
module.exports.getTranslation = getTranslation