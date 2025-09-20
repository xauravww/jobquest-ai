import { NextRequest, NextResponse } from 'next/server';
import { telegramService } from '@/services/TelegramService';
import { getBotTokenFromDB, getUserByTelegramChatId } from '@/lib/telegram-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🟦 [TELEGRAM WEBHOOK] Received webhook:', JSON.stringify(body, null, 2));
    
    // Get bot token from database
    const botToken = await getBotTokenFromDB();
    if (!botToken) {
      console.log('🟡 [TELEGRAM WEBHOOK] No bot token found in database');
      return NextResponse.json({ error: 'Bot not configured' }, { status: 400 });
    }

    // Log environment info for debugging
    console.log('🟦 [TELEGRAM WEBHOOK] Environment:', {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
      hasBotToken: !!botToken
    });

    // Handle callback queries (inline keyboard button presses)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const callbackData = callbackQuery.data;
      const messageId = callbackQuery.message?.message_id;
      const chatId = callbackQuery.message?.chat?.id;

      console.log('🟦 [TELEGRAM WEBHOOK] Processing callback query:', {
        callbackData,
        messageId,
        chatId
      });

      // Verify user exists for this chat ID
      const user = await getUserByTelegramChatId(chatId?.toString());
      if (!user) {
        console.log('🟡 [TELEGRAM WEBHOOK] No user found for chat ID:', chatId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Handle the callback
      const response = await telegramService.handleCallbackQuery(callbackData, messageId?.toString());

      // Send response back to user using bot token from DB
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: response,
          parse_mode: 'Markdown'
        })
      });

      // Answer the callback query to remove loading state
      await answerCallbackQuery(callbackQuery.id, 'Action processed!', botToken);

      return NextResponse.json({ success: true, message: 'Callback processed' });
    }

    // Handle regular messages
    if (body.message) {
      const message = body.message;
      const text = message.text;
      const chatId = message.chat.id;

      console.log('🟦 [TELEGRAM WEBHOOK] Processing message:', {
        text,
        chatId
      });

      // Verify user exists for this chat ID
      const user = await getUserByTelegramChatId(chatId?.toString());
      if (!user) {
        console.log('🟡 [TELEGRAM WEBHOOK] No user found for chat ID:', chatId);
        // Send a helpful message to the user
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '❌ Your Telegram account is not linked to JobQuest AI. Please configure Telegram in your settings first.',
            parse_mode: 'Markdown'
          })
        });
        return NextResponse.json({ success: true, message: 'User not configured' });
      }

      // Handle commands and text inputs
      if (text) {
        let response: string | null = null;
        
        // Check if it's a command (starts with /)
        if (text.startsWith('/')) {
          response = await handleCommand(text, chatId.toString(), user);
        } else {
          // Handle special text formats (fleeting:, reminder:, etc.)
          response = await handleTextMessage(text, chatId.toString(), user);
        }
        
        if (response) {
          console.log('🟦 [TELEGRAM WEBHOOK] Sending response:', response.substring(0, 100) + '...');
          
          // Send response directly via Telegram API using bot token from DB
          const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          
          const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: response,
              parse_mode: 'Markdown'
            })
          });
          
          console.log('🟦 [TELEGRAM WEBHOOK] Telegram API response status:', telegramResponse.status);
          
          if (!telegramResponse.ok) {
            const errorText = await telegramResponse.text();
            console.error('🔴 [TELEGRAM WEBHOOK] Telegram API error:', errorText);
          }
        } else {
          console.log('🟡 [TELEGRAM WEBHOOK] No response generated for message:', text);
        }
      }

      return NextResponse.json({ success: true, message: 'Message processed' });
    }

    return NextResponse.json({ success: true, message: 'Webhook received' });

  } catch (error) {
    console.error('🔴 [TELEGRAM WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Answer callback query to remove loading state from inline keyboard
async function answerCallbackQuery(callbackQueryId: string, text?: string, botToken?: string) {
  try {
    if (!botToken) {
      console.log('🟡 [TELEGRAM WEBHOOK] No bot token available, skipping callback answer');
      return;
    }

    const apiUrl = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || 'Done!',
        show_alert: false
      })
    });
  } catch (error) {
    console.error('Error answering callback query:', error);
  }
}

