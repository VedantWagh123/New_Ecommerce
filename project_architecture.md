# 🚀 Veloura Multi-Vendor E-Commerce: Full System Architecture & Workflow

Yeh document Veloura platform ke end-to-end architecture, technology stack, aur complex workflows ko detail mein explain karta hai. Yeh ek enterprise-grade multi-vendor platform hai, jisme Amazon ya Flipkart jaisi features hain.

---

## 🛠️ 1. Technology Stack (Kisme bani hai ye website?)

Website ko **MERN Stack** (MongoDB, Express.js, React.js, Node.js) aur modern tools ka use karke banaya gaya hai.

### Frontend Technologies:
- **React.js & Vite:** Saare panels (Frontend, Admin, Seller) Vite bundler ke sath React me bane hain. Vite fast compilation provide karta hai.
- **Tailwind CSS:** Modern, responsive, aur beautiful UI styling ke liye.
- **React Router DOM:** Pages ke beech navigate karne ke liye bina page reload kiye (Single Page Application).
- **Zustand / Context API:** Global state management ke liye (jaise Cart ka data har page par accessible rakhna).
- **Recharts:** Seller panel me advanced sales graphs dikhane ke liye.
- **Lucide React:** Modern aur crisp SVG icons ke liye.

### Backend Technologies:
- **Node.js & Express.js:** Server-side logic aur RESTful APIs handle karne ke liye.
- **MongoDB & Mongoose:** NoSQL database jo scalable data store karta hai.
- **JSON Web Tokens (JWT):** Secure user, admin, aur seller authentication ke liye.
- **Bcrypt:** Passwords ko database me securely hash (encrypt) karke save karne ke liye.
- **Multer & Cloudinary:** Images (products, store logos) ko upload aur cloud me store karne ke liye.
- **Stripe & Razorpay APIs:** Real-world online payment processing ke liye.

---

## 🏛️ 2. Core Architecture Overview (Website ka structure kya hai?)

Ye ek monolithic API backend aur 3 alag-alag frontend clients ka architecture hai. Teeno frontends ek hi central backend se baat karte hain.

### The 3 Panels (Frontends):
1. **Customer Frontend (`/frontend`):**
   - **Users:** Aam buyers jo shopping karne aate hain.
   - **Key Features:** Products browse karna, Cart manage karna, Coupons apply karna, Stripe/Razorpay/COD se payment karna, aur Order track karna.
   
2. **Seller Panel (`/seller`):**
   - **Users:** Third-party dukandaar ya vendors (e.g., clothing brands).
   - **Key Features:** Apna store manage karna, naye products add karna, inventory (stock) control karna, aaye hue orders ko pack/ship karna, aur apni kamayi (Revenue) ka graph dekhna.

3. **Admin Panel (`/admin`):**
   - **Users:** Website ka malik (Master Admin) aur uske employees (Sub-Admins).
   - **Key Features:** Sellers ko approve/reject karna, products ko quality check karke approve karna, global coupons banana, aur platform ki saari activity monitor karna.

---

## 🔄 3. Start-to-End Workflows (Kaam kaise hota hai?)

### Flow A: The Multi-Vendor Flow (Seller Registration to Product Live)
Amazon ki tarah, koi bhi aake direct product nahi bech sakta. Ek proper approval system hai.
1. **Seller Registration:** Ek naya banda seller panel pe jake account banata hai (Store name, Bank details etc. deta hai). Uski status **"Pending"** hoti hai.
2. **Admin Approval:** Admin panel me notification jata hai. Admin check karke us seller ko **"Approve"** karta hai. Ab seller apna dashboard access kar sakta hai.
3. **Product Addition:** Seller ek t-shirt add karta hai (images, price, sizes ke sath). Ye t-shirt turant live nahi hoti, iski status **"Pending Approval"** hoti hai.
4. **Quality Check:** Admin panel me product review ke liye aata hai. Admin check karta hai image theek hai ya nahi. Agar sahi hai to **"Approve"** karta hai.
5. **Live in Store:** Ab wo t-shirt Customer Frontend me search aur shop karne ke liye live ho jati hai.

### Flow B: Order & Payment Flow (Customer se Seller tak)
1. **Shopping:** Customer frontend me login karta hai aur alag-alag sellers ki items cart me dalta hai.
2. **Apply Coupon (Secure Engine):** Customer checkout pe ek coupon dalta hai (e.g., `WINTER50`). 
   - *Security Feature:* Frontend pehle API `/api/coupon/apply` ko bulata hai. Backend check karta hai ki kya cart total ₹2000 se upar hai? Agar haan, toh backend math karke exact discount return karta hai.
