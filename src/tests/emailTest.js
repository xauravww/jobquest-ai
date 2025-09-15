import 'dotenv/config';
import { sendEmail } from '../lib/email.ts';

async function testEmailSending() {
  try {
    console.log('Testing email sending...');

    await sendEmail({
      to: 'sauravmaheshwari8@gmail.com',
      subject: 'Test Email from JobQuest AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email to verify that your nodemailer configuration is working correctly.</p>
          <p>If you received this email, your email setup is functioning properly!</p>
          <p>Best regards,<br>The JobQuest AI Team</p>
        </div>
      `,
      text: 'This is a test email to verify that your nodemailer configuration is working correctly. If you received this email, your email setup is functioning properly!',
    });

    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error.message);
  }
}

// Run the test
testEmailSending();
