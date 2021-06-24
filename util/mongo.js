const mongoose = require("mongoose")
const { mongoPath } = require("@root/config.json")

module.exports = async () => {
    await mongoose.connect(mongoPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    })
    return mongoose
}

// Connect to MongoDB
// await mongo().then(mongoose => {
//     try {
//         console.log("Connected to Mongo.")
//     }
//     finally {
//         mongoose.connection.close()
//     }
// })