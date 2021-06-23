module.exports = {
    commands: ["ping"],
    minArgs: 0,
    maxArgs: null,
    callback: (message, arguments, text, client) => {
        const ping = client.ws.ping
        let toSend = ""

        if (ping < 51) {
            toSend += '✅'
        }
        else if (ping < 201) {
            toSend += '🆗'
        }
        else {
            toSend += '❗'
        }

        toSend += ` Ping : **${ping}ms** !`
        message.channel.send(toSend)
    },
}