const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {TodoSchema} = require('./Todo')
const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (email) => EMAIL_REGEX.test(email),
    },
  },
  password: {
    type: String,
    required: true,
  },
  todos: [
    {
      type: Schema.Types.ObjectId,
      ref: "todo",
    },
  ],
  createdTs: {
    type: Date,
    required: false,
    default: new Date(),
  },
  modifiedTs: {
    type: Date,
    required: false,
    default: new Date(),
  },
});

module.exports = mongoose.model("user", UserSchema);
