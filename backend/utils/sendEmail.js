import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
// Make sure to add RESEND_API_KEY to your .env file and Render dashboard
let resend = null;

const getResendClient = () => {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const sendEmail = async (options) => {
    try {
        const resendClient = getResendClient();
        
        if (!resendClient) {
            console.error("RESEND_API_KEY is not configured.");
            return false;
        }

        const { data, error } = await resendClient.emails.send({
            // For free Resend tier without a verified domain, you must use onboarding@resend.dev
            // Once you verify a domain, you can change this to something like 'support@yourdomain.com'
            from: 'Veloura <onboarding@resend.dev>',
            to: options.to,
            subject: options.subject,
            html: options.html
        });

        if (error) {
            console.error("Resend API Error:", error);
            return false;
        }

        console.log("Email sent successfully via Resend. ID:", data.id);
        return true;
    } catch (error) {
        console.error("Error sending email via Resend:", error);
        return false;
    }
};

export default sendEmail;
