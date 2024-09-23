import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: false },
});

const workHistorySchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  companyName: { type: String, required: true },
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
});

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, default: null },
  address: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  education: [educationSchema],
  workHistory: [workHistorySchema],
  skills: { type: [String], default: [] },
  profileCompletion: { type: Number, default: 0 },
  submitted: { type: Boolean, default: false },
});

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
