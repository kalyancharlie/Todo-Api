const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const Token = require('./Token')

const EMAIL_REGEX = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const ISSUER = "TODO-API";
const SUBJECT = "TODO-APP";

const UserSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

UserSchema.methods = {
  generateAccessToken() {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env;
      const user = { email: this.email, user_id: this._id };
      const accessToken = jwt.sign({ user }, ACCESS_TOKEN_SECRET, {
        subject: SUBJECT,
        issuer: ISSUER,
        expiresIn: "50s",
      });
      console.log("GENERATE ACCESSS TOKEN JWT", accessToken);
      return accessToken;
    } catch (error) {
      return null;
    }
  },
  async generateRefreshToken() {
    try {
      const { REFRESH_TOKEN_SECRET } = process.env;
      const user = { email: this.email, user_id: this._id };
      const refreshToken = jwt.sign({ user }, REFRESH_TOKEN_SECRET, {
        subject: SUBJECT,
        issuer: ISSUER,
        expiresIn: "15d",
      });
      console.log("GENERATE REFRESH TOKEN JWT", refreshToken);
      const tokenModel = new Token({ user_id: this._id, token: refreshToken });
      const createdToken = await tokenModel.save();
      if (!createdToken) {
        console.log("GENERATE REFRESH TOKEN - main", refreshToken);
        return null;
      }
      return refreshToken;
    } catch (error) {
      console.log("GENERATE REFRESH TOKEN ERROR", error);
      return null;
    }
  },
};

module.exports = mongoose.model("user", UserSchema);
