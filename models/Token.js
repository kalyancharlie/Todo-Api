const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true
    },
}, {timestamps: true})

const Token = mongoose.model('token', TokenSchema)

module.exports = Token