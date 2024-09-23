import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import { sendOTP } from "../utils/mail";

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // if (email || password) {
  //   return res.status(400).json({ message: "Invalid input" });
  // }
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = new User({
    email,
    password: hashedPassword,
    otp,
    otpExpires: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 5 minutes
  });

  await user.save();
  await sendOTP(email, otp);

  res.status(201).json({ message: "OTP sent to email" });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.isVerified = true;
  user.otp = "";
  user.otpExpires = new Date();
  await user.save();

  res.json({ message: "Email verified successfully" });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(400).json({ message: "Email not verified" });
  }

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("jwt", refreshToken, { httpOnly: true, secure: true });
  res.json({ token });
};

export const refresh = async (req: Request, res: Response) => {
  const { token } = req.cookies;
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "");

  if (!decoded) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById((<any>decoded).id);
  if (!user) {
    return res.status(403).json({ message: "Invalid user" });
  }

  const newToken = generateToken(user.id);
  res.json({ token: newToken });
};