3. **Payment:** Customer Stripe ya COD select karke order place karta hai. Backend database me `orders` collection me ek record bana deta hai.
4. **Seller Fulfillment:** Us t-shirt wale seller ke dashboard me ek naya order popup hota hai. Status hota hai `"Packing"`. Seller jab order dispatch karta hai, to wo status ko `"Shipped"` me badal deta hai. Customer ko frontend me live tracking dikhti hai.
5. **Earnings & Payouts:** Jab order `"Delivered"` ho jata hai, tabhi wo paisa Seller ki "Available Earnings" me add hota hai (taaki return policies handle ho sakein). Fir seller payout (withdrawal) request karta hai, jo admin clear karta hai.

---

## 🔐 4. Enterprise Features in Detail

### Feature 1: Role-Based Access Control (RBAC)
Ek badi company me malik akela sab manage nahi karta. Wo employees hire karta hai.
- **Super Admin (Master):** Iske paas poori website ka access hota hai. Ye employees (Sub-admins) create kar sakta hai.
- **Support Admin (Employee):** Ise sirf Orders dekhne aur customer complaints handle karne ki permission hoti hai. Inke Admin Panel me "Sellers", "Coupons" ya "Finances" ka button hide ho jata hai. Agar ye manually URL likh ke backend ko request bhejte hain, to backend ka `roleAuth.js` middleware inhe `403 Forbidden` error deke block kar deta hai.
- **Marketing Admin (Employee):** Inka kaam sirf Flash Sales lagana aur Discount Coupons banana hai.

### Feature 2: Dynamic Rules-Based Coupon Engine
Ye ek bohot advance system hai jo bilkul Myntra ya Ajio jaisa kaam karta hai.
- **Example:** Admin ek coupon banata hai: *"Buy 2 Get 1 Free, sirf Women's Topwear par, agar minimum cart value ₹1500 ho."*
- **Execution:** Jab customer ye coupon lagata hai, toh Node.js server cart scan karta hai. Check karta hai ki kya cart me 3 items hain? Kya wo Women's category ki hain? Kya total 1500 se upar hai? Agar saari conditions match hoti hain, tabhi sabse saste item ka price minus karke final total UI pe update hota hai.
- **Order Tracking:** Kis order me kaunsa coupon laga hai, ye Database me save hota hai taaki marketing team baad me check kar sake ki kis coupon se kitni sales aayi.

### Feature 3: Graphical Analytics Dashboard (Seller)
Seller ko bore table nahi dikhti. Maine wahan **Recharts** ka use karke graphical UI banaya hai.
- **Revenue Area Chart:** Backend pichle orders ki dates check karke ek time-series array banata hai. Ye chart dikhata hai ki Monday ko kitni sales hui, Tuesday ko kitni hui. Ek gradient growth line dikhti hai.
- **Status Pie Chart:** Kitne orders packing me hain aur kitne delivered ho gaye, uska ek doughnut chart render hota hai.

### Feature 4: Platform Commission & Payout Ledger
Ye ek secure financial engine hai jo admin aur sellers ke beech paise ka hisaab rakhta hai.
- **Automated Ledger:** Backend real-time me saare 'Delivered' orders ko scan karke **Platform Commission (10%)** aur **Seller Earnings (90%)** calculate karta hai. Isse kabhi error ya discrepancy nahi aati.
- **Payout Workflow:** Seller apne dashboard se bank withdrawal ki request daalta hai. Ye request Admin ke Ledger page pe aati hai, jaha Admin isey approve/reject kar sakta hai.
- **Secure Architecture:** Payout data directly Order data aur Payout collection ko merge karke banta hai. Support ya Marketing admins is sensitive data ko bilkul access nahi kar sakte.

### Feature 5: Modern UI/UX & Gamified Shopping Experience
Website me conversion rates badhane ke liye ultra-premium features dale gaye hain:
- **Instagram-Style Story Highlights:** Homepage par circular thumbnails hote hain jin par click karne se full-screen auto-progressing viewer open hota hai. Admin direct panel se latest sales ya products ki story laga kar user ko direct URL pe bhej sakta hai.
- **AI Auto-Bundler (Hyper-Personalized Upsell):** Jab user cart me koi item add karta hai, ek AI-driven high-conversion popup aata hai jo complementary items suggest karta hai. Isme ek ticking countdown timer hota hai jo user ko limited-time 20% discount (BUNDLE20) lene pe majboor karta hai, drastically increasing AOV (Average Order Value).
- **Global Typography Scaling:** TailwindCSS `rem` units aur root HTML scaling (`font-size: 125%`) use karke pure frontend, admin aur seller panel ka text size badi screens par readable banaya gaya hai.

