import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com", // Outlook SMTP server
  port: 587, // SMTP port for TLS
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: "SSLv3", // Enable secure connection
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };
  return await transporter.sendMail(mailOptions);
};

export const sendEmailWithPDF = async (
  to: string,
  pdfBuffer: Buffer
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // sender address
      to: to, // recipient's email
      subject: "Your Profile PDF", // Subject line
      text: "Please find attached your profile PDF.", // Plain text body
      attachments: [
        {
          filename: "profile.pdf",
          content: pdfBuffer, // Buffer containing the PDF data
          contentType: "application/pdf",
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};
