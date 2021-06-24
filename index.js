require("module-alias/register")

const Discord = require("discord.js")
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })

const config = require("@root/config.json")

const loadCommands = require("@commands/load-commands")
const loadFeatures = require("@features/load-features")
const { loadPrefixes } = require("@commands/command-base")

client.on("ready", async () => {
    console.log("Connected as " + client.user.tag)

    loadPrefixes(client)
    loadCommands(client)
    loadFeatures(client)
})

client.login(config.token)