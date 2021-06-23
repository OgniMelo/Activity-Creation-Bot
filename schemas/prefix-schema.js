const mongoose = require("mongoose")

const reqString = {
    type: String,
    required: true
}

const prefixSchema = mongoose.Schema({
    _id: reqString, // Guild ID
    prefix: reqString // Prefix
})

module.exports = mongoose.model("prefix", prefixSchema)