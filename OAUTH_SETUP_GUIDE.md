# OAuth Setup Guide for The Curry House Yokosuka

This guide will help you set up **Google** and **Apple** authentication for your restaurant website.

## ✅ Code Changes Completed

The code has been updated to support:
- ✅ Google Sign In
- ✅ Apple Sign In (replaced Facebook)

Now you need to configure these providers in Supabase.

---

## 🔵 Google OAuth Setup

### Step 1: Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: **External**
   - App name: **The Curry House Yokosuka**
   - User support email: `thecurryhouseyokosuka@gmail.com`
   - Developer contact email: `thecurryhouseyokosuka@gmail.com`

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **The Curry House Yokosuka**
   - Authorized JavaScript origins:
     ```
     https://thecurryhouseyokosuka.vercel.app
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     http://localhost:54321/auth/v1/callback
     ```

7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Enable Google provider
6. Paste your **Client ID** and **Client Secret**
7. Click **Save**

### Step 3: Test Google Sign In

1. Go to your website
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected back and logged in!

---

## 🍎 Apple Sign In Setup

### Step 1: Apple Developer Account

**Requirements:**
- Apple Developer Account ($99/year)
- Access to Apple Developer Portal

### Step 2: Create Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **Services IDs** → Continue
5. Register a Services ID:
   - Description: **The Curry House Yokosuka**
   - Identifier: `com.thecurryhouseyokosuka.auth` (must be unique)
   - Enable **Sign In with Apple**
   - Click **Configure**

### Step 3: Configure Apple Sign In

1. In the Configure window:
   - Primary App ID: Select your app ID (or create one)
   - Web Domain: `thecurryhouseyokosuka.vercel.app`
   - Return URLs:
     ```
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     ```
2. Save and Continue

### Step 4: Create Private Key

1. Go to **Keys** → **+** button
2. Key Name: **Curry House Auth Key**
3. Enable **Sign In with Apple**
4. Configure → Select your Services ID
5. Save
6. Download the `.p8` key file (keep it safe!)
7. Note your **Key ID** (10 characters)

### Step 5: Get Team ID

1. In Apple Developer Portal
2. Go to **Membership** section
3. Copy your **Team ID** (10 characters)

### Step 6: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Apple** in the list
4. Enable Apple provider
5. Fill in the form:
   - **Services ID**: `com.thecurryhouseyokosuka.auth` (from Step 2)
   - **Team ID**: Your 10-character Team ID
   - **Key ID**: Your 10-character Key ID from the .p8 file
   - **Private Key**: Open the .p8 file and paste the entire content (including header/footer)
6. Click **Save**

### Step 7: Test Apple Sign In

1. Go to your website
2. Click "Continue with Apple"
3. Sign in with your Apple ID
4. You should be redirected back and logged in!

---

## 🔒 Security Notes

1. **Redirect URIs Must Match Exactly**
   - Production: `https://[YOUR-SUPABASE-REF].supabase.co/auth/v1/callback`
   - Development: `http://localhost:54321/auth/v1/callback`

2. **Keep Credentials Secret**
   - Never commit OAuth secrets to Git
   - Store in Supabase Dashboard only
   - Apple .p8 key cannot be downloaded again!

3. **Environment URLs**
   - Update authorized domains when deploying
   - Add your Vercel domain to authorized origins

---

## 📱 User Experience

After setup, users can:
1. Click "Continue with Google" → Sign in with Google account
2. Click "Continue with Apple" → Sign in with Apple ID
3. Profile is automatically created in your database
4. No password needed for social logins
5. Same email = same account (auto-linked)

---

## 🐛 Troubleshooting

### "Redirect URI mismatch"
- Check that Supabase callback URL is added to OAuth provider settings
- Format: `https://[project-ref].supabase.co/auth/v1/callback`

### "Invalid client"
- Verify Client ID/Secret are correct in Supabase
- Make sure provider is enabled in Supabase Dashboard

### Apple Sign In not showing
- Ensure you have an active Apple Developer account ($99/year)
- Verify Services ID is properly configured
- Check that .p8 private key is complete (including BEGIN/END markers)

### "Configuration error"
- Check Team ID and Key ID are exactly 10 characters
- Verify Services ID matches between Apple and Supabase
- Ensure return URL includes full callback path

---

## ✅ Testing Checklist

- [ ] Google Sign In works on localhost
- [ ] Google Sign In works on production (Vercel)
- [ ] Apple Sign In works on localhost
- [ ] Apple Sign In works on production (Vercel)
- [ ] Profile data is saved correctly
- [ ] Users can sign out and sign back in
- [ ] Same email creates one account

---

## 📞 Support

Need help? Check:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Docs](https://developer.apple.com/sign-in-with-apple/)

---

**Current Status:**
- ✅ Code updated (Google + Apple)
- ⏳ Pending: Configure OAuth providers in Supabase Dashboard
- ⏳ Pending: Test both providers

**Your Supabase Project URL:**
Get this from: https://supabase.com/dashboard/project/[YOUR-PROJECT]/settings/api

Replace `[YOUR-SUPABASE-PROJECT-REF]` in all URLs above with your actual project reference.
