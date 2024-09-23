import { Request, Response } from "express";
import Profile from "../models/profile";
import User from "../models/user";
import calculateCompletionPercentage from "../utils/calculateCompletion";
import { generatePDF } from "../utils/pdfGenerator";
import { sendEmailWithPDF } from "../utils/mail";

// Get user profile
const getProfile = async (req: Request, res: Response) => {
  const userId = req.body; // Assuming JWT middleware adds user to req object
  const profile = await Profile.findOne({ userId });

  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.status(200).json(profile);
};

// Create or update profile information
const updateProfile = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  let profile = await Profile.findOne({ userId });
  // Check if profile is already 100% complete
  if (profile?.profileCompletion === 100) {
    return res
      .status(400)
      .json({ message: "Profile is already complete and cannot be edited." });
  }
  // Check if profile is already submitted
  if (profile?.submitted) {
    return res
      .status(400)
      .json({ message: "Profile is already submitted and cannot be edited." });
  }
  const { name, address, phoneNumber, education, workHistory, skills } =
    req.body;
  // if (!name || !address || !phoneNumber || !education || !workHistory) {
  //   return res.status(400).json({
  //     message: "All fields are required.",
  //     missingFields: {
  //       name: !name ? "Name is required" : undefined,
  //       address: !address ? "Address is required" : undefined,
  //       phoneNumber: !phoneNumber ? "Phone number is required" : undefined,
  //       education: !education ? "Education is required" : undefined,
  //       workHistory: !workHistory ? "Work history is required" : undefined,
  //     },
  //   });
  // }
  if (!profile) {
    profile = new Profile({ userId });
  }

  // Update profile fields
  if (name) profile.name = name;
  if (address) profile.address = address;
  if (phoneNumber) profile.phoneNumber = phoneNumber;
  if (education) profile.education = education;
  if (workHistory) profile.workHistory = workHistory;
  if (skills) profile.skills = skills;

  // Recalculate completion percentage
  profile.profileCompletion = calculateCompletionPercentage(profile);

  await profile.save();

  return res.status(200).json(profile);
};

// Submit the profile
const submitProfile = async (req: Request, res: Response) => {
  const userId = req.body.userId;

  // Ensure the user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Find an existing profile
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  // Check if profile has already been submitted
  if (profile.submitted) {
    return res
      .status(400)
      .json({ message: "Profile has already been submitted." });
  }

  // Ensure profile is 100% complete
  if (profile.profileCompletion < 100) {
    return res.status(400).json({
      message:
        "Profile is not 100% complete. Please complete the profile before submitting.",
    });
  }

  // Mark profile as submitted
  profile.submitted = true;
  await profile.save();
  // Generate a PDF with profile information
  const pdfBuffer = await generatePDF(profile);
  console.log(user.email);
  // Send email with the PDF attached
  await sendEmailWithPDF(user.email, pdfBuffer);
  return res
    .status(200)
    .json({ message: "Profile submitted successfully and PDF emailed." });
};

export { getProfile, updateProfile, submitProfile };
