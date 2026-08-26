# 🚀 Ultimate Cloud Deployment Guide (Oracle Cloud VPS Edition)

Yeh step-by-step guide tumhari website ko tumhare laptop se nikal kar puri duniya ke liye internet par live kar degi. Isme hum **GitHub**, **Oracle Cloud (Lifetime Free VPS for Backend & AI)**, aur **Vercel (Frontends ke liye)** use karenge.

---

## Step 1: Code ko GitHub par push karna
Sabse pehle hume apna saara code ek secure cloud storage (GitHub) par dalna hoga. Vercel aur tumhara cloud server dono code yahi se lenge.

1. **GitHub par jao:** [github.com](https://github.com) par login karo aur ek **New Repository** banao (naam rakho jaise: `forever-ecommerce`). Ise **Private** rakhna taaki code safe rahe.
2. **Apne laptop mein Terminal (Command Prompt) kholo** aur apne project folder (`forever-full-stack`) mein jao.
3. Yeh commands ek-ek karke run karo:
   ```bash
   git init
   git add .
   git commit -m "First Launch Version"
   git branch -M main
   # Niche wali line tumhare GitHub repo pe di hogi, waha se copy karke paste karna
   git remote add origin https://github.com/TUMHARA_USERNAME/forever-ecommerce.git
   git push -u origin main
   ```
**IMPORTANT:**
Make sure ki tumhare project folder mein `.gitignore` file ho jisme `node_modules` aur `.env` likha ho. Tumhari `.env` (passwords/keys) kabhi GitHub par nahi jani chahiye!

---

## Step 2: Backend (Node.js) ko Oracle Cloud VPS par Live karna (Hamesha ke liye Free)
Oracle Cloud tumhe "Always Free" tier mein ek poora Linux server deta hai jo hamesha 24/7 fast chalta hai. Isme hum **24GB RAM** wala server lenge jo AI (Ollama) chalane ke liye kaafi hai!

### A. Server Banana
1. **Oracle Cloud** par ek free account banao (oracle.com/cloud/free).
2. Dashboard par **"Create a VM instance"** par click karo.
3. **Image & Shape:** 
   - Image: `Ubuntu 22.04` ya `24.04` select karo.
   - Shape: `Ampere A1 Compute` select karo (Isme RAM ko max **24GB** aur CPU ko **4 Cores** tak kardo, yeh completely free hai).
4. **SSH Keys:** `Save Private Key` aur `Save Public Key` par click karke dono files laptop mein save kar lo (yeh tumhara server ka password hai).
5. **Create** par click karo. 1 minute baad tumhe ek **Public IP Address** mil jayega (e.g., `129.150.x.x`).

### B. Server ko Configure karna (Node.js & Ollama)
1. Apne laptop ka Terminal kholo aur server se connect karo:
   ```bash
   ssh -i /path/to/your/saved-private-key.key ubuntu@TUMHARA_PUBLIC_IP
   ```
2. Server ke andar Node.js aur Git install karo:
   ```bash
   sudo apt update
   sudo apt install nodejs npm git -y
   ```
3. **🤖 OLLAMA INSTALL KARNA (AI CHATBOT KE LIYE):**
   Kyunki tumhare paas 24GB RAM wala cloud server hai, tum Ollama seedha cloud par chala sakte ho!
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
   Install hone ke baad, apna AI model cloud par download karo (eg. llama3):
   ```bash
   ollama run llama3
   ```
   *(Pehli baar download hone mein thoda time lagega. Download hone ke baad `Ctrl+D` dabakar baahar aa jao. Ollama ab background mein chalta rahega!)*

### C. Backend Code Setup
1. Apna code GitHub se server par download (clone) karo:
   ```bash
   git clone https://github.com/TUMHARA_USERNAME/forever-ecommerce.git
   cd forever-ecommerce/backend
   ```
2. Dependencies install karo:
   ```bash
   npm install
   ```
3. **.env file banao:** 
   ```bash
   nano .env
   ```
   *Isme apne laptop wali `.env` ka data paste kardo. Dhyan rakhna ki `OLLAMA_HOST` abhi bhi `"http://127.0.0.1:11434"` hi rahega kyunki dono (Backend aur Ollama) ek hi cloud server par chal rahe hain! Phir `Ctrl+X`, `Y`, `Enter` dabao save karne ke liye.*

### D. Backend ko 24/7 chalane ke liye PM2 use karna
```bash
sudo npm install -g pm2
pm2 start server.js --name "forever-backend"
pm2 save
pm2 startup
```

### E. Ports open karna (Network config)
Taki bahar se Vercel tumhare backend ko call kar sake, tumhe port 4000 open karna hoga:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 4000 -j ACCEPT
sudo netfilter-persistent save
```
*(Aur Oracle dashboard ke VCN settings > Security Lists mein jaakar TCP port 4000 ko Ingress rules mein add kar do).*

---

## Step 3: Frontends ko Update karna
Ab tumhara backend cloud server par live hai, toh tumhare Frontend apps ko ab us cloud IP se baat karni hogi.

1. Apne VScode mein wapas aao.
2. `frontend/.env`, `admin/.env`, aur `seller/.env` files ko kholo.
3. Jo tumhara `VITE_BACKEND_URL` hai, usko apne naye cloud IP se update kar do:
   ```env
   VITE_BACKEND_URL=http://TUMHARA_PUBLIC_IP:4000
   ```
4. Yeh changes save karke GitHub par update kar do:
   ```bash
   git add .
   git commit -m "Updated Backend URL to Oracle Cloud VPS"
   git push
   ```

---

## Step 4: Frontends ko Vercel par Deploy karna (Ekdum Fast)
1. **Vercel.com** par jao aur GitHub se login karo.
2. **Add New... > Project** par click karo.
3. Apni `forever-ecommerce` repository ko Import karo.
4. **Deploying the Apps (Customer, Admin, Seller):**
   - Root Directory ko respectably `frontend`, `admin`, aur `seller` set karo.
   - Environment Variables mein `VITE_BACKEND_URL` daal do.
   - **Deploy** pe click karo! 

---

## 🎉 Tumhari Website + AI Totally Cloud Par Live Hai!
- **Frontend/Admin/Seller:** Vercel ke global CDN par hosted hain (Super fast & secure).
- **Backend & Ollama AI:** Dono tumhare Oracle Cloud Server par ek sath hosted hain. Backend directly server ke andar hi Ollama se baat karega (Zero latency).
- **Database:** MongoDB Atlas par hai.
