# Telegram Notification Debug Guide

## How to Test and Debug Telegram Notifications

### 🧪 **Testing Steps**

1. **Open Browser Console** (F12 → Console tab)
2. **Go to Unified Dashboard** → Notifications tab
3. **Click "Test Telegram Integration"** button
4. **Watch the detailed console logs**

### 📋 **What the Logs Will Show You**

#### **NotificationService Logs** (🔵 prefix)
```
🔵 [TELEGRAM] Starting Telegram notification process...
🔵 [TELEGRAM] Notification data: { title, message, type, timestamp }
🔵 [TELEGRAM] Browser environment detected, importing TelegramService...
🟢 [TELEGRAM] TelegramService imported successfully
🔵 [TELEGRAM] Service configuration status: { configured, hasBotToken, hasChatId }
🔵 [TELEGRAM] Prepared message: 🔔 *Test Title*\n\nTest message
🔵 [TELEGRAM] Attempting to send message...
```

#### **TelegramService Logs** (🟦 prefix)
```
🟦 [TELEGRAM SERVICE] sendMessage() called
🟦 [TELEGRAM SERVICE] Input message: "🔔 *Test Title*..."
🟦 [TELEGRAM SERVICE] Converting string to TelegramMessage object
🟦 [TELEGRAM SERVICE] Final message object: { text: "..." }
🟦 [TELEGRAM SERVICE] Current config: { hasConfig, hasBotToken, hasChatId, botTokenPreview, chatId }
```

### 🔍 **Common Issues and Solutions**

#### **Issue 1: "Telegram not configured"**
**Logs you'll see:**
```
🟡 [TELEGRAM SERVICE] ⚠️ Telegram not configured!
🟡 [TELEGRAM SERVICE] Message that would be sent: ...
🟡 [TELEGRAM SERVICE] To configure Telegram:
🟡 [TELEGRAM SERVICE] 1. Get bot token from @BotFather
🟡 [TELEGRAM SERVICE] 2. Get your chat ID
🟡 [TELEGRAM SERVICE] 3. Call telegramService.configure(...)
```

**Solution:**
```javascript
// In browser console:
import { telegramService } from '@/services/TelegramService';

// Configure with your bot token and chat ID
telegramService.quickSetup('YOUR_BOT_TOKEN', 'YOUR_CHAT_ID');
```

#### **Issue 2: "Telegram notifications disabled in preferences"**
**Logs you'll see:**
```
🟡 [NOTIFICATION] Telegram notifications disabled in preferences
```

**Solution:**
```javascript
// In browser console:
import { notificationService } from '@/services/NotificationService';

// Enable Telegram notifications
notificationService.enableTelegramNotifications();
```

#### **Issue 3: Import/Module errors**
**Logs you'll see:**
```
🔴 [TELEGRAM] ❌ Error in Telegram notification process:
🔴 [TELEGRAM] Error type: TypeError
🔴 [TELEGRAM] Error message: Cannot resolve module...
```

**Solution:** This indicates a build/import issue. The service files need to be properly built.

### 🛠 **Manual Testing Commands**

Open browser console and run these commands:

#### **1. Check Current Status**
```javascript
// Import services
const { notificationService } = await import('/src/services/NotificationService.ts');
const { telegramService } = await import('/src/services/TelegramService.ts');

// Check status
console.log('Notification preferences:', notificationService.getPreferences());
console.log('Telegram config:', telegramService.getConfigStatus());
```

#### **2. Configure Telegram (if needed)**
```javascript
// Get your bot token from @BotFather on Telegram
// Get your chat ID by messaging your bot and checking updates
const { telegramService } = await import('/src/services/TelegramService.ts');

telegramService.quickSetup('YOUR_BOT_TOKEN_HERE', 'YOUR_CHAT_ID_HERE');
```

#### **3. Enable Telegram Notifications**
```javascript
const { notificationService } = await import('/src/services/NotificationService.ts');

notificationService.enableTelegramNotifications();
```

#### **4. Send Test Message**
```javascript
const { telegramService } = await import('/src/services/TelegramService.ts');

// Send direct test message
await telegramService.sendTestMessage();
```

#### **5. Create Test Notification**
```javascript
const { notificationService } = await import('/src/services/NotificationService.ts');

// This will trigger all notification channels including Telegram
await notificationService.createNotification({
  title: 'Manual Test',
  message: 'Testing Telegram from console!',
  type: 'info'
});
```

### 📊 **Expected Success Flow**

When everything works correctly, you should see:

```
🔵 [NOTIFICATION] Telegram notifications enabled in preferences
🔵 [TELEGRAM] Starting Telegram notification process...
🔵 [TELEGRAM] Browser environment detected, importing TelegramService...
🟢 [TELEGRAM] TelegramService imported successfully
🔵 [TELEGRAM] Service configuration status: { configured: true, hasBotToken: true, hasChatId: true }
🔵 [TELEGRAM] Prepared message: 🔔 *Telegram Test*...
🔵 [TELEGRAM] Attempting to send message...
🟦 [TELEGRAM SERVICE] sendMessage() called
🟦 [TELEGRAM SERVICE] Configuration found, preparing to send message...
🟦 [TELEGRAM SERVICE] Simulating Telegram Bot API call...
🟦 [TELEGRAM SERVICE] API URL would be: https://api.telegram.org/bot...
🟦 [TELEGRAM SERVICE] Simulating network delay...
🟢 [TELEGRAM SERVICE] ✅ Message sent successfully (simulated)!
🟢 [TELEGRAM] ✅ Telegram notification sent successfully!
```

### 🔧 **Real Telegram Integration**

Currently, the service simulates sending messages. To implement real Telegram integration:

1. **Replace the simulation** in `TelegramService.sendMessage()` with actual Bot API calls:

```javascript
// Replace this simulation:
console.log('🟦 [TELEGRAM SERVICE] Simulating Telegram Bot API call...');

// With actual API call:
const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: messageData.chatId,
    text: messageData.text,
    parse_mode: messageData.parseMode
  })
});

if (!response.ok) {
  throw new Error(`Telegram API error: ${response.status}`);
}
```

### 🎯 **Quick Test Checklist**

- [ ] Open browser console
- [ ] Click "Test Telegram Integration" button
- [ ] Check for 🔵 and 🟦 log messages
- [ ] If "not configured" → use `telegramService.quickSetup()`
- [ ] If "disabled in preferences" → use `notificationService.enableTelegramNotifications()`
- [ ] Look for final success message: 🟢 ✅ Telegram notification sent successfully!

### 📞 **Getting Help**

If you see any errors not covered here:

1. **Copy the full error logs** from console
2. **Note which step failed** (import, config, sending)
3. **Check if it's a configuration issue** (missing bot token/chat ID)
4. **Verify the service files are properly built**

The detailed logging will show you exactly where the process fails and what needs to be fixed!