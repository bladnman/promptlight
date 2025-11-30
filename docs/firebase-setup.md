# Firebase & OAuth Setup (Optional)

> **You may not need this!**
>
> Cloud sync is entirely optional. If you just want to use PromptLight with local prompts, skip this entirely. Everything works without Firebase.
>
> Only set this up if you want to sync prompts across multiple machines.

## Overview

PromptLight uses Google OAuth for authentication and Firebase Firestore for cloud storage. This guide walks you through setting up both services.

## What You'll Need

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)
- Access to [Firebase Console](https://console.firebase.google.com)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top and select **New Project**
3. Name your project (e.g., "promptlight-dev")
4. Click **Create**

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace org)
3. Fill in the required fields:
   - **App name**: PromptLight (or your preferred name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. On the Scopes page, click **Add or Remove Scopes** and add:
   - `openid`
   - `email`
   - `profile`
6. Click **Save and Continue**
7. On Test Users, add your Google email address
8. Click **Save and Continue**, then **Back to Dashboard**

## Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Select **Desktop app** as the application type
4. Name it (e.g., "PromptLight Desktop")
5. Click **Create**
6. You'll see your **Client ID** and **Client Secret** - save these!

## Step 4: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**
3. Select the Google Cloud project you created in Step 1
4. Follow the prompts (you can disable Google Analytics if you don't need it)
5. Click **Create project**

## Step 5: Get Firebase Web App Config

1. In Firebase Console, click the gear icon > **Project settings**
2. Scroll down to **Your apps** section
3. Click the web icon (`</>`) to add a web app
4. Register the app with a nickname (e.g., "PromptLight Web")
5. You'll see the Firebase config - note these values:
   - `apiKey`
   - `authDomain`
   - `projectId`

## Step 6: Enable Firestore

1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a location closest to you
5. Click **Enable**

## Step 7: Deploy Firestore Security Rules

The project includes security rules in `firestore.rules`. Deploy them:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the rules
firebase deploy --only firestore:rules
```

## Step 8: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local`:
   ```bash
   # Development port
   VITE_PORT=1420

   # Firebase Configuration (from Step 5)
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id

   # Google OAuth (from Step 3)
   GOOGLE_CLIENT_ID=1234567890-abc....apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```

## Verification

1. Start the dev server: `./scripts/dev.sh`
2. Open PromptLight
3. Try signing in with Google
4. Create a prompt and verify it syncs

## Troubleshooting

### "Access blocked: This app's request is invalid"

The OAuth consent screen may not be properly configured, or you're not listed as a test user. Go back to Step 2 and verify the consent screen is set up correctly.

### "Error: unauthorized_client"

Make sure you're using **Desktop app** credentials (not Web application). The OAuth flow for desktop apps uses a different redirect mechanism.

### Prompts not syncing

1. Verify Firestore is enabled in Firebase Console
2. Check that firestore.rules are deployed
3. Ensure all environment variables are set correctly

### Token refresh errors

Clear your auth session by deleting:
```
~/Library/Application Support/com.promptlight/auth_session.json
```

Then sign in again.

## Data Structure

PromptLight stores data in Firestore under:

```
users/{userId}/
  meta                 # Folder list and metadata
  prompts/{promptId}   # Individual prompt documents
```

All data is scoped to the authenticated user. The security rules ensure users can only access their own data.