### Feature 6: Background Automation Services (Cron Jobs)
E-commerce operations ko autopilot pe rakhne ke liye server-side background tasks chalte hain:
- **Abandoned Cart Recovery System:** Backend me `node-cron` package integrated hai jo every 15 minutes background me chupke se chal ke check karta hai ki kis user ne cart me items chhod diye hain (cartUpdatedAt < 30 minutes ago). Wo Nodemailer trigger karke user ko custom HTML email bhejta hai (jisme actual product image aur 10% discount code hota hai) taaki lost sales recover ho sake. Ye directly sales 15-20% boost karta hai.

### Feature 7: AI "Karma Score" (Fraud Prevention System)
Fake returns aur RTO (Return to Origin) losses ko rokne ke liye ek autonomous risk-management engine banaya gaya hai.
- **Trust Metrics:** Har naye user ko 100 points ka 'Karma Score' milta hai. Agar user apne orders frequently Cancel ya Return karta hai, toh backend uska score drop kar deta hai (-20 for returns, +5 for successful delivery).
- **Automated Penalties:** Agar kisi user ka score 40 se niche girta hai, toh Checkout system automatically uske liye **Cash on Delivery (COD)** ka option hamesha ke liye block kar deta hai. Sirf prepaid options (Stripe/Razorpay) hi available rehte hain.
- **Admin Visibility:** Admin panel ke Orders page me har customer ke naam ke aage uska live Karma Score ek dynamic badge (Red/Blue color code) ke sath dikhta hai.

### Feature 8: Professional Invoice Generation (Print UI)
- **Dedicated Print Stylesheets:** Admin panel ke Order Modal me "Print Invoice" ka button click karne par, ek completely hidden printable UI trigger hota hai. TailwindCSS ke `@media print` aur `print:` modifiers ka use karke sirf A4-size optimized clean professional invoice print hoti hai (with company details, itemized tables, and footers), jabki baaki ka admin interface automatically hide ho jata hai.

### Feature 9: AI Virtual Try-On (Text-to-Image Workaround)
Ye feature users ko ek realistic preview deta hai ki kapde unpe kaise lagenge, conversion rates badhane ke liye.
- **How It Works (Technical Reality):** Real Image-to-Image VTON processing (jaise user ki exact photo pe shirt overlap karna) ke liye expensive paid AI APIs lagte hain. Isliye, is platform me ek smart **Text-to-Image workaround** use hua hai using free APIs (`pollinations.ai`). 
- **Advanced Prompt Engineering:** Frontend user ke physical traits (e.g. Indian Male) aur product ki exact details (color, name, fit) ko ek highly-optimized, descriptive prompt me convert karta hai. (e.g., `Hyperrealistic fashion editorial photography, attractive Indian Male model wearing a exactly Pink Striped Shirt...`).
- **Result:** AI scratch se ek brand new, 8k photorealistic image generate karta hai jo customer ko unke jaisa relatable model unka selected product pehne hue dikhata hai, bina heavy cloud processing cost ke.

### Feature 10: Smart Size Recommender (Fit Analytics)
Size-related returns e-commerce ki sabse badi problem hoti hain. Isko solve karne ke liye ek interactive fit engine banaya gaya hai.
- **Dynamic Algorithm:** Product page pe 'Size Guide & Calculator' click karne par, user ko boring chart ke alawa ek Calculator milta hai.
- **User Inputs:** Ye engine user se sirf **Height (cm)**, **Weight (kg)**, **Body Build**, aur **Fit Preference (Tight/Regular/Loose)** puchta hai.
- **Processing:** Frontend pe ek JavaScript algorithm BMI (Body Mass Index) calculate karta hai aur user ke body build aur fit preference ke mutabiq best size nikalta hai.
- **Output:** Output me exact recommendation aati hai (e.g., "Size M - 94% Fit Match") jise user ek click me seedha apply kar sakta hai.

### Feature 11: Discover / Studio (Reels-style Video Commerce)
Ek TikTok/Reels jaisi vertical video shopping feed jo user engagement ko next level par le jaati hai.
- **Cloudinary CDN & Optimization:** Videos MongoDB ya Node.js server pe stream nahi hote, taaki server choke na ho. Cloudinary ke automatic transformations (`video_codec: auto`, `quality: auto`, `crop: limit`, width 720) ke zariye video ko heavily compress kiya jata hai bina quality loss ke.
- **Lazy Loading & Infinite Scroll:** IntersectionObserver ka use karke ek baar me sirf visible video hi play hoti hai baaki pause rehti hain. Nayi videos scroll karne par API ke through fetch hoti hain (`/api/discover/feed?page=N`).
- **Direct Shoppable:** Har video pe ek "Mini Product Card" overlay hota hai, jahan se user seedha uss item ko "Add to Cart" kar sakta hai video dekhte hue.
- **Admin Management:** Seller/Admin apne dashboard se video upload, delete, aur metrics track kar sakte hain. Delete karne pe Cloudinary se video securely wipe ho jati hai taaki storage bache.

