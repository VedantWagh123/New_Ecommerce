const roleAuth = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // Req.adminRole is populated by adminAuth middleware
            if (!req.adminRole) {
                return res.json({ success: false, message: "Not Authorized. Role not found." });
            }

            if (!allowedRoles.includes(req.adminRole)) {
                return res.json({ 
                    success: false, 
                    message: `Access Denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.adminRole}` 
                });
            }

            next();
        } catch (error) {
            console.log(error);
            res.json({ success: false, message: error.message });
        }
    }
}

export default roleAuth;
