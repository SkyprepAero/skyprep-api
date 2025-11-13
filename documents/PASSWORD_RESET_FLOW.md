# Password Reset Flow (Email Passcode)

This document outlines the API endpoints, responses, and frontend integration required for the passcode-based password reset experience.

---

## Overview

1. **Request Passcode**  
   `POST /api/v1/auth/forgot-password`  
   — Accepts the user’s email.  
   — Always responds with success to avoid account enumeration.  
   — If the email exists, it sends a numeric passcode via email (purpose `password_reset`).

2. **Verify Passcode**  
   `POST /api/v1/auth/forgot-password/verify`  
   — Accepts email and passcode.  
   — Validates and consumes the passcode.  
   — Returns a short-lived reset token (`resetToken`) that authorises the actual password change.

3. **Reset Password**  
   `POST /api/v1/auth/forgot-password/reset`  
   — Accepts the reset token and a new password.  
   — Updates the user’s password and issues a fresh JWT (revoking previous sessions).

Passcodes are reused from the existing `EmailPasscode` system with purpose `password_reset`, hashed storage, TTL expiry, and attempt limits.

---

## Endpoints

### 1. Request Passcode

- **Route:** `POST /api/v1/auth/forgot-password`
- **Body:**
  ```json
  { "email": "user@example.com" }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset instructions sent if the email exists",
    "data": {
      "requiresPasscode": true,
      "verification": {
        "purpose": "password_reset",
        "email": "user@example.com",
        "expiresAt": "2025-11-13T10:05:00.000Z",
        "resendAvailableAt": "2025-11-13T09:56:00.000Z"
      }
    }
  }
  ```
  > When the email is unknown, `expiresAt` and `resendAvailableAt` will be `null` and no email is sent.

### 2. Verify Passcode

- **Route:** `POST /api/v1/auth/forgot-password/verify`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "passcode": "123456"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verification successful. You can now reset your password.",
    "data": {
      "email": "user@example.com",
      "resetToken": "short-lived-reset-token",
      "resetTokenExpiresAt": "2025-11-13T10:10:00.000Z"
    }
  }
  ```

### 3. Reset Password

- **Route:** `POST /api/v1/auth/forgot-password/reset`
- **Body:**
  ```json
  {
    "resetToken": "short-lived-reset-token",
    "newPassword": "NewStrongPassword!23"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password reset successful",
    "data": {
      "user": { /* full profile */ },
      "token": "jwt-token",
      "tokenExpiresAt": "2025-11-13T11:00:00.000Z"
    }
  }
  ```

---

## Email Template

- Template path: `templates/emails/password-reset/passcode.hbs`
- Subject: “Reset your password”
- Message highlights:
  - Informs the user a password reset was requested.
  - Displays the passcode prominently.
  - Warns against sharing the code.
  - Notes that ignoring the email keeps the password unchanged.

The template shares styling conventions with the verification email but uses reset-specific copy.

---

## Validation Rules

- Email fields are normalized and must be valid addresses.
- Passcode must be numeric and exactly `EMAIL_PASSCODE_LENGTH` digits (default: 6).
- Reset token is required for the final step and is valid only if it matches the latest token stored for the user.
- New password must satisfy `VALIDATION.PASSWORD_MIN_LENGTH` (default: 6) and not exceed `VALIDATION.PASSWORD_MAX_LENGTH`.

---

## Frontend Integration Notes

1. **Request Screen**
   - Collect the email and call `/forgot-password`.
   - Regardless of account existence, show a “check your email” confirmation.
   - Use the response to drive timers for passcode expiry/resend.

2. **Verification Screen**
   - Display countdown based on `expiresAt`.
   - Allow resend by calling `/forgot-password` again (respect `resendAvailableAt` cooldown).
   - Submit passcode to `/forgot-password/verify` and retrieve the reset token.

3. **Reset Screen**
   - Collect the new password.
   - Submit `resetToken` and the new password to `/forgot-password/reset`.
   - On success, store the returned JWT and redirect to the authenticated area.

3. **Error Handling**
   - Map error codes (e.g., `PASC_10005`, `PASC_10002`, `PASC_10003`, `PASC_10004`) to friendly UI messages as already done for login passcodes.
   - `AUTH_1011` doesn’t surface here because a fresh session is issued immediately after the password update.

---

## Security Considerations

- Passcodes expire after `EMAIL_PASSCODE_EXPIRY_MINUTES` and respect `EMAIL_PASSCODE_MAX_ATTEMPTS`.
- Passcode verification rotates a `passwordResetNonce`; only the latest reset token is honoured.
- Any successful reset issues a new session nonce—older tokens are revoked.
- Emails contain guidance to ignore the message if the reset wasn’t requested.
- The “email exists” status is never leaked; the response is uniform.

---

## Testing Checklist

- Request reset for a valid email → code sent, cooldown enforced, metadata returned.
- Request reset for an unknown email → receive generic success, no DB entry created for user, but flow remains consistent.
- Submit valid passcode → receive reset token.
- Use reset token and new password → password updates, new JWT returned, old tokens fail with `AUTH_1011`.
- Submit invalid/expired passcode → appropriate passcode error codes returned.
- Resend within cooldown → receive `PASC_10006`.
- Ensure password hashing still applies (login with new password succeeds).

---

For further adjustments (e.g., multi-factor reset flow, reset via deep links), coordinate with the backend team.