### Feature 12: Advanced Agentic AI Fashion Stylist (Chatbot)
Ek highly intelligent, ChatGPT-style chatbot jo direct MongoDB database se connected hai.
- **Local LLM Integration:** Ye backend Node.js server pe running local `Ollama` instance (`veloura-stylist` model) ke sath communicate karta hai. 
- **Agentic Tool Calling:** AI model ko database queries likhne ki zaroorat nahi hai. Humne usey kuch predefined "Tools" (jaise `searchProducts`, `addToCart`, `getFashionStylingOutfit`) ka JSON schema diya hua hai. Jab user kehta hai "Show me black shirts", AI samajh jata hai ki usey `searchProducts` tool use karna hai.
- **Visual Search (Computer Vision):** Agar user koi photo upload karta hai, toh `llava` vision model us photo ko analyze karta hai (Color, Type, Category) aur uske hisab se similar products humare database se nikal kar deta hai.
- **Context Awareness:** Chatbot history yaad rakhta hai. Agar user ne bola "Under 2000" aur fir bola "Show red ones", toh AI ko samajh aata hai ki "red ones under 2000" ki baat ho rahi hai.

### Feature 13: Vector Search (Visual Image Search) Microservice
Ek advanced reverse-image search system jo user ko photo upload karke similar kapde dhundne ki suvidha deta hai.
- **Technology Stack:** Python, FastAPI, HuggingFace Transformers (CLIP model `openai/clip-vit-base-patch32`), aur Qdrant Vector Database.
- **Microservice Architecture:** Backend Node.js ke alawa ek separate Python FastAPI server banaya gaya hai. 
- **How It Works:** Jab user photo upload karta hai, Python server CLIP model ka use karke us image ko ek 512-dimensional mathematical vector me convert karta hai. Qdrant database me maujood saare products ke vectors se iska distance (Cosine Similarity) check hota hai, aur sabse visually similar products frontend par dikhaye jate hain.
- **Extreme Optimization for Render (512MB RAM):** Deep learning models heavy hote hain, isliye is service ko ultra-low memory par chalane ke liye optimizations ki gayi: `torch.inference_mode()` lagaya gaya, gradients disable kiye gaye, aur CPU-only inference with a single worker thread deploy kiya gaya taaki server Out-Of-Memory (OOM) crash na ho.

### Feature 14: Seamless Single Sign-On (SSO) for Vendors
- **Frictionless Navigation:** Jab koi user seller banne ke baad apne customer profile se "Seller Dashboard" pe click karta hai, toh use dobara login nahi karna padta.
- **Security:** Frontend securely ek one-time URL (`?sso_token=...`) generate karta hai. Seller React application load hote hi us token ko intercept karti hai, `localStorage` me save karti hai, aur turant URL history ko clean kar deti hai taaki token browser address bar me visible na rahe. Isse user direct authenticated seller dashboard me enter hota hai.

### Feature 15: Deep Mobile-Responsive Architecture
- **App-like Web Experience:** Frontend aur Admin/Seller panels ko completely mobile-optimized kiya gaya hai.
- **Techniques Used:** TailwindCSS ke `sm:` aur `md:` breakpoints ka massive use karke layouts ko stack kiya gaya hai. Complex data tables (jaise Admin Orders ya Seller Inventory) ko responsive scrollable wrappers (`overflow-x-auto`) me dala gaya hai, taaki 320px ki chhoti phone screen par bhi UI shrink ya cut na ho, aur Desktop UI bilkul untouched aur premium rahe.

---

## 📂 5. Database Schema (Collections)

1. **`users`**: Saare buyers, sellers, aur admins yahi save hote hain. Unke role (`user`, `seller`, `admin`) ke basis pe unhe alag permissions milti hain. Isme fraud prevention ke liye user ka `karmaScore` bhi store hota hai.
2. **`products`**: Product details, unka seller kaun hai, approval status, variants (size/color), aur ratings.
3. **`orders`**: Customer details, kharidi hui items, kis seller ka item hai, payment status, aur delivery timeline.
4. **`coupons`**: Discount codes, minimum values, category conditions, aur BOGO rules.
5. **`reviews`**: Customer ke feedbacks.
6. **`payouts`**: Sellers ki bank withdrawal requests aur unka status (pending/completed).

---
**Summary:** Veloura sirf ek frontend template nahi hai. Ye ek proper backend-driven, scalable ecommerce platform hai jisme strict security, automated math (coupons/earnings), aur hierarchy (Admin -> Seller -> User) properly managed hai!
