const mongoose = require("mongoose")

const reqString = {
    type: String,
    required: true
}

const languageSchema = mongoose.Schema({
    _id: reqString, // Guild ID
    language: reqString // Language
})

module.exports = mongoose.model("languages", languageSchema)