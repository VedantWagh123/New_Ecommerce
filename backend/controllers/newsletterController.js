import newsletterModel from "../models/newsletterModel.js";
import couponModel from "../models/couponModel.js";
import sendEmail from "../utils/sendEmail.js";

const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !email.includes('@')) {
            return res.json({ success: false, message: "Invalid email format" });
        }

        const existingSubscriber = await newsletterModel.findOne({ email: email.toLowerCase() });
        if (existingSubscriber) {
            return res.json({ success: false, message: "You are already subscribed!" });
        }

        // Generate unique coupon code
        const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const couponCode = `WELCOME20-${uniqueSuffix}`;

        // Save Coupon
        const newCoupon = new couponModel({
            code: couponCode,
            type: 'percentage',
            value: 20,
            minCartValue: 0,
            isOneTime: true,
            isActive: true,
            linkedEmail: email.toLowerCase()
        });
        await newCoupon.save();

        // Save Subscriber
        const newSubscriber = new newsletterModel({
            email: email.toLowerCase(),
            couponCode: couponCode
        });
        await newSubscriber.save();

        // Send Email via Resend
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center;">Welcome to Veloura! ✨</h1>
                <p style="color: #555; font-size: 16px;">Thank you for subscribing to our newsletter. You'll now be the first to know about new arrivals and exclusive offers.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase;">Your 20% Off Discount Code:</p>
                    <h2 style="margin: 10px 0 0 0; color: #000; letter-spacing: 2px;">${couponCode}</h2>
                </div>
                
                <p style="color: #777; font-size: 13px; text-align: center;">*This code is valid for one-time use only on your first order.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://veloura.com" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">SHOP NOW</a>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: "Welcome to Veloura! Here's your 20% OFF code 🎉",
            html: emailHtml
        });

        res.json({ success: true, message: "Subscribed! Check your email for the discount code." });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { subscribeNewsletter };
