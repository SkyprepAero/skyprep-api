# Google Service Account Setup for Calendar/Meet Integration

This guide explains how to set up a Google Service Account to enable automatic Google Meet link generation and calendar event creation when teachers accept session requests.

## Overview

The service account is used to:
- Create Google Calendar events with Meet links automatically
- Send calendar invites to both teachers and students
- Generate persistent Meet links that can be reused

If the service account is not configured, the system will fall back to generating simple Meet links (without calendar integration).

## Prerequisites

- A Google Cloud Project
- Admin access to Google Cloud Console
- Domain-wide delegation (if using Google Workspace) or appropriate permissions

## Important: IAM Roles vs OAuth Scopes

**You do NOT need to assign IAM roles to the service account.**

The service account uses **OAuth scopes** (not IAM roles) to access Google APIs. Here's the difference:

- **IAM Roles**: Control access to Google Cloud resources (Compute Engine, Cloud Storage, etc.) - **NOT NEEDED** for Calendar API
- **OAuth Scopes**: Control access to Google APIs (Calendar, Gmail, Drive, etc.) - **This is what you need**

The OAuth scope is specified in the code: `https://www.googleapis.com/auth/calendar`

**What you actually need:**
1. ✅ Enable the Calendar API (project-level)
2. ✅ Create and download the service account key
3. ✅ (Optional) Configure domain-wide delegation for Google Workspace
4. ❌ **No IAM roles required**

## Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details:
   - **Service account name**: e.g., `skyprep-calendar-service`
   - **Service account ID**: (auto-generated)
   - **Description**: "Service account for creating Google Calendar events and Meet links"
6. Click **Create and Continue**
7. **Skip the IAM role assignment steps** - You don't need to assign any IAM roles. The service account will authenticate using OAuth scopes specified in the code.
8. Click **Done**
    
## Step 2: Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google Calendar API**
   - **Google Meet API** (if available)

## Step 3: Create and Download Service Account Key

1. Go back to **IAM & Admin** → **Service Accounts**
2. Click on the service account you just created
3. Go to the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create** - this will download a JSON file

**Important**: Keep this file secure! It contains sensitive credentials.

## Step 4: Configure Domain-Wide Delegation (For Google Workspace)

If you're using Google Workspace and want the service account to create calendar events on behalf of users:

1. In the service account details page, check **Enable Google Workspace Domain-wide Delegation**
2. Note the **Client ID** (you'll need this)
3. In Google Admin Console:
   - Go to **Security** → **API Controls** → **Domain-wide Delegation**
   - Click **Add new**
   - Enter the Client ID from step 2
   - Add the following OAuth scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click **Authorize**

**Note**: For personal Google accounts, domain-wide delegation is not required, but the service account will only be able to create events in its own calendar.

## Step 5: Share Calendar Access (Alternative Approach)

If domain-wide delegation is not available, you can:

1. Create a shared calendar in Google Calendar
2. Share it with the service account email (give it "Make changes to events" permission)
3. Update the code to use this calendar ID instead of 'primary'

## Step 6: Configure Environment Variables

### Option A: JSON String (Recommended for Production)

1. Open the downloaded JSON key file
2. Convert it to a single-line string (escape quotes and newlines)
3. Add to your `.env` file:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Note**: The JSON must be on a single line with `\n` for newlines in the private key.

### Option B: Base64 Encoded (Alternative)

You can also base64 encode the entire JSON file:

```bash
# On macOS/Linux
cat path/to/service-account-key.json | base64

# Add to .env
GOOGLE_SERVICE_ACCOUNT_KEY=<base64-encoded-string>
```

Then update `googleMeet.js` to decode it:
```javascript
const credentials = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString());
```

### Option C: File Path (For Development)

For local development, you can store the file and reference it:

```env
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

Then update `googleMeet.js` to read from file:
```javascript
const fs = require('fs');
const credentials = JSON.parse(fs.readFileSync(serviceAccountKey, 'utf8'));
```

## Step 7: Test the Configuration

1. Restart your API server
2. Accept a session request through the API
3. Check the server logs for any errors
4. Verify that:
   - A calendar event is created
   - A Meet link is generated
   - Both teacher and student receive calendar invites

## Troubleshooting

### Error: "Service account not configured"
- Check that both `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_KEY` are set in your `.env` file
- Restart the server after adding the variables

### Error: "Could not parse service account key"
- Ensure the JSON is properly formatted
- If using a JSON string, make sure newlines in the private key are escaped as `\n`
- Verify the JSON is valid by parsing it: `JSON.parse(yourKeyString)`

### Error: "Insufficient permissions"
- Ensure the Calendar API is enabled
- Check that domain-wide delegation is configured (for Google Workspace)
- Verify the service account has the correct scopes

### Error: "Calendar access denied"
- For personal Google accounts, the service account can only create events in its own calendar
- Consider using a shared calendar approach (see Step 5)
- Or use domain-wide delegation for Google Workspace accounts

### Fallback to Simple Meet Links
If the service account fails, the system will automatically generate a simple Meet link format. This is a fallback and won't create calendar events.

## Security Best Practices

1. **Never commit the service account key to version control**
2. **Add `.env` to `.gitignore`**
3. **Use environment variables in production** (not files)
4. **Rotate keys periodically**
5. **Limit the service account's permissions** to only what's needed
6. **Use separate service accounts for different environments** (dev, staging, prod)

## Example Service Account JSON Structure

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"
}
```

## Additional Resources

- [Google Service Accounts Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Domain-Wide Delegation Guide](https://developers.google.com/admin-sdk/directory/v1/guides/delegation)

