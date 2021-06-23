require("module-alias/register")

const Discord = require("discord.js")
const client = new Discord.Client()

const config = require("@root/config.json")

const loadCommands = require("@commands/load-commands")
const loadFeatures = require("@features/load-features")
const { loadPrefixes } = require("@commands/command-base")

// const mongo = require("@util/mongo")
// const redis = require("@util/redis")

client.on("ready", async () => {
    console.log("Connected as " + client.user.tag)

    loadPrefixes(client)
    loadCommands(client)
    loadFeatures(client)

    // Connect to MongoDB
    // await mongo().then(mongoose => {
    //     try {
    //         console.log("Connected to Mongo.")
    //     }
    //     finally {
    //         mongoose.connection.close()
    //     }
    // })

    // Connect to Redis and set a key
    // const redisClient = await redis()
    // try {
    //     console.log("Connected to redis server.")
    //     redisClient.set("TestKey", "Just a test value", "ex", 60) // Set a key with TTL of 60 seconds
    // }
    // finally {
    //     redisClient.quit()
    // }
})

client.login(config.token)