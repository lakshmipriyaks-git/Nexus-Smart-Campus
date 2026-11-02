# Firebase Setup Guide

Follow these steps to set up Firebase for your Student-Teacher Hub application.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `student-teacher-hub` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional, can enable later)
6. Click **Create project**
7. Wait for project to be created, then click **Continue**

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>) to add a web app
2. Enter app nickname: `Student-Teacher Hub Web`
3. **Do NOT** check "Set up Firebase Hosting" (we're using Vite)
4. Click **Register app**
5. **Copy the firebaseConfig object** - you'll need this in Step 5
6. Click **Continue to console**

## Step 3: Enable Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click on **Email/Password** provider
4. Toggle **Enable** to ON
5. Click **Save**

## Step 4: Create Firestore Database

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (for development)
   - Note: This allows read/write access. We'll add security rules later
4. Choose your location (select closest to you)
5. Click **Enable**
6. Wait for database to be created

## Step 5: Add Firebase Config to Your App

1. Copy `.env.example` to `.env` in the project root.
2. Replace each Firebase value with the matching value from your Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Do not leave the example values in place. The API key must come from the Firebase Console under **Project settings → General → Your apps**. If the key is restricted, ensure it allows the domains used by this app, including `localhost` during development.

## Step 6: Restart Development Server

Since we updated the `.env` file, you need to restart the dev server:

1. Stop the terminal running `npm run dev`.
2. Run `npm run dev` again so Vite loads the new environment variables.

## Verification

Once you've completed these steps, let me know and I'll continue with the implementation!

You should see in Firebase Console:
- ✅ Authentication enabled with Email/Password
- ✅ Firestore Database created (in test mode)
- ✅ Web app registered

---

## Troubleshooting

**Can't find the config values?**
- Go to Firebase Console → Project Settings (gear icon) → Scroll down to "Your apps"
- You'll see your web app with the config object

**Need to find your Firebase Console?**
- https://console.firebase.google.com/

**Questions?**
Just let me know and I'll help!
