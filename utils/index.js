import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Db connection established");
  } catch (error) {
    console.log("DB error:" + error);
  }
};
export default dbConnection;

export const createJwt = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    secure: true,
    partitioned: true,
    // to prevent CSRF attack
    sameSite: "none",
    maxAge: 1 * 24 * 60 * 60 * 1000,
  });
};
