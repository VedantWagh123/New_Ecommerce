import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async () => {
    try {
        console.log("Using Email:", process.env.SMTP_EMAIL);
        console.log("Using Password:", process.env.SMTP_PASSWORD ? "******" : "MISSING");
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // sending to itself for testing
            subject: 'Test Email from Node',
            text: 'This is a test email to verify SMTP configuration.'
        };

        console.log("Attempting to send email...");
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error.message);
        console.error(error);
    }
};

sendEmail();
