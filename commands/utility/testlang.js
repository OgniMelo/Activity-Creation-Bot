const { getLanguage, getTranslation } = require("@features/language")

module.exports = {
    commands: ["testlang"],
    permissionError: "err_MissingAdminPermission",//"You need Administrator permission to run this command.",
    minArgs: 0,
    maxArgs: null,
    callback: (message, arguments, text, client) => {
        const language = getLanguage(message.guild)
        message.channel.send(getTranslation(message.guild, "inf_CurrentLang", language))
    },
    requiredPermissions: [],
    requiredRoles: []
}