// Handle Telegram commands
export async function handleCommand(text: string, chatId: string, user: any): Promise<string | null> {
  try {
    const parts = text.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    console.log('🟦 [TELEGRAM WEBHOOK] Processing command:', { command, args });

    switch (command) {
      case '/start':
        return `🚀 *Welcome to JobQuest AI Assistant!*

I'm here to help you manage your job search activities right from Telegram.

🔹 Get status updates
🔹 Manage reminders  
🔹 Track interviews
🔹 Follow up with contacts
🔹 View statistics

Type /help to see all available commands.

Let's land your dream job! 💼✨`;

      case '/status':
        try {
          // Get base URL for API calls
          const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
          const apiUrl = `${baseUrl}/api/dashboard/stats`;
          
          console.log('🟦 [TELEGRAM WEBHOOK] Fetching stats from:', apiUrl);
          
          const response = await fetch(apiUrl);
          console.log('🟦 [TELEGRAM WEBHOOK] Stats response status:', response.status);
          
          if (response.ok) {
            const stats = await response.json();
            console.log('🟦 [TELEGRAM WEBHOOK] Stats data:', stats);
            
            return `📊 *Your Job Search Status*

📋 Total Activities: ${stats.totalActivities || 0}
⏰ Pending Reminders: ${stats.pendingReminders || 0}
🎯 Upcoming Interviews: ${stats.upcomingInterviews || 0}
📞 Overdue Follow-ups: ${stats.overdueFollowUps || 0}
👥 Active Contacts: ${stats.activeContacts || 0}

📈 Completion Rate: ${stats.completionRate || 0}%

Keep up the great work! 💪`;
          } else {
            console.log('🔴 [TELEGRAM WEBHOOK] Stats API error:', response.status, response.statusText);
            return `❌ Unable to fetch status (${response.status}). Please try again later.`;
          }
        } catch (error) {
          console.error('🔴 [TELEGRAM WEBHOOK] Error fetching stats:', error);
          return '❌ Unable to fetch status. Please try again later.';
        }

      case '/reminders':
        try {
          const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
          const apiUrl = `${baseUrl}/api/reminders?limit=5&status=pending`;
          
          console.log('🟦 [TELEGRAM WEBHOOK] Fetching reminders from:', apiUrl);
          
          const response = await fetch(apiUrl);
          console.log('🟦 [TELEGRAM WEBHOOK] Reminders response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            const reminders = data.reminders || [];
            console.log('🟦 [TELEGRAM WEBHOOK] Found reminders:', reminders.length);

            if (reminders.length === 0) {
              return '✅ No pending reminders. You\'re all caught up!';
            }

            let text = `⏰ *Pending Reminders (${reminders.length})*\n\n`;
            
            reminders.forEach((reminder: any, index: number) => {
              const date = new Date(reminder.dueDate).toLocaleDateString();
              text += `${index + 1}. 📌 ${reminder.title}\n`;
              text += `   📅 Due: ${date}\n`;
              if (reminder.jobId?.company) {
                text += `   🏢 ${reminder.jobId.company}\n`;
              }
              text += '\n';
            });

            return text;
          } else {
            console.log('🔴 [TELEGRAM WEBHOOK] Reminders API error:', response.status, response.statusText);
            return `❌ Unable to fetch reminders (${response.status}). Please try again later.`;
          }
        } catch (error) {
          console.error('🔴 [TELEGRAM WEBHOOK] Error fetching reminders:', error);
          return '❌ Unable to fetch reminders. Please try again later.';
        }

      case '/interviews':
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/events?type=interview&status=scheduled`);
          if (response.ok) {
            const data = await response.json();
            const interviews = data.events || [];

            if (interviews.length === 0) {
              return '📅 No upcoming interviews scheduled.';
            }

            let text = `🎯 *Upcoming Interviews (${interviews.length})*\n\n`;
            
            interviews.forEach((interview: any, index: number) => {
              const date = new Date(interview.startDate).toLocaleDateString();
              const time = new Date(interview.startDate).toLocaleTimeString();
              text += `${index + 1}. 🎯 ${interview.title}\n`;
              text += `   📅 ${date} at ${time}\n`;
              if (interview.location?.address) {
                text += `   📍 ${interview.location.address}\n`;
              }
              text += '\n';
            });

            return text;
          } else {
            return '❌ Unable to fetch interviews. Please try again later.';
          }
        } catch (error) {
          return '❌ Unable to fetch interviews. Please try again later.';
        }

      case '/followups':
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/follow-ups`);
          if (response.ok) {
            const data = await response.json();
            const followUps = data.followUps || [];
            
            const pendingFollowUps = followUps.filter((f: any) => 
              f.status === 'scheduled' || f.status === 'overdue'
            );

            if (pendingFollowUps.length === 0) {
              return '✅ No pending follow-ups. You\'re all caught up!';
            }

            let text = `📞 *Pending Follow-ups (${pendingFollowUps.length})*\n\n`;
            
            const contactsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/contacts`);
            const contactsData = contactsResponse.ok ? await contactsResponse.json() : { contacts: [] };
            const contacts = contactsData.contacts || [];
            
            pendingFollowUps.slice(0, 5).forEach((followUp: any, index: number) => {
              const contact = contacts.find((c: any) => c.id === followUp.contactId);
              const date = new Date(followUp.scheduledDate).toLocaleDateString();
              const isOverdue = new Date(followUp.scheduledDate) < new Date();
              
              text += `${index + 1}. ${isOverdue ? '🔴' : '📞'} ${followUp.subject}\n`;
              if (contact) {
                text += `   👤 ${contact.name}\n`;
                if (contact.company) {
                  text += `   🏢 ${contact.company}\n`;
                }
              }
              text += `   📅 ${isOverdue ? 'Overdue: ' : 'Due: '}${date}\n`;
              text += `   🎯 Priority: ${followUp.priority}\n\n`;
            });

            if (pendingFollowUps.length > 5) {
              text += `... and ${pendingFollowUps.length - 5} more follow-ups\n\n`;
            }

            text += 'Use the interactive buttons when you receive notifications to mark items as complete!';
            return text;
          } else {
            return '❌ Unable to fetch follow-ups. Please try again later.';
          }
        } catch (error) {
          return '❌ Unable to fetch follow-ups. Please try again later.';
        }

      case '/help':
        return `🤖 *JobQuest AI Assistant Commands*

/start - Start the assistant
/status - Get job search status
/reminders - List pending reminders
/interviews - List upcoming interviews
/followups - List pending follow-ups
/help - Show all commands

💡 *Quick Actions:*
• \`fleeting: Your idea here\` - Save a fleeting note
• \`reminder: Title | Date | Time\` - Create a reminder
• \`application: Company | Position | Status\` - Add job application

🎯 *Interactive Features:*
• Receive notifications with action buttons
• Mark tasks complete directly from Telegram
• Get real-time updates on your job search

Need more help? Visit the web app for full features!`;

      case '/menu':
        // This would send an interactive menu with buttons
        return `🚀 *Quick Actions Menu*

Choose an action:
• Type \`fleeting: Your note\` to save a quick thought
• Type \`reminder: Task | tomorrow | 2pm\` to set a reminder
• Type \`/status\` to see your current progress
• Type \`/interviews\` to see upcoming interviews
• Type \`/followups\` to see pending follow-ups

💡 Pro tip: You'll receive interactive notifications with buttons for easy task management!`;

      default:
        return `❓ Unknown command: ${command}

Type /help to see all available commands.

💡 You can also use:
• \`fleeting: Your note\` - Save quick thoughts
• \`reminder: Task | Date | Time\` - Set reminders
• \`application: Company | Position | Status\` - Track applications`;
    }
  } catch (error) {
    console.error('Error handling command:', error);
    return '❌ Sorry, there was an error processing your command. Please try again.';
  }
}

