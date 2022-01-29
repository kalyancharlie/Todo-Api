const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = mongoose.model("user");
const Token = mongoose.model("token");
require('dotenv').config()

const ISSUER = "TODO-API";
const SUBJECT = "TODO-APP";

// Validate User Credentials
const validateCredentials = async (email, password) => {
  const validationStatus = { status: false, message: "", statusCode: 400 };
  try {
    if (email == null || !email) {
      validationStatus.message = "Invalid Email Id";
      throw validationStatus;
    }
    if (password == null || !password) {
      validationStatus.message = "Invalid Password";
      throw validationStatus;
    }

    const user = await User.findOne({ email });
    if (!user) {
      validationStatus.message = "Email Id not found";
      validationStatus.statusCode = 401;
      throw validationStatus;
    }

    const passVerifyStatus = await bcrypt.compare(password, user.password);
    if (!passVerifyStatus) {
      validationStatus.message = "Wrong Password!";
      validationStatus.statusCode = 401;
      throw validationStatus;
    } else {
      validationStatus.status = true;
      validationStatus.message = "Success";
      validationStatus.statusCode = 200;
      validationStatus.user = user;
    }
    return validationStatus;
  } catch (error) {
    console.log({ ...error });
    return Object.assign({}, validationStatus, {
      statusCode: 500,
      message: "Internal Server Error",
      ...error,
    });
  }
};

const isTokenValid = (token, SECRET) => {
  try {
    jwt.verify(token, SECRET, (err, payload) => {
      if (err) {
        console.log(err)
        return false
      }
    })
    return true
  } catch (error) {
    console.log('VALIDATE ACCESS TOKEN')
    console.log(error)
    return false
  }
}

module.exports = {
  authenticateUser: async (req, res, next) => {
    try {
      // Authenticate
      const { email, password } = req.body;

      const { user, ...userAuthStatus } = await validateCredentials(
        email,
        password
      );
      if (!userAuthStatus.status) {
        return res.status(userAuthStatus.statusCode).json({...userAuthStatus, userId: user._id, name: user.name, email: user.email});
      }

      // Generate Access Token & Refresh Token
      const accessToken = user.generateAccessToken();
      const refreshToken = await user.generateRefreshToken();

      // Set the Cookie
      res.cookie('_rt', refreshToken, {
        httpOnly: true,
        secure: true,
        expire: Date.now() + (86400 * 15),
        path: process.env.REFRESH_COOKIE_PATH || '/',
      })
      // Send the Tokens
      return res
        .status(201)
        .json({ ...userAuthStatus, accessToken, refreshToken });
    } catch (error) {}
  },
  verifyAccessToken: (req, res, next) => {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env;
      const token = req.headers["x-api-key"];
      if (!token) {
        return res.status(400).json({status: false, message: 'Token Must be provided'})
      }
      console.log(token, ACCESS_TOKEN_SECRET)
      const tokenStatus = isTokenValid(token, ACCESS_TOKEN_SECRET)
      if (tokenStatus) {
        return res.status(200).json({status: true, message: 'Valid Token'})
      }
      return res.status(403).json({status: false, message: 'Token Expired or Invalid'})
    } catch (error) {
      console.log('VERIFY ACCESS TOKEN ERRO:')
      console.log(error)
      return res.status(500).json({status: false, message: 'Internal Server Error'})
    }
    
  },
  authGuard: (req, res, next) => {
    // Check the Header for token & verify
    const { ACCESS_TOKEN_SECRET } = process.env;
    const token = req.headers["x-api-key"];
    
    console.log("INSIDE AUTH GUARD", token);
    if (!token) {
      // Send 401
      return res
        .status(401)
        .json({
          message: "User Not Authenticated. Login to view the resource.",
        });
    }
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
      console.log("PAYLOAD ----", payload);
      if (err) {
        return res.status(403).json({
          message: "Token Expired, Refresh the Token or login again to access the resource",
        });
      }
      const { user } = payload;
      req.user = user;
      next();
      // set user - req.user = payload.user
    });
  },
  genAccessTokenFromRefreshToken: async (req, res, next) => {
    try {
      const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = process.env;
      console.log('=============')
      console.log('Cookies', req.cookies)
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({
          message: "Token Expired Login again to access the resource",
        });
      }

      // Refresh Token Check
      const token = await Token.findOne({ token: refreshToken });
      if (!token) {
        return res.status(401).json({
          status: false,
          message: "Token Expired Login again to access the resource",
        });
      }
      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, payload) => {
        if (err)
          return res.status(401).json({
            status: false,
            message: "Invalid Token, Please login again to access the resource",
          });
        const { user } = payload;
        req.user = user;
        const accessToken = jwt.sign({ user }, ACCESS_TOKEN_SECRET, {
          subject: SUBJECT,
          issuer: ISSUER,
          expiresIn: "15m",
        });
        res.status(201).json({
          accessToken: accessToken,
          status: true,
          message: "Access Token Refreshed",
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  invalidateUserToken: async (req, res, next) => {
    try {
      const {refreshToken} = req.body;
      const { user_id } = req.user;
      res.clearCookie('_rt')
      await Token.deleteMany({ user_id });
      req.user = null;
      res.status(201).json({ message: "User logged out successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },
};
