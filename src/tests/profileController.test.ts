import { Request, Response } from "express";
import {
  getProfile,
  updateProfile,
  submitProfile,
} from "../controllers/profileController";
import Profile from "../models/profile";
import User from "../models/user";
import calculateCompletionPercentage from "../utils/calculateCompletion";
import { generatePDF } from "../utils/pdfGenerator";
import { sendEmailWithPDF } from "../utils/mail";

jest.mock("../models/profile");
jest.mock("../models/user");
jest.mock("../utils/calculateCompletion");
jest.mock("../utils/pdfGenerator");
jest.mock("../utils/mail");

describe("ProfileController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("updateProfile", () => {
    it("should update the profile successfully", async () => {
      req = {
        body: {
          userId: "user123",
          name: "John Doe",
          address: "123 Main St",
          phoneNumber: "123456789",
        },
      } as Request;

      const existingProfile = {
        userId: "user123",
        name: "Old Name",
        address: "Old Address",
        phoneNumber: "Old Number",
        profileCompletion: 50,
        save: jest.fn().mockResolvedValue(true),
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);
      (calculateCompletionPercentage as jest.Mock).mockReturnValue(75);

      await updateProfile(req as Request, res as Response);

      expect(existingProfile.name).toBe("John Doe");
      expect(existingProfile.address).toBe("123 Main St");
      expect(existingProfile.phoneNumber).toBe("123456789");
      expect(existingProfile.profileCompletion).toBe(75);
      expect(existingProfile.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(existingProfile);
    });

    it("should return 400 if profile is already 100% complete", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      const existingProfile = {
        userId: "user123",
        profileCompletion: 100,
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);

      await updateProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile is already complete and cannot be edited.",
      });
    });

    it("should return 400 if profile is already submitted", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      const existingProfile = {
        userId: "user123",
        submitted: true,
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);

      await updateProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile is already submitted and cannot be edited.",
      });
    });
  });

  describe("submitProfile", () => {
    it("should submit the profile successfully and send an email", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      const mockUser = { email: "user@example.com" };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const existingProfile = {
        userId: "user123",
        submitted: false,
        profileCompletion: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);
      (generatePDF as jest.Mock).mockResolvedValue(Buffer.from("PDF content"));
      (sendEmailWithPDF as jest.Mock).mockResolvedValue(true);

      await submitProfile(req as Request, res as Response);

      expect(existingProfile.submitted).toBe(true);
      expect(existingProfile.save).toHaveBeenCalled();
      expect(sendEmailWithPDF).toHaveBeenCalledWith(
        "user@example.com",
        expect.any(Buffer)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile submitted successfully and PDF emailed.",
      });
    });

    it("should return 404 if user is not found", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      (User.findById as jest.Mock).mockResolvedValue(null);

      await submitProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    it("should return 404 if profile is not found", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      (User.findById as jest.Mock).mockResolvedValue({
        email: "user@example.com",
      });
      (Profile.findOne as jest.Mock).mockResolvedValue(null);

      await submitProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Profile not found" });
    });

    it("should return 400 if profile is not 100% complete", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      const mockUser = { email: "user@example.com" };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const existingProfile = {
        userId: "user123",
        submitted: false,
        profileCompletion: 50,
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);

      await submitProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Profile is not 100% complete. Please complete the profile before submitting.",
      });
    });

    it("should return 400 if profile is already submitted", async () => {
      req = {
        body: {
          userId: "user123",
        },
      } as Request;

      const mockUser = { email: "user@example.com" };
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const existingProfile = {
        userId: "user123",
        submitted: true,
      };

      (Profile.findOne as jest.Mock).mockResolvedValue(existingProfile);

      await submitProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile has already been submitted.",
      });
    });
  });
});
