import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { getIO } from "../config/socket.js";


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id);
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for OTP Verification
const verifyOtp = async (req, res) => {
    try {
        const { tempToken, otp } = req.body;
        if (!tempToken || !otp) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        // Verify temporary token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.json({ success: false, message: "Session expired. Please login again." });
        }

        if (!decoded.isOtpPending || !decoded.tempUserId) {
            return res.json({ success: false, message: "Invalid temporary session" });
        }

        const user = await userModel.findById(decoded.tempUserId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Validate Expiration
        if (Date.now() > user.otpExpiresAt) {
            return res.json({ success: false, message: "This OTP has expired. Please request a new OTP." });
        }

        // Check attempts
        if (user.otpAttempts >= 5) {
            user.otpHash = ''; // Invalidate
            await user.save();
            return res.json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
        }

        // Validate OTP
        const isMatch = await bcrypt.compare(otp, user.otpHash);
        if (isMatch) {
            // Success: clear OTP state and issue final auth token
            user.otpHash = '';
            user.otpExpiresAt = 0;
            user.otpAttempts = 0;
            await user.save();

            const token = createToken(user._id);
            return res.json({ success: true, message: "Email verified successfully.", token });
        } else {
            // Failed: increment attempts
            user.otpAttempts += 1;
            await user.save();
            return res.json({ success: false, message: "Incorrect OTP. Please check the code and try again." });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Route for Resend OTP
const resendOtp = async (req, res) => {
    try {
        const { tempToken } = req.body;
        if (!tempToken) {
            return res.json({ success: false, message: "Missing temporary session" });
        }

        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch (e) {
            return res.json({ success: false, message: "Session expired. Please login again." });
        }

        const user = await userModel.findById(decoded.tempUserId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Cooldown check (60 seconds)
        const timeSinceLastOtp = Date.now() - user.otpLastSentAt;
        if (timeSinceLastOtp < 60000) {
            return res.json({ success: false, message: `Please wait ${Math.ceil((60000 - timeSinceLastOtp)/1000)}s before requesting a new OTP.` });
        }

        // Generate New OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        
        user.otpHash = otpHash;
        user.otpExpiresAt = Date.now() + 3 * 60 * 1000;
        user.otpAttempts = 0;
        user.otpLastSentAt = Date.now();
        await user.save();

        const message = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 0; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #111827 0%, #374151 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Login Verification (Resend)</h1>
                </div>
                <div style="padding: 40px 30px; text-align: left;">
                    <p style="color: #4b5563; font-size: 16px; margin-top: 0;">Hello,</p>
                    <p style="color: #4b5563; font-size: 16px;">Here is your new 6-digit verification code to complete your login securely.</p>
                    
                    <div style="text-align: center; margin: 30px 0; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 4px;">${otp}</span>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin-bottom: 5px;">This code expires in 3 minutes.</p>
                </div>
            </div>
        </div>`;

        if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
            await sendEmail({ to: user.email, subject: 'Your New Login Verification Code', html: message });
        } else {
            console.log(`[DEV ONLY] NEW OTP for ${user.email} is: ${otp}`);
        }

        res.json({ success: true, message: "A new OTP has been sent." });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        res.json({ success: true, message: "Account created successfully. Please login." })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        const {email,password} = req.body

        // Super Admin Check
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            // Include role in response for frontend routing
            const token = jwt.sign({ role: 'super_admin' }, process.env.JWT_SECRET);
            return res.json({success:true,token, role: 'super_admin'})
        } 
        
        // Sub-Admin Check from DB
        const user = await userModel.findOne({ email });
        // Reject regular users and sellers from logging into admin panel
        if (!user || user.role === 'user' || user.role === 'seller') {
            return res.json({success:false,message:"Invalid admin credentials"})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
            return res.json({ success: true, token, role: user.role })
        } else {
            return res.json({success:false,message:"Invalid admin credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// Admin function: Get all sellers (pending & approved)
const getSellers = async (req, res) => {
    try {
        const sellers = await userModel.find({ 
            $or: [{ isSeller: true }, { role: 'seller' }] 
        }).select('-password').sort({ _id: -1 });
        res.json({ success: true, sellers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Admin function: Approve seller account
const approveSeller = async (req, res) => {
    try {
        const { sellerId } = req.body;
        const seller = await userModel.findByIdAndUpdate(sellerId, { sellerStatus: 'approved', sellerRejectionReason: '' }, { new: true });
        if (!seller) {
            return res.json({ success: false, message: "Seller not found" });
        }
        res.json({ success: true, message: `Seller "${seller.storeName || seller.name}" approved successfully!`, seller });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

import productModel from "../models/productModel.js";

// Admin function: Reject seller account
const rejectSeller = async (req, res) => {
    try {
        const { sellerId, reason } = req.body;
        const seller = await userModel.findByIdAndUpdate(sellerId, { 
            sellerStatus: 'rejected', 
            sellerRejectionReason: reason || 'Application did not meet requirements' 
        }, { new: true });

        if (!seller) {
            return res.json({ success: false, message: "Seller not found" });
        }
        res.json({ success: true, message: `Seller "${seller.storeName || seller.name}" rejected.`, seller });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Admin function: Delete seller account permanently
const deleteSeller = async (req, res) => {
    try {
        const { sellerId } = req.body;
        const seller = await userModel.findByIdAndDelete(sellerId);
        if (!seller) {
            return res.json({ success: false, message: "Seller not found" });
        }
        // Delete seller's products
        await productModel.deleteMany({ sellerId });

        res.json({ success: true, message: `Seller "${seller.storeName || seller.name}" removed successfully!` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// User function: Apply for Delivery Partner
const applyDeliveryPartner = async (req, res) => {
    try {
        const { userId, vehicleDetails, drivingLicense, serviceCity } = req.body;
        const user = await userModel.findByIdAndUpdate(userId, { 
            deliveryStatus: 'pending',
            deliveryVehicle: vehicleDetails,
            drivingLicense,
            serviceCity
        }, { new: true });
        
        if (!user) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, message: "Application submitted successfully! Admin will review your details." });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Admin function: Get all Delivery Partners
const getDeliveryPartners = async (req, res) => {
    try {
        const partners = await userModel.find({ 
            $or: [{ isDeliveryPartner: true }, { role: 'delivery' }, { deliveryStatus: { $in: ['pending', 'approved', 'rejected'] } }] 
        }).select('-password').sort({ _id: -1 });
        res.json({ success: true, partners });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Admin function: Approve Delivery Partner
const approveDeliveryPartner = async (req, res) => {
    try {
        const { partnerId } = req.body;
        const partner = await userModel.findByIdAndUpdate(partnerId, { 
            deliveryStatus: 'approved', 
            isDeliveryPartner: true 
        }, { new: true });
        if (!partner) return res.json({ success: false, message: "Partner not found" });
        res.json({ success: true, message: `Delivery Partner "${partner.name}" approved successfully!`, partner });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Admin function: Reject Delivery Partner
const rejectDeliveryPartner = async (req, res) => {
    try {
        const { partnerId } = req.body;
        const partner = await userModel.findByIdAndUpdate(partnerId, { 
            deliveryStatus: 'rejected',
            isDeliveryPartner: false
        }, { new: true });
        if (!partner) return res.json({ success: false, message: "Partner not found" });
        res.json({ success: true, message: `Delivery Partner "${partner.name}" rejected.`, partner });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Super Admin function: Get all Sub-Admins
const getSubAdmins = async (req, res) => {
    try {
        const subAdmins = await userModel.find({ role: { $in: ['support', 'marketing'] } }).select('-password');
        res.json({ success: true, subAdmins });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Super Admin function: Add a Sub-Admin
const addSubAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!['support', 'marketing'].includes(role)) {
            return res.json({ success: false, message: "Invalid role. Must be 'support' or 'marketing'" });
        }
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists with this email" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const subAdmin = new userModel({ name, email, password: hashedPassword, role });
        await subAdmin.save();
        
        res.json({ success: true, message: `Sub-admin (${role}) added successfully!` });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Super Admin function: Delete a Sub-Admin
const deleteSubAdmin = async (req, res) => {
    try {
        const { adminId } = req.body;
        await userModel.findByIdAndDelete(adminId);
        res.json({ success: true, message: "Sub-admin deleted successfully!" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId, firstName, lastName, phone, address, city, state, zipcode, country } = req.body;
        
        let updateData = {
            name: `${firstName} ${lastName}`.trim(),
            phone,
            addresses: [{ address, city, state, zipcode, country }]
        };

        const imageFile = req.file;
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.avatar = imageUpload.secure_url;
        }

        const user = await userModel.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User not found with this email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP and save to db (adding expiration of 15 mins)
        user.resetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
        await user.save();
        
        console.log("-------------------------------------------------");
        console.log(`[DEV ONLY] PASSWORD RESET OTP for ${user.email} is: ${otp}`);
        console.log("-------------------------------------------------");

        const message = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 0; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <div style="background: linear-gradient(135deg, #111827 0%, #374151 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">Password Reset</h1>
                    </div>
                    <div style="padding: 40px 30px; text-align: left;">
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0;">Hello,</p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your account. Please use the following OTP to proceed:</p>
                        
                        <div style="text-align: center; margin: 35px 0; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                            <span style="font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 4px;">${otp}</span>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">This code will expire in <span style="font-weight: 600; color: #374151;">15 minutes</span> for your security.</p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
                        <p style="color: #9ca3af; font-size: 13px; margin-bottom: 0;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Veloura. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;

        // Send email only if SMTP is configured, otherwise just log it
        if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
            await sendEmail({
                to: user.email,
                subject: 'Secure Password Reset Link - Veloura',
                html: message
            });
        } else {
            console.log("No SMTP configured. Check terminal for reset link.");
        }

        res.json({ success: true, message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Verify Reset OTP
const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.json({ success: false, message: "Email and OTP are required" });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await userModel.findOne({
            email,
            resetToken: hashedOtp,
            resetTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Reset Password via OTP
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Hash the OTP to compare with DB
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await userModel.findOne({
            email,
            resetToken: hashedOtp,
            resetTokenExpire: { $gt: Date.now() } // Ensure token is not expired
        });

        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Clear reset token fields
        user.resetToken = undefined;
        user.resetTokenExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully. You can now login.' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
// Toggle Delivery Partner Online Status
const toggleDeliveryOnline = async (req, res) => {
    try {
        const { userId } = req.body;
        const { isDeliveryOnline } = req.body;
        
        const user = await userModel.findById(userId);
        if (!user || !user.isDeliveryPartner) {
            return res.json({ success: false, message: 'User not authorized' });
        }
        
        user.isDeliveryOnline = isDeliveryOnline;
        await user.save();
        
        getIO().emit('wishmaster-updated');
        
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { loginUser, registerUser, adminLogin, getSellers, approveSeller, rejectSeller, deleteSeller, getSubAdmins, addSubAdmin, deleteSubAdmin, getUserProfile, updateUserProfile, forgotPassword, verifyResetOtp, resetPassword, verifyOtp, resendOtp, applyDeliveryPartner, getDeliveryPartners, approveDeliveryPartner, rejectDeliveryPartner, toggleDeliveryOnline }