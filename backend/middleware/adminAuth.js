import jwt from 'jsonwebtoken'

const adminAuth = async (req,res,next) => {
    try {
        let token = req.headers.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token || token === 'null' || token === 'undefined') {
            return res.json({success:false,message:"Not Authorized Login Again"})
        }

        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        
        // Handle legacy string token (Super Admin) OR new object token (Sub-Admins/Super Admin)
        if (typeof token_decode === 'string' && token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            req.adminRole = 'super_admin';
        } else if (token_decode && token_decode.role) {
            req.adminId = token_decode.id;
            req.adminRole = token_decode.role;
        } else {
            return res.json({success:false,message:"Not Authorized Login Again"})
        }

        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default adminAuth