import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import startCartRecoveryCron from './cron/cartRecovery.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import reviewRouter from './routes/reviewRoute.js'
import sellerRouter from './routes/sellerRoute.js'
import aiRouter from './routes/aiRoute.js'
import trendingRouter from './routes/trendingRoute.js'
import bankOfferRouter from './routes/bankOfferRoute.js'
import subscriptionRouter from './routes/subscriptionRoute.js'
import flashSaleRouter from './routes/flashSaleRoute.js'
import couponRouter from './routes/couponRoute.js'
import financeRouter from './routes/financeRoute.js'
import storyRouter from './routes/storyRoute.js'
import discoverRouter from './routes/discoverRoute.js'
import settingsRouter from './routes/settingsRoute.js'
import newsletterRouter from './routes/newsletterRoute.js'
import deliveryRouter from './routes/deliveryRoute.js'
import notificationRouter from './routes/notificationRoute.js'
import { createServer } from 'http'
import { initSocket } from './config/socket.js'

// App Config
const app = express()
const server = createServer(app)
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// Start Background Services
startCartRecoveryCron()

// Initialize Socket.io
initSocket(server);

// middlewares
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors())

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/review',reviewRouter)
app.use('/api/seller',sellerRouter)
app.use('/api/ai',aiRouter)
app.use('/api/trending',trendingRouter)
app.use('/api/bank-offer',bankOfferRouter)
app.use('/api/subscription',subscriptionRouter)
app.use('/api/flash-sale',flashSaleRouter)
app.use('/api/coupon',couponRouter)
app.use('/api/finance',financeRouter)
app.use('/api/story',storyRouter)
app.use('/api/discover',discoverRouter)
app.use('/api/settings',settingsRouter)
app.use('/api/newsletter',newsletterRouter)
app.use('/api/delivery',deliveryRouter)
app.use('/api/notification',notificationRouter)


app.get('/',(req,res)=>{
    res.send("API Working")
})

server.listen(port, ()=> console.log('Server started on PORT : '+ port))
// Refreshed server instance