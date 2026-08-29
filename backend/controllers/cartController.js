import userModel from "../models/userModel.js"
import orderModel from "../models/orderModel.js"


// add products to user cart
const addToCart = async (req,res) => {
    try {
        
        const { userId, itemId, size } = req.body

        await userModel.findByIdAndUpdate(userId, {
            $inc: { [`cartData.${itemId}.${size}`]: 1 },
            $set: { cartUpdatedAt: Date.now(), abandonedMailSent: false }
        })

        res.json({ success: true, message: "Added To Cart" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// update user cart
const updateCart = async (req,res) => {
    try {
        
        const { userId ,itemId, size, quantity } = req.body

        await userModel.findByIdAndUpdate(userId, { 
            $set: { 
                [`cartData.${itemId}.${size}`]: quantity,
                cartUpdatedAt: Date.now(), 
                abandonedMailSent: false 
            }
        })
        res.json({ success: true, message: "Cart Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// get user cart data
const getUserCart = async (req,res) => {

    try {
        
        const { userId } = req.body
        
        const userData = await userModel.findById(userId)
        if (!userData) {
            return res.json({ success: false, cartData: {} })
        }

        let cartData = (await userData.cartData) || {};
        const pastOrder = await orderModel.findOne({ userId, couponCode: 'BUNDLE20' });

        res.json({ success: true, cartData, karmaScore: userData.karmaScore ?? 100, hasUsedBundle: !!pastOrder })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export { addToCart, updateCart, getUserCart }