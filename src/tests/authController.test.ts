import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import { sendOTP } from "../utils/mail";
import {
  register,
  verifyOTP,
  login,
  refresh,
} from "../controllers/authController";

jest.mock("../models/user");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../utils/jwt");
jest.mock("../utils/mail");

describe("Auth Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  describe("register", () => {
    it("should register a new user and send OTP", async () => {
      req = {
        body: { email: "test@example.com", password: "password123" },
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      await register(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(sendOTP).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "OTP sent to email" });
    });

    it("should return 400 if the user already exists", async () => {
      req = {
        body: { email: "test@example.com", password: "password123" },
      };

      (User.findOne as jest.Mock).mockResolvedValue({});

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });
  });

  describe("verifyOTP", () => {
    it("should verify OTP and mark user as verified", async () => {
      req = {
        body: { email: "test@example.com", otp: "123456" },
      };

      const mockUser = {
        otp: "123456",
        otpExpires: new Date(Date.now() + 5 * 60 * 1000),
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await verifyOTP(req as Request, res as Response);

      expect(mockUser.otp).toBe("");
      expect(mockUser.otpExpires).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified successfully",
      });
    });

    it("should return 400 if OTP is invalid or expired", async () => {
      req = {
        body: { email: "test@example.com", otp: "123456" },
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await verifyOTP(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid OTP" });
    });
  });

  describe("login", () => {
    it("should login the user and return token", async () => {
      req = {
        body: { email: "test@example.com", password: "password123" },
      };

      const mockUser = {
        id: "user123",
        password: "hashedPassword",
        isVerified: true,
        save: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateToken as jest.Mock).mockReturnValue("jwtToken");
      (generateRefreshToken as jest.Mock).mockReturnValue("refreshToken");

      await login(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );
      expect(res.cookie).toHaveBeenCalledWith("jwt", "refreshToken", {
        httpOnly: true,
        secure: true,
      });
      expect(res.json).toHaveBeenCalledWith({ token: "jwtToken" });
    });

    it("should return 400 if credentials are invalid", async () => {
      req = {
        body: { email: "test@example.com", password: "password123" },
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("should return 400 if email is not verified", async () => {
      req = {
        body: { email: "test@example.com", password: "password123" },
      };

      const mockUser = {
        password: "hashedPassword",
        isVerified: false,
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Email not verified" });
    });
  });

  describe("refresh", () => {
    it("should refresh the token if valid refresh token is provided", async () => {
      req = { cookies: { token: "validRefreshToken" } };

      const mockUser = { id: "user123" };
      (jwt.verify as jest.Mock).mockReturnValue({ id: "user123" });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue("newToken");

      await refresh(req as Request, res as Response);

      expect(jwt.verify).toHaveBeenCalledWith(
        "validRefreshToken",
        expect.any(String)
      );
      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(res.json).toHaveBeenCalledWith({ token: "newToken" });
    });

    it("should return 403 if user is not found", async () => {
      req = { cookies: { token: "validRefreshToken" } };

      (jwt.verify as jest.Mock).mockReturnValue({ id: "user123" });
      (User.findById as jest.Mock).mockResolvedValue(null);

      await refresh(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid user" });
    });
  });
});
