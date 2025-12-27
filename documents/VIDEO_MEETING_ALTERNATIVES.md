# Video Meeting & Calendar Integration Alternatives

This document outlines alternatives to Google Meet/Calendar for creating video meeting links and managing calendar events in your application.

## Video Conferencing APIs

### 1. **Zoom API** ⭐ Most Popular
**Best for:** Enterprise applications, high-quality video, large meetings

**Pros:**
- ✅ Robust API with excellent documentation
- ✅ Supports up to 1000 participants (paid plans)
- ✅ Recording capabilities
- ✅ Waiting rooms, breakout rooms
- ✅ Works with personal and business accounts
- ✅ Good mobile SDK support

**Cons:**
- ❌ Requires Zoom account (free tier available)
- ❌ More complex setup than Google Meet
- ❌ Pricing can get expensive at scale

**API Features:**
- Create instant or scheduled meetings
- Generate meeting links programmatically
- Manage participants
- Calendar integration (iCal format)
- Webhooks for meeting events

**Setup:**
```javascript
// Example: Create Zoom meeting
const zoom = require('@zoomus/websdk');
// Requires OAuth or JWT authentication
```

**Pricing:** Free tier (40 min limit), paid from $14.99/user/month

---

### 2. **Microsoft Teams API**
**Best for:** Organizations using Microsoft 365

**Pros:**
- ✅ Deep integration with Outlook Calendar
- ✅ Works with Microsoft 365 accounts
- ✅ Good for enterprise environments
- ✅ Recording and transcription included

**Cons:**
- ❌ Requires Microsoft 365 subscription
- ❌ More complex authentication (Azure AD)
- ❌ Less suitable for personal accounts

**API Features:**
- Create online meetings
- Calendar integration via Graph API
- Manage meeting participants
- Recording and transcripts

**Setup:**
```javascript
// Microsoft Graph API
const { Client } = require('@microsoft/microsoft-graph-client');
// Requires Azure AD app registration
```

**Pricing:** Included with Microsoft 365 subscriptions

---

### 3. **Jitsi Meet** ⭐ Open Source
**Best for:** Self-hosted solutions, privacy-focused apps

**Pros:**
- ✅ **Completely free and open source**
- ✅ No account required
- ✅ Can be self-hosted
- ✅ Privacy-focused (no data collection)
- ✅ Simple API

**Cons:**
- ❌ Requires self-hosting for production
- ❌ Less polished than commercial solutions
- ❌ Limited features compared to Zoom/Teams
- ❌ No built-in calendar integration

**API Features:**
- Generate meeting room URLs
- Custom room names
- Embeddable video player
- Basic recording (self-hosted)

