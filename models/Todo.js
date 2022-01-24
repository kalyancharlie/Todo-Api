const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TodoSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  todoText: {
    type: String,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    required: true,
    default: false,
  },
}, {timestamps: true});

const Todo = mongoose.model("todo", TodoSchema);

module.exports = { TodoSchema, Todo };

