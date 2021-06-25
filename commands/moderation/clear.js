const { BotOwnerId } = require("@root/config.json")

const { getLanguage, getTranslation } = require("@features/language")

module.exports = {
    commands: ["clear"],
    expectedArgs: "<nbMessages>",
    description: "Delete <x> last messages from a channel. (Max 100)",
    permissionError: "err_MissingAdminPermission",
    minArgs: 1,
    maxArgs: 1,
    callback: (message, arguments, text, client) => {
        const amount = text

		if (isNaN(amount))
			return (message.reply("Aucun nombre reçu.").then(message => message.delete({timeout: 5000}).catch(console.error)))
		if (amount < 1)
			return (message.reply(getTranslation(message.guild, "err_CommandExecution")).then(message => message.delete({timeout: 5000}).catch(console.error)))
		if (amount > 100)
			return (message.reply(getTranslation(message.guild, "err_CommandExecution")).then(message => message.delete({timeout: 5000}).catch(console.error)))
		message.channel.messages.fetch()
			.then(message.channel.bulkDelete(amount))
			.catch(console.error)
    },
    requiredPermissions: ["ADMINISTRATOR"],
    requiredRoles: []
}