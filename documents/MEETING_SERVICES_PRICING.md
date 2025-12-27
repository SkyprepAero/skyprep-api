# Meeting Services Pricing & Free Tier Comparison

## Quick Summary

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| **Jitsi Meet** | ✅ **100% Free** | N/A | Your use case |
| **Google Meet** | ✅ **Free** (with limits) | Google Workspace ($6+/user) | Calendar integration |
| **Zoom** | ✅ Free (40 min) | $14.99/user/month | Enterprise |
| **Daily.co** | ✅ 2 hours/day | $0.0015/minute | Developers |

---

## 1. Jitsi Meet ⭐ **100% FREE**

### Free Tier
- ✅ **Unlimited meetings**
- ✅ **Unlimited duration**
- ✅ **Unlimited participants**
- ✅ **No account required**
- ✅ **No API keys needed**
- ✅ **No credit card required**
- ✅ **Open source** (can self-host)

### What You Get
- Generate meeting links instantly
- No time limits
- No participant limits
- Works with any email (personal or business)
- No authentication needed

### Limitations
- Uses public instance: `meet.jit.si` (shared infrastructure)
- No calendar integration (but you can add links manually)
- Basic features only

### Self-Hosting Option
- **Cost:** Free (just server costs)
- **Control:** Full control over your instance
- **Privacy:** All data stays on your server
- **Server Cost:** ~$5-20/month for small-medium usage

### **Total Cost: $0** ✅

---

## 2. Google Meet (OAuth)

### Free Tier (Personal Gmail)
- ✅ **Unlimited meetings**
- ✅ **Up to 100 participants**
- ✅ **60 minutes per meeting** (for groups of 3+)
- ✅ **24 hours** for 1-on-1 meetings
- ✅ **Calendar integration** (automatic)
- ✅ **Recording** (limited)
- ✅ **No credit card required**

### What You Get
- Automatic calendar event creation
- Email invites sent automatically
- Works with personal Gmail accounts
- No Google Workspace needed

### Limitations
- 60-minute limit for group meetings (3+ people)
- 1-on-1 meetings can be 24 hours
- Requires OAuth authorization (one-time setup)

### Paid Option: Google Workspace
- **Starter:** $6/user/month
- **Business:** $12/user/month
- **Enterprise:** $18/user/month
- **Benefits:** Longer meetings, more features, better support

### **Total Cost: $0** (for your use case) ✅

---

## 3. Zoom

### Free Tier
- ✅ **Unlimited 1-on-1 meetings**
- ✅ **Group meetings:** Up to 100 participants
- ✅ **Time limit:** 40 minutes per meeting
- ✅ **No credit card required**

### What You Get
- High-quality video/audio
- Screen sharing
- Recording (local)
- Waiting rooms
- Breakout rooms (limited)

### Limitations
- **40-minute time limit** (then meeting ends)
- No cloud recording on free tier
- Limited features

### Paid Plans
- **Pro:** $14.99/user/month
  - 24-hour meetings
  - Cloud recording
  - Advanced features
- **Business:** $19.99/user/month
- **Enterprise:** Custom pricing

### **Total Cost: $0** (free tier) or **$14.99/user/month** (if you need longer meetings)

---

## 4. Daily.co

### Free Tier
- ✅ **2 hours per day** total
- ✅ **Unlimited meetings**
- ✅ **Up to 50 participants**
- ✅ **No credit card required** (for free tier)

### What You Get
- High-quality video
- Developer-friendly API
- Good documentation
- Recording available

### Limitations
- 2 hours/day limit (across all meetings)
- After free tier: Pay per minute

### Paid Plans
- **Pay-as-you-go:** $0.0015 per participant per minute
- **Example:** 10 participants × 60 minutes = $0.90 per meeting
- **Monthly plans:** Available for higher usage

### **Total Cost: $0** (if under 2 hours/day) or **~$0.0015/minute** (after free tier)

---

## 5. Microsoft Teams

### Free Tier
- ✅ **Unlimited meetings**
- ✅ **Up to 100 participants**
- ✅ **60 minutes per meeting**
- ✅ **No credit card required**

### What You Get
- Calendar integration (if using Outlook)
- Recording
- Screen sharing
- Chat

### Limitations
- Requires Microsoft account
- 60-minute limit
- Limited features on free tier

### Paid Plans
- **Microsoft 365:** $6.99/user/month (Personal)
- **Microsoft 365 Business:** $6/user/month
- **Microsoft 365 Enterprise:** $12/user/month

### **Total Cost: $0** (free tier) or **$6.99+/user/month** (if using Microsoft 365)

