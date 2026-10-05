import nodemailer from "nodemailer";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../../core/logger/logger";

const transporter = nodemailer.createTransport({
  host: env_Constant.SMTP_HOST,
  port: env_Constant.SMTP_PORT,
  secure: env_Constant.SMTP_PORT === 465,
  auth: {
    user: env_Constant.SMTP_USER,
    pass: env_Constant.SMTP_PASS,
  },
});

export const sendParticipantWelcomeEmail = async (
  email: string,
  name: string,
  participantId: string,
): Promise<void> => {
  try {
    if (!env_Constant.SMTP_USER || !env_Constant.SMTP_PASS) {
      logger.info(
        `Email skipped (no SMTP credentials configured). Target: ${email}, ID: ${participantId}`,
      );
      return;
    }

    await transporter.sendMail({
      from: env_Constant.EMAIL_FROM,
      to: email,
      subject: "Welcome to GDG Ranchi DevFest 2026 - Your Participant ID",
      html: `
        <h2>Welcome to GDG Ranchi DevFest 2026, ${name}!</h2>
        <p>Your participant account has been registered successfully.</p>
        <p><strong>Your Unique Participant ID:</strong> <span style="font-size: 1.2em; color: #1a73e8;">${participantId}</span></p>
        <p>Use your email and password to log in, register for active games, and compete on the event leaderboard!</p>
        <br/>
        <p>Best regards,<br/>GDG Ranchi Organizing Team</p>
      `,
    });
    logger.info(`Welcome email sent successfully to ${email}`);
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
  }
};
