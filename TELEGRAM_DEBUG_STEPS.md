# 🔧 Telegram Commands Debug Guide

## 🚨 Most Likely Issues

1. **Environment Variable Missing**: `TELEGRAM_BOT_TOKEN` not set in deployment
2. **Webhook Not Set**: Bot webhook not pointing to your domain
3. **HTTPS Required**: Telegram requires HTTPS for webhooks
4. **Wrong URL**: Webhook pointing to wrong endpoint

## 🎯 Quick Fix Steps

### 1. Check Bot Token (MOST IMPORTANT)
```bash
# Visit this URL to check status
https://your-domain.com/api/telegram/status
```

### 2. Set Environment Variable
In your deployment platform (Vercel/Netlify/etc):
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXTAUTH_URL=https://your-domain.com
```

### 3. Set Webhook URL
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
-H "Content-Type: application/json" \
-d '{"url":"https://your-domain.com/api/telegram/webhook"}'
```

## 🧪 Step-by-Step Debug Process

### Step 1: Check Basic Setup

1. **Verify your bot token is set**:
   ```bash
   # Check if environment variable is set
   echo $TELEGRAM_BOT_TOKEN
   ```

2. **Test the webhook endpoint**:
   ```bash
   curl https://your-domain.com/api/telegram/test
   ```

### Step 2: Test Webhook Reception

1. **Set webhook to test endpoint first**:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
   -H "Content-Type: application/json" \
   -d '{"url":"https://your-domain.com/api/telegram/test"}'
   ```

2. **Send a test message to your bot**
3. **Check server logs** for webhook reception

### Step 3: Switch to Real Webhook

1. **Set webhook to real endpoint**:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
   -H "Content-Type: application/json" \
   -d '{"url":"https://your-domain.com/api/telegram/webhook"}'
   ```

2. **Test commands**:
   - `/start`
   - `/help`
   - `/status`

### Step 4: Check Environment Variables

Make sure these are set in your deployment:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
NEXTAUTH_URL=https://your-domain.com

# Optional (for Vercel)
VERCEL_URL=your-vercel-url.vercel.app
```

## 🔍 Debug Commands

### Check Webhook Status
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Delete Webhook (if needed)
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Test API Endpoints Directly
```bash
# Test stats endpoint
curl https://your-domain.com/api/dashboard/stats

# Test reminders endpoint  
curl https://your-domain.com/api/reminders?limit=5&status=pending

# Test fleeting notes endpoint
curl -X POST https://your-domain.com/api/notes/fleeting \
-H "Content-Type: application/json" \
-d '{"content":"Test note","source":"telegram"}'
```

## 🐛 Common Issues & Solutions

### Issue 1: "Commands not responding"
**Cause**: Webhook not set or pointing to wrong URL
**Solution**: 
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
-H "Content-Type: application/json" \
-d '{"url":"https://your-domain.com/api/telegram/webhook"}'
```

### Issue 2: "API calls failing"
**Cause**: Environment variables not set
**Solution**: Set `TELEGRAM_BOT_TOKEN` and `NEXTAUTH_URL`

### Issue 3: "Internal server errors"
**Cause**: API endpoints returning errors
**Solution**: Check individual API endpoints work

### Issue 4: "Bot not responding at all"
**Cause**: Webhook URL not accessible
**Solution**: Verify your domain is accessible and HTTPS

## 🧪 Quick Test Script

Create this test in your browser console:

```javascript
// Test if webhook is working
fetch('/api/telegram/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: {
      text: '/start',
      chat: { id: 'test' }
    }
  })
}).then(r => r.json()).then(console.log);
```

## 📋 Checklist

- [ ] Bot token is set in environment variables
- [ ] Webhook URL is set correctly
- [ ] Webhook URL is accessible via HTTPS
- [ ] API endpoints work individually
- [ ] Server logs show webhook reception
- [ ] Commands return responses

## 🔧 Fixed Issues

✅ **Server-side API calls** - Now use full URLs with proper base URL detection
✅ **Error handling** - Added detailed logging for debugging
✅ **Environment detection** - Supports both local and production environments

## 🚀 Next Steps

1. **Set environment variables** in your deployment
2. **Update webhook URL** to point to your domain
3. **Test with `/start` command**
4. **Check server logs** for detailed debugging info

The webhook now has much better error handling and logging, so you should see detailed information about what's happening when you send commands.