// Handle text messages for fleeting notes, reminders, etc.
export async function handleTextMessage(text: string, chatId: string, user: any): Promise<string | null> {
  try {
    // Handle fleeting notes
    if (text.startsWith('fleeting:')) {
      const note = text.replace('fleeting:', '').trim();
      
      try {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const apiUrl = `${baseUrl}/api/notes/fleeting`;
        
        console.log('🟦 [TELEGRAM WEBHOOK] Saving fleeting note to:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: note,
            source: 'telegram',
            timestamp: new Date().toISOString()
          })
        });

        console.log('🟦 [TELEGRAM WEBHOOK] Fleeting note response status:', response.status);

        if (response.ok) {
          return `📝 *Fleeting Note Saved*\n\n"${note}"\n\n✅ Added to your notes collection`;
        } else {
          console.log('🔴 [TELEGRAM WEBHOOK] Failed to save fleeting note:', response.status, response.statusText);
          return '❌ Failed to save fleeting note. Please try again.';
        }
      } catch (error) {
        console.error('🔴 [TELEGRAM WEBHOOK] Error saving fleeting note:', error);
        return '❌ Failed to save fleeting note. Please try again.';
      }
    }

    // Handle reminders
    if (text.startsWith('reminder:')) {
      const reminderText = text.replace('reminder:', '').trim();
      const parts = reminderText.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const title = parts[0];
        const dateStr = parts[1];
        const timeStr = parts[2] || '9:00 AM';

        const response = await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            dueDate: parseDate(dateStr),
            dueTime: timeStr,
            type: 'custom',
            priority: 'medium',
            source: 'telegram'
          })
        });

        if (response.ok) {
          return `⏰ *Reminder Created*\n\n📋 ${title}\n📅 ${dateStr} at ${timeStr}\n\n✅ I'll notify you when it's time!`;
        } else {
          return '❌ Failed to create reminder. Please try again.';
        }
      } else {
        return '❌ Invalid reminder format. Use: `reminder: Title | Date | Time`';
      }
    }

    // Handle applications
    if (text.startsWith('application:')) {
      const appText = text.replace('application:', '').trim();
      const parts = appText.split('|').map(p => p.trim());
      
      if (parts.length >= 3) {
        const company = parts[0];
        const position = parts[1];
        const status = parts[2];

        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company,
            position,
            status: status.toLowerCase(),
            appliedDate: new Date().toISOString(),
            source: 'telegram'
          })
        });

        if (response.ok) {
          return `💼 *Job Application Added*\n\n🏢 ${company}\n💼 ${position}\n📊 Status: ${status}\n\n✅ Added to your application tracker!`;
        } else {
          return '❌ Failed to add application. Please try again.';
        }
      } else {
        return '❌ Invalid application format. Use: `application: Company | Position | Status`';
      }
    }

    // Handle reschedule
    if (text.startsWith('reschedule:')) {
      const rescheduleText = text.replace('reschedule:', '').trim();
      const parts = rescheduleText.split('|').map(p => p.trim());
      
      if (parts.length >= 2) {
        const dateStr = parts[0];
        const timeStr = parts[1];
        
        return `📅 *Reschedule Request*\n\nNew date: ${dateStr}\nNew time: ${timeStr}\n\n✅ This would update the item in your calendar`;
      } else {
        return '❌ Invalid reschedule format. Use: `reschedule: Date | Time`';
      }
    }

    // Handle notes for specific items
    if (text.startsWith('note:')) {
      const note = text.replace('note:', '').trim();
      
      return `📝 *Note Added*\n\n"${note}"\n\n✅ This would be attached to the relevant item`;
    }

    return null; // No special handling needed
  } catch (error) {
    console.error('Error handling text message:', error);
    return '❌ Error processing your message. Please try again.';
  }
}

// Parse date strings like "tomorrow", "today", "monday", etc.
function parseDate(dateStr: string): string {
  const now = new Date();
  const lower = dateStr.toLowerCase();

  if (lower === 'today') {
    return now.toISOString();
  } else if (lower === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  } else if (lower === 'monday' || lower === 'tuesday' || lower === 'wednesday' || 
             lower === 'thursday' || lower === 'friday' || lower === 'saturday' || lower === 'sunday') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(lower);
    const currentDay = now.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7; // Next occurrence
    
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntilTarget);
    return targetDate.toISOString();
  } else {
    // Try to parse as regular date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    // Default to tomorrow if can't parse
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString();
  }
}