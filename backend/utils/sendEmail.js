import nodemailer from 'nodemailer';

// Create transporter once and reuse it for faster processing
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    return transporter;
};

const sendEmail = async (options) => {
    try {
        const mailTransporter = getTransporter();

        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: options.to,
            subject: options.subject,
            html: options.html
        };

        const info = await mailTransporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

export default sendEmail;
