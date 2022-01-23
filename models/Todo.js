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

const Todo = mongoose.model("todo", TodoSchema);

module.exports = { TodoSchema, Todo };

