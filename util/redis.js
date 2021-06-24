const redis = require("redis")
const { redisPath } = require("@root/config.json")

module.exports = async () => {
    return await new Promise((resolve, reject) => {
        const client = redis.createClient({
            url: redisPath
        })

        client.on("error", err => {
            console.error("Redis error : ", err)
            client.quit()
            reject(err)
        })

        client.on("ready", () => {
            resolve(client)
        })
    })
}

module.exports.expire = callback => {
    const expired = () => {
        const sub = redis.createClient({ url: redisPath })
        sub.subscribe('__keyevent@0__:expired', () => {
            sub.on("message", (channel, message) => [
                callback(message)
            ])
        })
    }

    const pub = redis.createClient({ url: redisPath })
    pub.send_command("config", ["set", "notify-keyspace-events", "ex"], expired())
}

// Connect to Redis and set a key
// const redisClient = await redis()
// try {
//     console.log("Connected to redis server.")
//     redisClient.set("TestKey", "Just a test value", "ex", 60) // Set a key with TTL of 60 seconds
// }
// finally {
//     redisClient.quit()
// }