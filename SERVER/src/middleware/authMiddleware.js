import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const extractToken = (req, cookieName) => {
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1].trim();
  }
  return null;
};

export const AuthProtect = async (req, res, next) => {
  try {
    const token = extractToken(req, "Oreo");
    if (!token) {
      const error = new Error("Session Expired");
      error.statusCode = 401;
      return next(error);
    }

    const secret = process.env.JWT_SECRET?.trim();
    const decode = await jwt.verify(token, secret);
    if (!decode || !decode.id) {
      const error = new Error("Invalid Token");
      error.statusCode = 401;
      return next(error);
    }

    const verifiedUser = await User.findById(decode.id);
    if (!verifiedUser) {
      const error = new Error("Session Expired");
      error.statusCode = 401;
      return next(error);
    }

    req.user = verifiedUser;
    next();
  } catch (error) {
    console.error("AuthProtect Middleware Error:", error.message);
    const err = new Error(error.message || "Unauthorized");
    err.statusCode = 401;
    next(err);
  }
};

export const OTPAuthProtect = async (req, res, next) => {
  try {
    const token = extractToken(req, "kitkat");
    if (!token) {
      const error = new Error("Session Expired");
      error.statusCode = 401;
      return next(error);
    }

    const secret = process.env.JWT_SECRET?.trim();
    const decode = await jwt.verify(token, secret);
    if (!decode || !decode.id) {
      const error = new Error("Session Expired");
      error.statusCode = 401;
      return next(error);
    }

    const verifiedUser = await User.findById(decode.id);
    if (!verifiedUser) {
      const error = new Error("Session Expired");
      error.statusCode = 401;
      return next(error);
    }

    req.user = verifiedUser;
    next();
  } catch (error) {
    console.error("OTPAuthProtect Middleware Error:", error.message);
    const err = new Error(error.message || "Unauthorized");
    err.statusCode = 401;
    next(err);
  }
};
