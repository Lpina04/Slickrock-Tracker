# Slickrock Production Tracker — Setup Guide

---

## What You're Building

A live-updating mobile web app your team opens on their phones.  
- **Shop floor**: Opens the URL → sees all orders by stage, taps to advance them.  
- **Manager**: Taps "Sign In" → logs in → adds new orders from the form.  
- **All devices sync instantly** via Firebase — no refresh needed.

---

## Step 1: Create Your Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `slickrock-tracker` → click through the setup
3. On the project homepage, click the **Web icon** `</>` to add a web app
4. Name it `slickrock-web`, click **"Register app"**
5. Firebase shows you a `firebaseConfig` block — **copy it**, you'll need it in a moment

---

## Step 2: Enable Firestore Database

1. In the left sidebar: **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → select your region (us-central1 is fine) → **Enable**

---

## Step 3: Enable Authentication

1. In the left sidebar: **Build → Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab → click **Email/Password** → **Enable** → Save
4. Go to the **Users** tab → click **"Add user"**
5. Enter the manager's email and a strong password → **Add user**
   - Repeat for any additional managers

---

## Step 4: Set Firestore Security Rules

1. In Firestore → **Rules** tab
2. Replace all the existing text with the contents of `firestore.rules`
3. Click **Publish**

These rules mean:
- **Anyone** (even without login) can view orders and advance their stage
- **Only logged-in managers** can add or delete orders

---

## Step 5: Plug In Your Firebase Config

Open `src/firebase.js` and replace the placeholder values with your actual config:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← your values here
  authDomain: "slickrock-tracker.firebaseapp.com",
  projectId: "slickrock-tracker",
  storageBucket: "slickrock-tracker.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

---

## Step 6: Install Dependencies & Test Locally

Make sure you have **Node.js** installed (https://nodejs.org — get the LTS version).

Open a terminal in the project folder and run:

```bash
npm install
npm start
```

Your browser opens at `http://localhost:3000` — you should see the tracker.  
Test adding an order by clicking **"+ ORDER"** → signing in with the manager credentials you created.

---

## Step 7: Deploy to Vercel (Free — Shareable URL)

1. Go to **https://vercel.com** → sign up with GitHub (free)
2. Push your project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial Slickrock tracker"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/slickrock-tracker.git
   git push -u origin main
   ```
3. In Vercel: **"Add New Project"** → import your GitHub repo → **Deploy**
4. Vercel gives you a URL like `https://slickrock-tracker.vercel.app`

**That URL is your app.** Bookmark it on every phone and tablet in the shop.

---

## Step 8: Add to Home Screen (Makes It Feel Like an App)

On each team member's phone:

**iPhone (Safari):**
1. Open the URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Name it "Slickrock" → Add

**Android (Chrome):**
1. Open the URL in Chrome
2. Tap the 3-dot menu → "Add to Home screen"

It'll appear on their home screen like a real app icon.

---

## How the App Works Day-to-Day

| Who | Action |
|-----|--------|
| **Manager** | Taps "+ ORDER" → signs in → fills out the form → order appears on every phone instantly |
| **Shop floor** | Opens app → sees all orders in PREP/POUR → taps "→ SENT TO CURE" when poured |
| **Painter** | Goes to CURING tab → taps "→ READY TO PAINT" → order moves to PAINT |
| **Shipper** | Goes to PAINT tab → taps "→ DONE PAINTING" → order moves to SHIPPING |
| **Everyone** | SHIPPING tab shows everything in the bay waiting for pickup |

---

## Troubleshooting

**"Permission denied" errors in console**  
→ Double-check your Firestore rules were published correctly (Step 4)

**Orders not appearing in real-time**  
→ Make sure Firestore is enabled and your `projectId` in `firebase.js` matches your actual project

**Can't log in as manager**  
→ Verify the user was created in Firebase Auth → Users tab with the exact email/password

**App won't build**  
→ Run `npm install` first, then `npm start`

---

## Project File Structure

```
slickrock/
├── public/
│   └── index.html
├── src/
│   ├── firebase.js          ← PUT YOUR CONFIG HERE
│   ├── index.js
│   ├── App.js
│   ├── contexts/
│   │   └── AuthContext.js   ← Login state management
│   ├── hooks/
│   │   └── useOrders.js     ← Firebase real-time data
│   └── components/
│       ├── Dashboard.js     ← Main Kanban board
│       ├── OrderCard.js     ← Individual order card
│       ├── OrderForm.js     ← Manager entry form
│       └── LoginScreen.js   ← Manager sign-in
├── firestore.rules          ← Copy into Firebase console
└── package.json
```
