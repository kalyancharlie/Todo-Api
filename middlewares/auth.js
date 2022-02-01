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

const isTokenValid = async (token, SECRET) => {
  try {
    return jwt.verify(token, SECRET, (err, payload) => {
      return err ? false : true
    })
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
      console.log('AUTH CREDENTIAL STATUS')
      console.log(user, userAuthStatus)
      if (!userAuthStatus.status) {
        return res.status(userAuthStatus.statusCode).json({...userAuthStatus, userId: user?._id, name: user?.name, email: user?.email});
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
        sameSite: 'None'
      })
      res.cookie('_uid', user._id, {
        httpOnly: true,
        secure: true,
        expire: Date.now() + (86400 * 15),
        path: '/users/logout' || '/',
        sameSite: 'None'
      })
      // Send the Tokens
      return res
        .status(201)
        .json({ ...userAuthStatus, accessToken, refreshToken, userId: user?._id, name: user?.name, email: user?.email });
    } catch (error) {
      console.log('auth error')
      console.log(error)
      res.status(500).json({})
    }
  },
  verifyAccessToken: async (req, res, next) => {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env;
      const token = req.headers["x-api-key"];
      console.log("X-API-KEY")
      console.log(token)
      if (!token) {
        return res.status(400).json({status: false, message: 'Token Must be provided'})
      }
      const tokenStatus = await isTokenValid(token, ACCESS_TOKEN_SECRET)
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
      console.log("PAYLOAD");
      console.log(payload)
      if (err) {
        return res.status(403).json({
          message: "Token Expired, Refresh the Token or login again to access the resource",
        });
      }
      const { user } = payload;
      console.log('NEW USER SET')
      console.log(user)
      req.user = user;
      console.log("Auth Guard Passed")
      return next();
      // set user - req.user = payload.user
    });
  },
  genAccessTokenFromRefreshToken: async (req, res, next) => {
    try {
      const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = process.env;
      console.log('Cookies')
      console.log(req.cookies)
      const refreshToken = req.cookies._rt
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
        if (err) {
        console.log('ACCESS TOKEN ERROR')
        console.log(err)
          return res.status(401).json({
            status: false,
            message: "Invalid Token, Please login again to access the resource",
          });
        }
        const { user } = payload;
        req.user = user;
        const accessToken = jwt.sign({ user }, ACCESS_TOKEN_SECRET, {
          subject: SUBJECT,
          issuer: ISSUER,
          expiresIn: "20s",
        });
        console.log('TOKEN RENEWED')
        console.log(accessToken,)
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
      const user_id = req.cookies['_uid']
      console.log('userid from token', user_id)
      res.clearCookie('_rt', {path: '/users/refresh-token'})
      res.clearCookie('_uid', {path: '/users/logout'})
      await Token.deleteMany({ user_id });
      res.status(201).json({ status: true, message: "User logged out successfully!" });
    } catch (error) {
      console.log('Invalidation Error')
      console.log(error?.message)
      res.status(500).json({ status: false, message: "Internal Server Error", ...error });
    }
  },
};
