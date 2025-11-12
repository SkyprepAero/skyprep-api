## Google Sign-In Integration

This guide explains how to enable Google authentication end to end using the existing `POST /api/v1/auth/google` endpoint.

### Prerequisites
- Google Cloud project with OAuth consent screen configured.
- OAuth 2.0 **Web application** client created in Google Cloud Console.
- Backend environment variables loaded from `.env`.

### 1. Configure Google OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project → *APIs & Services* → *Credentials*.
3. Create (or edit) an **OAuth client ID** with type **Web application**.
4. Add allowed origins where your web app runs:
   - `http://localhost:3000` (local dev example)
   - `https://app.yourdomain.com` (production example)
5. Add redirect URIs only if you plan to use the authorization-code flow. The Identity Services “One Tap / Sign In With Google” token flow used here does not require a redirect URI, but adding one does no harm.
6. Save. Copy the generated **Client ID**; you do **not** need the client secret for the token flow implemented here.

### 2. Backend Environment
Set the client ID in your API environment:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```
Restart the server after updating the env file.

### 3. Frontend Flow
Use the Google Identity Services SDK to obtain an ID token, then POST it to the API.

```html
<!-- index.html -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```js
// auth/google.ts
function handleGoogleResponse(credentialResponse) {
  const idToken = credentialResponse.credential;

  fetch('/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  })
    .then(async (res) => {
      if (!res.ok) throw await res.json();
      return res.json();
    })
    .then(({ data }) => {
      // data.user, data.token returned from API
      storeAuthToken(data.token);
      setCurrentUser(data.user);
    })
    .catch((err) => {
      console.error('Google sign-in failed', err);
    });
}

window.google.accounts.id.initialize({
  client_id: 'your-client-id.apps.googleusercontent.com',
  callback: handleGoogleResponse,
  auto_select: false
});

window.google.accounts.id.renderButton(
  document.getElementById('googleSignInButton'),
  { theme: 'outline', size: 'large' }
);
```

### 4. API Contract
- **Endpoint**: `POST /api/v1/auth/google`
- **Body**: `{ "idToken": "<google-id-token>" }`
- **Success (200)**: Same payload as email/password login (user profile + JWT). Newly created Google accounts are assigned the active `student` role and use it as their primary role.
- **Errors**:
  - `AUTH_1008` – token verification failed (wrong client ID, expired token, malformed request).
  - `AUTH_1009` – Google email not verified.
  - `AUTH_1010` – backend missing `GOOGLE_CLIENT_ID`.

### 5. Testing Tips
- Inspect the token at [jwt.io](https://jwt.io/) to ensure the `aud` claim matches your client ID.
- Clear cached sessions with `window.google.accounts.id.disableAutoSelect()` during dev.
- Use separate OAuth clients for dev and production to avoid cross-origin mismatches.
- Ensure the `student` role exists and is active in the database; Google sign-ups require it.

With these steps in place, the existing backend flow will automatically create or update users in MongoDB and return the standard authentication response.


