import nodemailer from 'nodemailer';

// Create transporter (configure based on your email service)
const createTransporter = () => {
  // For development, you can use a service like Gmail, SendGrid, etc.
  // For production, use environment variables
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    console.log('Creating transporter with host:', process.env.EMAIL_HOST, 'port:', process.env.EMAIL_PORT);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"JobQuest AI" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    console.log('Sending email to:', options.to, 'subject:', options.subject);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request - JobQuest AI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password for your JobQuest AI account.</p>
      <p>Please click the link below to reset your password:</p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 10 minutes for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>The JobQuest AI Team</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">
        If the button doesn't work, copy and paste this URL into your browser:<br>
        ${resetUrl}
      </p>
    </div>
  `;

  const text = `
    Password Reset Request - JobQuest AI

    Hello,

    You have requested to reset your password for your JobQuest AI account.

    Please visit the following link to reset your password:
    ${resetUrl}

    This link will expire in 10 minutes for security reasons.

    If you didn't request this password reset, please ignore this email.

    Best regards,
    The JobQuest AI Team
  `;

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};