**Setup:**
```javascript
// Simple URL generation
const roomName = `meeting-${Date.now()}`;
const jitsiUrl = `https://meet.jit.si/${roomName}`;
// Or self-host: `https://your-domain.com/${roomName}`
```

**Pricing:** Free (self-hosted) or use public instance (meet.jit.si)

---

### 4. **Daily.co**
**Best for:** Developer-friendly video infrastructure

**Pros:**
- ✅ Developer-first API
- ✅ Excellent documentation
- ✅ Flexible pricing (pay per minute)
- ✅ High-quality video/audio
- ✅ Easy to integrate
- ✅ Recording and streaming

**Cons:**
- ❌ Pay-per-use pricing (can add up)
- ❌ No built-in calendar integration
- ❌ Less brand recognition

**API Features:**
- Create rooms programmatically
- Token-based authentication
- Recording and streaming
- Screen sharing, chat

**Setup:**
```javascript
const daily = require('@daily-co/daily-js');
// REST API or SDK
```

**Pricing:** Free tier (2 hours/day), then $0.0015/minute

---

### 5. **Whereby (formerly appear.in)**
**Best for:** Simple, embeddable meetings

**Pros:**
- ✅ Very simple API
- ✅ Embeddable rooms
- ✅ Good free tier
- ✅ No downloads required

**Cons:**
- ❌ Limited features
- ❌ Smaller company (less support)
- ❌ No calendar integration

**API Features:**
- Create meeting rooms
- Custom room URLs
- Embeddable player

**Pricing:** Free tier available, paid from $9.99/month

---

### 6. **Twilio Video**
**Best for:** Custom video experiences, full control

**Pros:**
- ✅ Highly customizable
- ✅ Programmable video infrastructure
- ✅ Excellent for custom UIs
- ✅ Global infrastructure

**Cons:**
- ❌ More complex to implement
- ❌ Requires building your own UI
- ❌ Pay-per-minute pricing
- ❌ No calendar integration

**API Features:**
- Create video rooms
- Full control over participants
- Recording and composition
- Screen sharing

**Pricing:** $0.004/participant/minute

---

### 7. **Agora.io**
**Best for:** Real-time engagement, large scale

**Pros:**
- ✅ High scalability
- ✅ Low latency
- ✅ Good for live streaming
- ✅ Global network

**Cons:**
- ❌ Complex setup
- ❌ Requires custom UI development
- ❌ Pricing can be complex

**API Features:**
- Real-time video/audio
- Interactive whiteboard
- Cloud recording
- Analytics

**Pricing:** Free tier (10,000 minutes/month), then pay-per-use

---

## Calendar Integration Alternatives

### 1. **iCal/CalDAV** ⭐ Standard Protocol
**Best for:** Cross-platform calendar support

**Pros:**
- ✅ Works with all major calendars (Google, Outlook, Apple, etc.)
- ✅ Standard protocol (RFC 5545)
- ✅ No API keys needed
- ✅ Simple to implement

**Cons:**
- ❌ No video link generation
- ❌ One-way (create events, can't read)

**Implementation:**
```javascript
// Generate .ics file
const ics = require('ics');
// Creates calendar invite file
// Users import into their calendar
```

---

### 2. **Outlook Calendar API (Microsoft Graph)**
**Best for:** Microsoft 365 users

**Pros:**
- ✅ Full calendar integration
- ✅ Can create Teams meetings
- ✅ Read/write access
- ✅ Good for enterprise

**Cons:**
- ❌ Requires Microsoft 365
- ❌ Complex authentication

---

### 3. **Apple Calendar (CalDAV)**
**Best for:** iOS/macOS users

**Pros:**
- ✅ Native iOS/macOS support
- ✅ Standard CalDAV protocol

**Cons:**
- ❌ Limited API access
- ❌ Mostly read-only

---

## Recommended Solutions by Use Case

### **For Personal Gmail Accounts (Current Need)**
1. **Google Meet (OAuth)** - What you're implementing ✅
2. **Jitsi Meet** - Free, no auth needed
3. **Zoom** - Free tier available

### **For Enterprise/Organizations**
1. **Microsoft Teams** - If using Microsoft 365
2. **Zoom** - Most popular enterprise solution
3. **Google Workspace** - If using Google Workspace

### **For Privacy/Self-Hosted**
1. **Jitsi Meet** - Open source, self-hosted
2. **BigBlueButton** - Open source, education-focused

### **For Simple Integration**
1. **Jitsi Meet** - Just generate URLs
2. **Whereby** - Simple API
3. **Daily.co** - Developer-friendly

### **For Custom Experiences**
1. **Twilio Video** - Full control
2. **Agora.io** - High customization
3. **Daily.co** - Flexible API

---

## Hybrid Approach: Video + Calendar

You can combine different services:

### Option 1: Jitsi Meet + iCal
- Generate Jitsi meeting URL
- Create iCal event with meeting link
- Users import into their calendar
- **Pros:** Free, works everywhere
- **Cons:** No automatic calendar sync

### Option 2: Zoom + Google Calendar API
- Create Zoom meeting via API
- Add to Google Calendar via API
- **Pros:** Best of both worlds
- **Cons:** More complex, requires both accounts

### Option 3: Daily.co + iCal
- Create Daily.co room
- Generate iCal invite
- **Pros:** High-quality video, simple calendar
- **Cons:** Pay-per-use for Daily.co

---

## Quick Comparison Table

| Service | Free Tier | Auth Required | Calendar Integration | Self-Hosted | Best For |
|---------|-----------|---------------|---------------------|-------------|----------|
| **Google Meet** | ✅ | OAuth | ✅ Native | ❌ | Personal Gmail |
| **Zoom** | ✅ (40min) | Account | ✅ iCal | ❌ | Enterprise |
| **Jitsi Meet** | ✅ | ❌ | ❌ (iCal manual) | ✅ | Privacy/Self-host |
| **Daily.co** | ✅ (2hr/day) | API Key | ❌ (iCal manual) | ❌ | Developers |
| **Microsoft Teams** | ❌ | M365 | ✅ Native | ❌ | M365 Orgs |
| **Whereby** | ✅ | Account | ❌ | ❌ | Simple |
| **Twilio Video** | ✅ (trial) | API Key | ❌ | ❌ | Custom |

---

## Recommendation for Your Use Case

Given that you need:
- ✅ Works with personal Gmail accounts
- ✅ No Google Workspace required
- ✅ Calendar integration
- ✅ Automatic meeting link creation

**Best Options:**
1. **Google Meet (OAuth)** - What you're building ✅ (best fit)
2. **Zoom API** - Good alternative, free tier available
3. **Jitsi Meet + iCal** - Free, but manual calendar import

**If Google OAuth becomes problematic:**
- **Zoom** is the most reliable alternative
- **Jitsi Meet** is the simplest free alternative (but no auto-calendar)

---

## Implementation Example: Jitsi Meet Alternative

If you want to add Jitsi as a fallback:

```javascript
// src/utils/jitsiMeet.js
const generateJitsiMeetLink = (title, startTime) => {
  // Generate unique room name
  const roomName = `skyprep-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const meetingUrl = `https://meet.jit.si/${roomName}`;
  
  return {
    meetingLink: meetingUrl,
    roomName: roomName
  };
};

// Generate iCal event
const generateICalEvent = (title, description, startTime, endTime, meetingUrl) => {
  const ics = require('ics');
  const event = {
    start: [startTime.getFullYear(), startTime.getMonth() + 1, startTime.getDate(), 
            startTime.getHours(), startTime.getMinutes()],
    end: [endTime.getFullYear(), endTime.getMonth() + 1, endTime.getDate(),
          endTime.getHours(), endTime.getMinutes()],
    title: title,
    description: `${description}\n\nMeeting Link: ${meetingUrl}`,
    url: meetingUrl,
    status: 'CONFIRMED',
    busyStatus: 'BUSY'
  };
  
  return ics.createEvent(event);
};
```

---

## Next Steps

1. **Continue with Google Meet OAuth** (recommended for your use case)
2. **Add Jitsi as fallback** if OAuth fails
3. **Consider Zoom** if you need more features later

Would you like me to implement any of these alternatives?

