import cron from 'node-cron';
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';
import sendEmail from '../utils/sendEmail.js';

// Run every 15 minutes to accurately catch 30-minute abandoned carts
const startCartRecoveryCron = () => {
    cron.schedule('*/15 * * * *', async () => {
        try {
            console.log('[CRON] Starting Abandoned Cart Recovery check...');
            const thresholdTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

            // Find users who updated cart > 30 mins ago and haven't been emailed yet
            const abandonedUsers = await userModel.find({
                cartUpdatedAt: { $lt: thresholdTime },
                abandonedMailSent: false,
                cartData: { $ne: {} }
            });

            if (abandonedUsers.length === 0) {
                console.log('[CRON] No abandoned carts found.');
                return;
            }

            console.log(`[CRON] Found ${abandonedUsers.length} abandoned carts. Processing...`);

            for (const user of abandonedUsers) {
                // Check if cart is actually not empty (has quantities > 0)
                let isEmpty = true;
                let firstProductId = null;

                for (const itemId in user.cartData) {
                    for (const size in user.cartData[itemId]) {
                        if (user.cartData[itemId][size] > 0) {
                            isEmpty = false;
                            firstProductId = itemId;
                            break;
                        }
                    }
                    if (!isEmpty) break;
                }

                if (isEmpty) {
                    // Cart was cleared by setting qty to 0
                    user.abandonedMailSent = true;
                    await user.save();
                    continue;
                }

                // Fetch product details for the email (just the first item)
                const product = await productModel.findById(firstProductId);
                if (!product) continue;

                const checkoutUrl = 'http://localhost:5173/cart';

                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px 0; text-align: center;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="background-color: #000000; padding: 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Oops! You left something behind 🛒</h1>
                            </div>
                            
                            <div style="padding: 40px 30px; text-align: left;">
                                <p style="color: #4b5563; font-size: 16px;">Hi ${user.name.split(' ')[0] || 'there'},</p>
                                <p style="color: #4b5563; font-size: 16px;">We noticed you left some amazing items in your cart. They are selling out fast, so grab them before they're gone!</p>
                                
                                <div style="display: flex; align-items: center; gap: 15px; margin: 30px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 10px;">
                                    <img src="${product.image[0]}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                                    <div>
                                        <h4 style="margin: 0; color: #111827; font-size: 16px;">${product.name}</h4>
                                        <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">And other items in your cart...</p>
                                    </div>
                                </div>
                                
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px;">
                                    <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">
                                        🎁 Use code <b>COMEBACK10</b> for an extra 10% OFF at checkout!
                                    </p>
                                </div>

                                <div style="text-align: center;">
                                    <a href="${checkoutUrl}" style="background-color: #fb641b; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                                        Return to Checkout ➔
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
                    await sendEmail({
                        to: user.email,
                        subject: "Don't let your favorites sell out! 🛍️",
                        html: emailHtml
                    });
                } else {
                    console.log(`[CRON] SMTP not configured. Would have sent email to ${user.email}`);
                }

                user.abandonedMailSent = true;
                await user.save();
                console.log(`[CRON] Abandoned cart email processed for user: ${user.email}`);
            }

        } catch (error) {
            console.error('[CRON] Error in cart recovery job:', error);
        }
    });
    console.log('[CRON] Abandoned Cart Recovery Service initialized.');
};

export default startCartRecoveryCron;
