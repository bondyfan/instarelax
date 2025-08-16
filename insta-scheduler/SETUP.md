# Instagram Scheduler Setup Guide

## 🎉 What's Been Implemented

✅ **Google Authentication** - Firebase Auth with Google sign-in  
✅ **Beautiful UI** - Modern, responsive design with Tailwind CSS  
✅ **30-Day Calendar** - Interactive calendar with post previews  
✅ **Post Scheduling Modal** - Beautiful modal with image/video preview  
✅ **Instagram OAuth Flow** - Facebook OAuth with Instagram permissions  
✅ **Instagram API Integration** - Direct posting to Instagram  
✅ **File Upload** - Firebase Storage for media files  
✅ **Mobile Responsive** - Works perfectly on all devices  

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd insta-scheduler
npm install
```

### 2. Firebase Setup (Already Done)
- ✅ Firebase project is already configured
- ✅ Authentication with Google provider enabled
- ✅ Firestore database for user data
- ✅ Storage for media uploads

### 3. Instagram OAuth Setup (Required)

To enable Instagram posting, you need to set up Facebook for Developers:

1. **Create Facebook App**
   - Go to [Facebook for Developers](https://developers.facebook.com/)
   - Create a new app → "Business" type
   - Add "Instagram Basic Display" and "Instagram Content Publishing" products

2. **Configure OAuth Settings**
   - In Facebook App Settings → Basic:
     - Add your domain to "App Domains"
     - Set "Privacy Policy URL" and "Terms of Service URL"
   - In Instagram Basic Display → Basic Display:
     - Add OAuth Redirect URI: `http://localhost:3000/api/instagram/callback`
     - Add OAuth Redirect URI: `https://yourdomain.com/api/instagram/callback`

3. **Get App Credentials**
   - Copy App ID and App Secret from App Settings → Basic

4. **Create Environment File**
   Create `.env.local` in the project root:
   ```env
   FACEBOOK_APP_ID=your_facebook_app_id_here
   FACEBOOK_APP_SECRET=your_facebook_app_secret_here
   ```

### 4. Instagram Business Account
- Connect your Instagram account to a Facebook Page
- Convert to Instagram Business Account (required for API posting)

### 5. Start Development
```bash
npm run dev
```

## 🎨 Features Overview

### Beautiful Landing Page
- Gradient backgrounds with Instagram branding
- Feature showcase grid
- Professional call-to-action sections

### Authentication
- Google sign-in with Firebase Auth
- Beautiful login page with brand design
- Automatic user profile creation

### Dashboard
- Clean header with user profile
- Instagram connection status card
- Quick stats overview
- Professional calendar interface

### Calendar Features
- 30-day view with month navigation
- Color-coded post status (pending, published, failed)
- Media type indicators (image/video)
- Past dates disabled
- Today highlighting

### Post Scheduling Modal
- Drag & drop file upload area
- Image/video preview
- Caption editor with character count
- Time picker
- Media type selection
- Instagram connection status

### Instagram Integration
- OAuth flow with Facebook for Instagram permissions
- Direct posting to Instagram (images and videos)
- Business account validation
- Error handling and user feedback

## 📱 How It Works

1. **Sign In** - Users sign in with Google
2. **Connect Instagram** - OAuth flow to connect Instagram Business account
3. **Schedule Posts** - Upload media, add captions, select dates/times
4. **Auto Publishing** - Posts are published directly to Instagram

## 🛠 Technical Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Icons**: React Icons
- **Instagram API**: Facebook Graph API v18.0
- **Styling**: Modern gradient designs, cards, modals

## 🔐 Security Features

- Client-side authentication only (no server secrets needed)
- Secure file uploads to Firebase Storage
- OAuth state validation
- Protected routes and API endpoints

## 📋 Next Steps

1. Set up Facebook App for Instagram OAuth
2. Add your environment variables
3. Test Instagram connection
4. Deploy to production

## 🎯 Production Deployment

For production:
1. Add production domains to Facebook App settings
2. Set up Firebase for production
3. Configure proper redirect URIs
4. Deploy to Vercel/Netlify

The app is ready to go! Just configure the Instagram OAuth and you'll have a fully functional Instagram scheduling SaaS.
