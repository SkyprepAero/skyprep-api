# Google Calendar OAuth Setup (No Google Workspace Required)

This guide explains how to set up Google Calendar OAuth for creating Meet links using user credentials. This approach works with **personal Gmail accounts** and does **not require Google Workspace**.

## Overview

Instead of using a service account (which requires Google Workspace), we use OAuth 2.0 to let teachers authorize your app to access their Google Calendar. This allows creating calendar events with Meet links in their personal calendars.

## Prerequisites

- Google Cloud Project
- OAuth 2.0 Client ID and Secret (Web application type)
- Teachers need to authorize calendar access once

## Step 1: Configure OAuth 2.0 Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → **APIs & Services** → **Credentials**
3. Create or edit an **OAuth 2.0 Client ID** with type **Web application**
4. Add **Authorized redirect URIs**:
   - Development: `http://localhost:4000/api/v1/auth/google/calendar/callback`
   - Production: `https://your-api-domain.com/api/v1/auth/google/calendar/callback`
5. Save and copy:
   - **Client ID**
   - **Client Secret** (you'll need this!)

## Step 2: Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Calendar API** (required)
   - **Google Meet API** (if available, though Calendar API includes Meet)

## Step 3: Configure Environment Variables

Add to your `.env` file:

```env
# Google OAuth (for Calendar/Meet access)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/calendar/callback
```

**For production**, update the redirect URI:
```env
GOOGLE_OAUTH_REDIRECT_URI=https://your-api-domain.com/api/v1/auth/google/calendar/callback
```

## Step 4: Teacher Authorization Flow

### Backend Endpoints

1. **Initiate OAuth Flow**
   ```
   GET /api/v1/auth/google/calendar/authorize
   Headers: Authorization: Bearer <teacher-token>
   ```
   Returns: `{ authUrl: "https://accounts.google.com/..." }`

2. **Check Connection Status**
   ```
   GET /api/v1/auth/google/calendar/status
   Headers: Authorization: Bearer <teacher-token>
   ```
   Returns: `{ connected: true/false, expired: true/false }`

3. **Revoke Access**
   ```
   POST /api/v1/auth/google/calendar/revoke
   Headers: Authorization: Bearer <teacher-token>
   ```

### Frontend Flow

1. **Teacher clicks "Connect Google Calendar" button**
2. **Frontend calls** `GET /api/v1/auth/google/calendar/authorize`
3. **Redirect teacher to** the `authUrl` from the response
4. **Teacher authorizes** on Google's consent screen
5. **Google redirects to** `/api/v1/auth/google/calendar/callback?code=...&state=...`
6. **Backend exchanges code for tokens** and saves them
7. **Backend redirects to** frontend success page

### Example Frontend Code

```typescript
// Initiate OAuth flow
const response = await fetch('/api/v1/auth/google/calendar/authorize', {
  headers: {
    'Authorization': `Bearer ${teacherToken}`
  }
});
const { data } = await response.json();

// Redirect teacher to Google
window.location.href = data.authUrl;
```

## Step 5: How It Works

1. **Teacher authorizes once** - OAuth tokens are stored in the database
2. **When accepting a session** - System uses teacher's OAuth token to create calendar event
3. **Meet link is created** - In teacher's calendar with invites to both teacher and student
4. **Tokens auto-refresh** - System automatically refreshes expired tokens

## Benefits Over Service Account

✅ Works with personal Gmail accounts  
✅ No Google Workspace required  
✅ Can invite attendees (teacher and student)  
✅ Creates events in teacher's actual calendar  
✅ Sends calendar invites automatically  
✅ No domain-wide delegation needed  

## Security

- OAuth tokens are stored securely in the database (not exposed in API responses)
- Tokens are encrypted at rest (MongoDB)
- Refresh tokens are used to get new access tokens automatically
- Teachers can revoke access at any time

## Troubleshooting

### Error: "User has not authorized Google Calendar access"
- Teacher needs to complete OAuth authorization
- Call `GET /api/v1/auth/google/calendar/authorize` and have teacher authorize

### Error: "Google Calendar access expired"
- Refresh token may have been revoked
- Teacher needs to re-authorize

### Error: "Invalid redirect URI"
- Check that the redirect URI in `.env` matches exactly what's configured in Google Cloud Console
- Must match protocol (http/https), domain, port, and path exactly

## Migration from Service Account

If you were using service accounts:
1. Remove service account environment variables (optional - they won't be used)
2. Have teachers authorize via OAuth
3. System will automatically use OAuth tokens instead

The code automatically uses OAuth if available, falling back to service account only if OAuth tokens are not present.

