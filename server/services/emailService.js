// services/emailService.js
import nodemailer from "nodemailer";

export async function sendReportEmail({ to, fullName, filePath }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AI-AUDIT" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `Your AI-AUDIT Report — ${fullName}`,
    html: `
      <p>Hi <strong>${fullName}</strong>,</p>
      <p>Your personalized <strong>AI-AUDIT Report</strong> is attached below as a PDF.</p>
      <p>Best regards,<br/>The A2X CORP Team</p>
    `,
    attachments: [
      {
        filename: filePath.split("/").pop(),
        path: filePath,
        contentType: "application/pdf",
      },
    ],
  });
}