---

## Cost Comparison for Your Use Case

### Scenario: 100 sessions/month, 1 hour each

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Jitsi Meet** | **$0** | ✅ Best option |
| **Google Meet** | **$0** | ✅ Works great |
| **Zoom** | **$0** | ⚠️ 40 min limit (meetings cut off) |
| **Daily.co** | **$0** | ✅ If under 2 hours/day total |
| **Microsoft Teams** | **$0** | ⚠️ 60 min limit |

### Scenario: 500 sessions/month, 1 hour each

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Jitsi Meet** | **$0** | ✅ Still free |
| **Google Meet** | **$0** | ✅ Still free |
| **Zoom** | **$0** | ⚠️ 40 min limit |
| **Daily.co** | **~$45** | 500 × 1hr × $0.0015/min = $45 |
| **Microsoft Teams** | **$0** | ⚠️ 60 min limit |

---

## Recommended Setup for Your App

### Option 1: **Jitsi Meet Only** (Simplest)
- **Cost:** $0
- **Setup:** Just generate URLs
- **Limits:** None
- **Best for:** Maximum simplicity

### Option 2: **Google Meet + Jitsi Fallback** (Current Implementation) ⭐
- **Cost:** $0
- **Setup:** OAuth for Google (optional)
- **Limits:** 60 min for groups (but 1-on-1 can be 24 hours)
- **Best for:** Calendar integration + reliability

### Option 3: **Jitsi Self-Hosted**
- **Cost:** ~$5-20/month (server)
- **Setup:** Deploy Jitsi on your server
- **Limits:** None (your server capacity)
- **Best for:** Privacy/control

---

## Free Tier Details

### Jitsi Meet (Public Instance)
```
✅ Unlimited meetings
✅ Unlimited duration
✅ Unlimited participants
✅ No account needed
✅ No API keys
✅ No credit card
✅ No time limits
✅ No participant limits
```

### Google Meet (Personal Gmail)
```
✅ Unlimited meetings
✅ 1-on-1: 24 hours duration
✅ Groups (3+): 60 minutes duration
✅ Up to 100 participants
✅ Calendar integration
✅ Email invites
✅ No credit card needed
```

### Zoom (Free Tier)
```
✅ Unlimited 1-on-1 meetings
✅ Group meetings: Up to 100 participants
⚠️ 40-minute time limit (then meeting ends)
✅ No credit card needed
```

### Daily.co (Free Tier)
```
✅ 2 hours per day (total across all meetings)
✅ Up to 50 participants
✅ Unlimited meetings
✅ No credit card needed
⚠️ After 2 hours/day: Pay per minute
```

---

## Cost Breakdown for Your Implementation

### Current Setup: Google Meet + Jitsi Fallback

**Monthly Cost: $0** ✅

**What you get:**
- ✅ Google Meet (if teacher has OAuth)
  - Calendar integration
  - Email invites
  - 60 min limit for groups (24 hours for 1-on-1)
- ✅ Jitsi Meet (fallback)
  - No limits
  - Always works
  - No auth needed

**No hidden costs, no credit card required!**

---

## When You Might Need to Pay

### Google Meet
- ❌ **Never** (for your use case)
- Personal Gmail accounts are free
- Only pay if you want Google Workspace features

### Jitsi Meet
- ❌ **Never** (using public instance)
- Only pay if you self-host (server costs)

### Zoom
- ⚠️ **Only if** you need meetings longer than 40 minutes
- Free tier is fine for most use cases

### Daily.co
- ⚠️ **Only if** you exceed 2 hours/day total
- Unlikely for your use case

---

## Recommendation

### **Stick with Current Setup: Google Meet + Jitsi Fallback**

**Why:**
1. ✅ **$0 cost** - completely free
2. ✅ **Reliable** - always returns a working link
3. ✅ **Calendar integration** - when Google OAuth is available
4. ✅ **No limits** - Jitsi has no time/participant limits
5. ✅ **No credit card** - no payment setup needed

**Total Monthly Cost: $0** 🎉

---

## Summary

| Service | Free Tier | Paid Starts At | Your Cost |
|---------|-----------|----------------|-----------|
| **Jitsi Meet** | ✅ Everything free | N/A | **$0** |
| **Google Meet** | ✅ Free (with limits) | $6/user (Workspace) | **$0** |
| **Zoom** | ✅ Free (40 min) | $14.99/user | **$0** |
| **Daily.co** | ✅ 2 hrs/day | $0.0015/min | **$0** |

**Bottom Line:** Your current implementation costs **$0** and will likely stay that way! 🎉

