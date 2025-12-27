# Environment Variables Setup for Meeting Links (Jitsi Meet Only)

## Environment Variables

### Jitsi Meet - **Optional**

```env
# Only needed if you want to use a custom Jitsi instance
# Leave empty to use public instance: meet.jit.si (recommended - no setup needed)
JITSI_DOMAIN=
```

**Default:** If not set, uses `meet.jit.si` (public instance - works perfectly!)

**When to set:** Only if you want to self-host Jitsi on your own domain

---

## What Happens Without This Variable?

### Without `JITSI_DOMAIN`:
- ✅ **Works perfectly** - uses public `meet.jit.si` instance
- ✅ **No setup needed** - just works out of the box
- ✅ **No authentication required**
- ✅ **No API keys needed**

---

## Setup

### Minimum Setup

**No environment variables needed!** ✅

The system automatically uses Jitsi Meet for all meetings. Just start your server and it works!

### Custom Jitsi Instance (Optional)

If you want to self-host Jitsi:

```env
JITSI_DOMAIN=meet.yourdomain.com
```

**Benefits of self-hosting:**
- Full control over your instance
- Custom branding
- Better privacy
- No dependency on public instance

**Cost:** Just server hosting (~$5-20/month)

---

## Quick Checklist

- [ ] (Optional) Add `JITSI_DOMAIN` if using custom Jitsi instance
- [ ] That's it! No other setup needed ✅

---

## Testing

### Test Jitsi (no env vars needed):
```bash
# Just works - no setup!
curl http://localhost:4000/api/v1/sessions/.../accept
# Returns Jitsi link automatically
# Example: https://meet.jit.si/skyprep-1234567890-abc123
```

---

## Summary

**Setup:** No environment variables needed! ✅  
**Optional:** Add `JITSI_DOMAIN` only if self-hosting  
**Cost:** $0 (using public instance)  
**Authentication:** None required  
**API Keys:** None required  

**Bottom Line:** It just works! 🎉

