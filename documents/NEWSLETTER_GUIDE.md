# Newsletter System - Pre-Launch Guide

Complete guide for the pre-launch newsletter subscription system.

## 📧 Overview

The newsletter system allows visitors to subscribe to your pre-launch mailing list. Perfect for building an audience before your official launch!

## 🚀 Features

✅ Email subscription (with optional name)
✅ Unsubscribe functionality
✅ Duplicate email prevention
✅ Resubscribe capability
✅ Interest tracking
✅ Source tracking (website, landing-page, etc.)
✅ Metadata capture (IP, user agent, referrer)
✅ Admin dashboard stats
✅ Subscriber management (Admin only)
✅ Pagination support
✅ Growth tracking

## 📊 API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Subscribe to Newsletter
**POST** `/api/v1/newsletter/subscribe`

Subscribe a user to the pre-launch newsletter.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",              // Optional
  "interests": ["updates", "news"], // Optional
  "source": "website"               // Optional: website, landing-page, api, manual
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter! 🎉",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "status": "subscribed",
    "subscribedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Already Subscribed (200):**
```json
{
  "success": true,
  "message": "You are already subscribed to our newsletter!",
  "data": {
    "email": "user@example.com",
    "name": "John Doe",
    "status": "subscribed"
  }
}
```

#### 2. Unsubscribe from Newsletter
**POST** `/api/v1/newsletter/unsubscribe`

Unsubscribe a user from the newsletter.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter. We're sorry to see you go! 😢",
  "data": {
    "email": "user@example.com",
    "status": "unsubscribed",
    "unsubscribedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 3. Get Subscriber by Email
**GET** `/api/v1/newsletter/:email`

Get a specific subscriber's details.

**Example:**
```
GET /api/v1/newsletter/user@example.com
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscriber retrieved successfully",
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "subscribed",
    "source": "website",
    "interests": ["updates", "news"],
    "subscribedAt": "2024-01-01T12:00:00.000Z",
    "emailsSent": 0
  }
}
```

### Admin Endpoints (Authentication Required)

#### 4. Get All Subscribers
**GET** `/api/v1/newsletter`

Get paginated list of all subscribers (Admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `status` (optional): `subscribed` or `unsubscribed`
- `limit` (optional): Number of results per page (default: 50)
- `page` (optional): Page number (default: 1)

**Example:**
```
GET /api/v1/newsletter?status=subscribed&limit=20&page=1
```

**Response (200):**
```json
{
  "success": true,
  "count": 20,
  "total": 150,
  "stats": {
    "totalSubscribed": 145,
    "totalUnsubscribed": 5
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "hasMore": true
  },
  "data": [
    {
      "_id": "...",
      "email": "user1@example.com",
      "name": "User One",
      "status": "subscribed",
      "subscribedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### 5. Get Newsletter Statistics
**GET** `/api/v1/newsletter/stats`

Get newsletter statistics and analytics (Admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Newsletter statistics retrieved successfully",
  "data": {
    "overview": {
      "total": 150,
      "active": 145,
      "unsubscribed": 5,
      "growth7Days": 23
    },
    "bySource": [
      { "_id": "website", "count": 100 },
      { "_id": "landing-page", "count": 45 }
    ],
    "recentSubscribers": [
      {
        "email": "recent@example.com",
        "name": "Recent User",
        "subscribedAt": "2024-01-05T12:00:00.000Z"
      }
    ]
  }
}
```

#### 6. Delete Subscriber
**DELETE** `/api/v1/newsletter/:email`

Permanently delete a subscriber (Admin only).

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Example:**
```
DELETE /api/v1/newsletter/user@example.com
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscriber deleted successfully",
  "data": {}
}
```

## 💻 Frontend Integration Examples

### HTML Form

```html
<form id="newsletter-form">
  <input 
    type="email" 
    name="email" 
    placeholder="Enter your email" 
    required 
  />
  <input 
    type="text" 
    name="name" 
    placeholder="Your name (optional)" 
  />
  <button type="submit">Subscribe</button>
</form>

<script>
  document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      email: e.target.email.value,
      name: e.target.name.value,
      source: 'landing-page'
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        e.target.reset();
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    }
  });
</script>
```

### React Component

```jsx
import { useState } from 'react';

function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          source: 'website'
        })
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      if (data.success) {
        setEmail('');
        setName('');
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Join Our Pre-Launch List! 🚀</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
```

### cURL Examples

**Subscribe:**
```bash
curl -X POST http://localhost:5000/api/v1/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "source": "api"
  }'
```

**Unsubscribe:**
```bash
curl -X POST http://localhost:5000/api/v1/newsletter/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Get Stats (Admin):**
```bash
curl -X GET http://localhost:5000/api/v1/newsletter/stats \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## 📊 Database Schema

```javascript
{
  email: String (required, unique, indexed),
  name: String (optional),
  status: String (subscribed/unsubscribed),
  source: String (website/landing-page/api/manual),
  interests: [String],
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  subscribedAt: Date,
  unsubscribedAt: Date,
  lastEmailSent: Date,
  emailsSent: Number,
  isVerified: Boolean,
  timestamps: true (createdAt, updatedAt)
}
```

## 🎯 Use Cases

### 1. Pre-Launch Landing Page
Add a newsletter signup form to collect emails before launch.

### 2. Coming Soon Page
Show a "Notify me when live" form.

### 3. Beta Access
Collect interested users for beta testing.

### 4. Product Updates
Let users opt-in for product news and updates.

### 5. Early Bird Offers
Build a list for launch discounts and special offers.

## 🔒 Privacy & Compliance

- Store only necessary information
- Provide easy unsubscribe functionality
- Respect user preferences
- Add GDPR compliance if targeting EU users
- Consider adding double opt-in verification
- Include privacy policy link

## 📈 Analytics Tracking

The system tracks:
- Total subscribers
- Active vs unsubscribed
- Growth over time (7-day window)
- Subscription source (where they came from)
- Recent subscribers
- Emails sent count (for future email campaigns)

## 🚀 Next Steps

1. **Email Service Integration**
   - Integrate with SendGrid, Mailchimp, or AWS SES
   - Send welcome emails
   - Send launch notifications

2. **Double Opt-In**
   - Add email verification
   - Send confirmation emails

3. **Export Functionality**
   - Export subscribers to CSV
   - Integrate with email marketing tools

4. **Segmentation**
   - Group by interests
   - Create targeted campaigns

5. **A/B Testing**
   - Test different signup forms
   - Track conversion rates

## ⚠️ Important Notes

- The admin endpoints require JWT authentication with admin role
- Duplicate emails are handled gracefully (won't create duplicates)
- Unsubscribed users can resubscribe automatically
- All emails are stored in lowercase
- Metadata is captured automatically (IP, user agent, referrer)

## 🆘 Troubleshooting

**Issue: Email already exists**
- If subscribed: Returns success with existing data
- If unsubscribed: Automatically resubscribes

**Issue: Can't access admin endpoints**
- Make sure you're logged in as admin
- Include Bearer token in Authorization header

**Issue: Validation errors**
- Check email format is valid
- Ensure required fields are provided

## 📞 Support

For issues or questions, check:
- API Documentation: `/api-docs`
- Swagger UI: `http://localhost:5000/api-docs`
- Main README: `../README.md`





