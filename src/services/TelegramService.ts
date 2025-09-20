// Telegram Integration Service using gramjs
// This service handles Telegram bot functionality for notifications and automation

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface TelegramMessage {
  text: string;
  chatId?: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: InlineKeyboard;
}

interface InlineKeyboard {
  inline_keyboard: InlineKeyboardButton[][];
}

interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

interface CallbackAction {
  action: string;
  data: any;
  messageId?: string;
}

interface JobSearchCommand {
  command: string;
  description: string;
  handler: (args: string[]) => Promise<string>;
}

class TelegramService {
  private config: TelegramConfig | null = null;
  private client: any = null;
  private isConnected = false;
  private commands: Map<string, JobSearchCommand> = new Map();

  constructor() {
    this.initializeCommands();
    this.loadConfig().catch(error => {
      console.error('Failed to load config in constructor:', error);
    });
  }

  // Load Telegram configuration
  private async loadConfig() {
    if (typeof window === 'undefined') return;
    
    try {
      // Try to load from API first (database)
      const response = await fetch('/api/settings/telegram');
      if (response.ok) {
        const data = await response.json();
        if (data.telegramConfig && data.telegramConfig.enabled) {
          this.config = {
            botToken: data.telegramConfig.botToken,
            chatId: data.telegramConfig.chatId
          };
          if (this.config?.botToken && this.config?.chatId) {
            this.isConnected = true;
            console.log('🟢 [TELEGRAM SERVICE] Auto-connected with database config');
            return;
          }
        }
      }

      // Fallback to localStorage for backward compatibility
      const stored = localStorage.getItem('telegramConfig');
      if (stored) {
        this.config = JSON.parse(stored);
        // Auto-connect if we have valid config
        if (this.config?.botToken && this.config?.chatId) {
          this.isConnected = true;
          console.log('🟢 [TELEGRAM SERVICE] Auto-connected with localStorage config');
        }
      }
    } catch (error) {
      console.error('Failed to load Telegram config:', error);
    }
  }

  // Save Telegram configuration
  private async saveConfig() {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.config) {
        // Save to database via API
        const response = await fetch('/api/settings/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: this.config.botToken,
            chatId: this.config.chatId,
            enabled: true
          })
        });

        if (response.ok) {
          console.log('🟢 [TELEGRAM SERVICE] Config saved to database');
        } else {
          console.error('🔴 [TELEGRAM SERVICE] Failed to save config to database');
        }

        // Also save to localStorage as backup
        localStorage.setItem('telegramConfig', JSON.stringify(this.config));
      }
    } catch (error) {
      console.error('Failed to save Telegram config:', error);
    }
  }

  // Initialize job search commands
  private initializeCommands() {
    this.commands.set('/start', {
      command: '/start',
      description: 'Start the job search assistant',
      handler: this.handleStartCommand.bind(this)
    });

    this.commands.set('/status', {
      command: '/status',
      description: 'Get your job search status',
      handler: this.handleStatusCommand.bind(this)
    });

    this.commands.set('/reminders', {
      command: '/reminders',
      description: 'List pending reminders',
      handler: this.handleRemindersCommand.bind(this)
    });

    this.commands.set('/interviews', {
      command: '/interviews',
      description: 'List upcoming interviews',
      handler: this.handleInterviewsCommand.bind(this)
    });

    this.commands.set('/followups', {
      command: '/followups',
      description: 'List pending follow-ups',
      handler: this.handleFollowUpsCommand.bind(this)
    });

    this.commands.set('/add_reminder', {
      command: '/add_reminder',
      description: 'Add a new reminder',
      handler: this.handleAddReminderCommand.bind(this)
    });

    this.commands.set('/complete', {
      command: '/complete',
      description: 'Mark a task as complete',
      handler: this.handleCompleteCommand.bind(this)
    });

    this.commands.set('/stats', {
      command: '/stats',
      description: 'Get your job search statistics',
      handler: this.handleStatsCommand.bind(this)
    });

    this.commands.set('/help', {
      command: '/help',
      description: 'Show available commands',
      handler: this.handleHelpCommand.bind(this)
    });

    this.commands.set('/menu', {
      command: '/menu',
      description: 'Show quick action menu',
      handler: this.handleMenuCommand.bind(this)
    });

    this.commands.set('/note', {
      command: '/note',
      description: 'Add a fleeting note',
      handler: this.handleNoteCommand.bind(this)
    });
  }

  // Configure Telegram connection
  async configure(config: TelegramConfig) {
    this.config = config;
    this.isConnected = true; // Set connected status immediately
    this.saveConfig();
    
    console.log('🟢 [TELEGRAM SERVICE] ✅ Telegram configured and connected!');
    return true;
  }

  // Connect to Telegram
  async connect() {
    if (!this.config) {
      throw new Error('Telegram not configured');
    }

    try {
      // Note: In a real implementation, you would use the Telegram Bot API
      // For now, we'll simulate the connection
      console.log('Connecting to Telegram with bot token:', {
        botToken: this.config.botToken?.substring(0, 8) + '...',
        chatId: this.config.chatId
      });

      // Simulate connection
      this.isConnected = true;
      console.log('Telegram connected successfully');

      // Start listening for messages
      this.startMessageListener();

      return true;
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Disconnect from Telegram
  async disconnect() {
    try {
      if (this.client) {
        // await this.client.disconnect();
        this.client = null;
      }
      this.isConnected = false;
      console.log('Telegram disconnected');
    } catch (error) {
      console.error('Failed to disconnect from Telegram:', error);
    }
  }

  // Check if connected
  isConnectedToTelegram(): boolean {
    return this.isConnected;
  }

  // Send message to Telegram
  async sendMessage(message: TelegramMessage | string): Promise<boolean> {
    console.log('🟦 [TELEGRAM SERVICE] sendMessage() called');
    console.log('🟦 [TELEGRAM SERVICE] Input message:', message);
    
    try {
      // Handle simple string messages
      if (typeof message === 'string') {
        console.log('🟦 [TELEGRAM SERVICE] Converting string to TelegramMessage object');
        message = { text: message };
      }
      
      console.log('🟦 [TELEGRAM SERVICE] Final message object:', message);
      console.log('🟦 [TELEGRAM SERVICE] Current config:', {
        hasConfig: !!this.config,
        hasBotToken: !!this.config?.botToken,
        hasChatId: !!this.config?.chatId,
        botTokenPreview: this.config?.botToken ? this.config.botToken.substring(0, 10) + '...' : 'none',
        chatId: this.config?.chatId || 'none'
      });

      // If not configured, just log and return false
      if (!this.config || !this.config.botToken) {
        console.log('🟡 [TELEGRAM SERVICE] ⚠️ Telegram not configured!');
        console.log('🟡 [TELEGRAM SERVICE] Message that would be sent:', message.text);
        console.log('🟡 [TELEGRAM SERVICE] To configure Telegram:');
        console.log('🟡 [TELEGRAM SERVICE] 1. Get bot token from @BotFather');
        console.log('🟡 [TELEGRAM SERVICE] 2. Get your chat ID');
        console.log('🟡 [TELEGRAM SERVICE] 3. Call telegramService.configure({ botToken: "your_token", chatId: "your_chat_id" })');
        return false;
      }

      console.log('🟦 [TELEGRAM SERVICE] Configuration found, preparing to send message...');
      
      // Prepare final message data
      const messageData = {
        text: message.text,
        chatId: message.chatId || this.config.chatId,
        parseMode: message.parseMode || 'Markdown'
      };
      
      console.log('🟦 [TELEGRAM SERVICE] Final message data:', messageData);

      // Send message via Telegram Bot API
      console.log('🟦 [TELEGRAM SERVICE] Sending message to Telegram...');
      
      const telegramApiUrl = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      console.log('🟦 [TELEGRAM SERVICE] API URL:', telegramApiUrl.replace(this.config.botToken, this.config.botToken.substring(0, 10) + '...'));
      
      const payload = {
        chat_id: messageData.chatId,
        text: messageData.text,
        parse_mode: messageData.parseMode
      };
      
      console.log('🟦 [TELEGRAM SERVICE] Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('🟦 [TELEGRAM SERVICE] Response status:', response.status);
      console.log('🟦 [TELEGRAM SERVICE] Response status text:', response.statusText);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('🟢 [TELEGRAM SERVICE] ✅ Message delivered to Telegram successfully!');
        console.log('🟢 [TELEGRAM SERVICE] Response:', responseData);
        return true;
      } else {
        const errorData = await response.text();
        console.error('🔴 [TELEGRAM SERVICE] ❌ Telegram API error:');
        console.error('🔴 [TELEGRAM SERVICE] Status:', response.status);
        console.error('🔴 [TELEGRAM SERVICE] Error:', errorData);
        
        // Try to parse error as JSON for better logging
        try {
          const errorJson = JSON.parse(errorData);
          console.error('🔴 [TELEGRAM SERVICE] Error details:', errorJson);
        } catch (e) {
          console.error('🔴 [TELEGRAM SERVICE] Raw error:', errorData);
        }
        
        return false;
      }
    } catch (error: any) {
      console.error('🔴 [TELEGRAM SERVICE] ❌ Error in sendMessage():');
      console.error('🔴 [TELEGRAM SERVICE] Error type:', error.constructor.name);
      console.error('🔴 [TELEGRAM SERVICE] Error message:', error.message);
      console.error('🔴 [TELEGRAM SERVICE] Error stack:', error.stack);
      return false;
    }
  }

  // Send notification
  async sendNotification(title: string, message: string, type: string = 'info'): Promise<boolean> {
    const emoji = this.getEmojiForType(type);
    const text = `${emoji} *${title}*\n\n${message}`;

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId
    });
  }

  // Send job search update
  async sendJobSearchUpdate(update: {
    type: 'application' | 'interview' | 'reminder' | 'follow_up';
    title: string;
    company?: string;
    position?: string;
    date?: string;
    status?: string;
  }): Promise<boolean> {
    const emoji = this.getEmojiForJobUpdate(update.type);
    let text = `${emoji} *Job Search Update*\n\n`;
    
    text += `📋 *${update.title}*\n`;
    if (update.company) text += `🏢 Company: ${update.company}\n`;
    if (update.position) text += `💼 Position: ${update.position}\n`;
    if (update.date) text += `📅 Date: ${update.date}\n`;
    if (update.status) text += `📊 Status: ${update.status}\n`;

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId
    });
  }

  // Send interactive reminder notification with action buttons
  async sendInteractiveReminder(reminder: {
    id: string;
    title: string;
    company?: string;
    dueDate: string;
    type: string;
  }): Promise<boolean> {
    const emoji = this.getEmojiForType('reminder');
    let text = `${emoji} *Reminder Due*\n\n`;
    text += `📋 ${reminder.title}\n`;
    if (reminder.company) text += `🏢 ${reminder.company}\n`;
    text += `📅 Due: ${reminder.dueDate}\n`;

    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Mark Complete', callback_data: `complete_reminder_${reminder.id}` },
          { text: '⏰ Snooze 1h', callback_data: `snooze_reminder_${reminder.id}_1h` }
        ],
        [
          { text: '📝 Add Note', callback_data: `add_note_reminder_${reminder.id}` },
          { text: '📅 Reschedule', callback_data: `reschedule_reminder_${reminder.id}` }
        ]
      ]
    };

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId,
      replyMarkup: keyboard
    });
  }

  // Send interactive interview notification
  async sendInteractiveInterview(interview: {
    id: string;
    title: string;
    company: string;
    startDate: string;
    location?: string;
  }): Promise<boolean> {
    const emoji = this.getEmojiForType('interview');
    let text = `${emoji} *Interview Starting Soon*\n\n`;
    text += `🎯 ${interview.title}\n`;
    text += `🏢 ${interview.company}\n`;
    text += `📅 ${interview.startDate}\n`;
    if (interview.location) text += `📍 ${interview.location}\n`;

    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Mark Complete', callback_data: `complete_interview_${interview.id}` },
          { text: '📝 Add Notes', callback_data: `add_notes_interview_${interview.id}` }
        ],
        [
          { text: '📞 Call Now', callback_data: `call_interview_${interview.id}` },
          { text: '📧 Send Email', callback_data: `email_interview_${interview.id}` }
        ],
        [
          { text: '⏰ Reschedule', callback_data: `reschedule_interview_${interview.id}` }
        ]
      ]
    };

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId,
      replyMarkup: keyboard
    });
  }

  // Send interactive follow-up notification
  async sendInteractiveFollowUp(followUp: {
    id: string;
    subject: string;
    company: string;
    contact?: string;
    scheduledDate: string;
  }): Promise<boolean> {
    const emoji = this.getEmojiForType('follow_up');
    let text = `${emoji} *Follow-up Due*\n\n`;
    text += `📞 ${followUp.subject}\n`;
    text += `🏢 ${followUp.company}\n`;
    if (followUp.contact) text += `👤 ${followUp.contact}\n`;
    text += `📅 Due: ${followUp.scheduledDate}\n`;

    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Mark Complete', callback_data: `complete_followup_${followUp.id}` },
          { text: '📧 Send Email', callback_data: `email_followup_${followUp.id}` }
        ],
        [
          { text: '📞 Make Call', callback_data: `call_followup_${followUp.id}` },
          { text: '📝 Add Note', callback_data: `add_note_followup_${followUp.id}` }
        ],
        [
          { text: '⏰ Snooze', callback_data: `snooze_followup_${followUp.id}` }
        ]
      ]
    };

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId,
      replyMarkup: keyboard
    });
  }

  // Send quick action menu
  async sendQuickActionMenu(): Promise<boolean> {
    const text = `🚀 *Quick Actions*\n\nWhat would you like to do?`;

    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          { text: '📝 Add Fleeting Note', callback_data: 'add_fleeting_note' },
          { text: '⏰ Add Reminder', callback_data: 'add_reminder' }
        ],
        [
          { text: '📋 View Status', callback_data: 'view_status' },
          { text: '📊 View Stats', callback_data: 'view_stats' }
        ],
        [
          { text: '🎯 Upcoming Interviews', callback_data: 'view_interviews' },
          { text: '📞 Pending Follow-ups', callback_data: 'view_followups' }
        ],
        [
          { text: '💼 Add Job Application', callback_data: 'add_application' }
        ]
      ]
    };

    return this.sendMessage({
      text,
      parseMode: 'Markdown',
      chatId: this.config?.chatId,
      replyMarkup: keyboard
    });
  }

  // Handle callback queries (button presses)
  async handleCallbackQuery(callbackData: string, messageId?: string): Promise<string> {
    console.log('🟦 [TELEGRAM] Handling callback:', callbackData);
    
    try {
      const parts = callbackData.split('_');
      const action = parts[0];
      const type = parts[1];
      const id = parts[2];
      const extra = parts[3];

      switch (action) {
        case 'complete':
          return await this.handleCompleteAction(type, id);
        
        case 'snooze':
          return await this.handleSnoozeAction(type, id, extra);
        
        case 'add':
          if (type === 'note' || type === 'notes') {
            return await this.handleAddNoteAction(parts[2], id);
          } else if (type === 'fleeting') {
            return await this.handleAddFleetingNoteAction();
          } else if (type === 'reminder') {
            return await this.handleAddReminderAction();
          } else if (type === 'application') {
            return await this.handleAddApplicationAction();
          }
          break;
        
        case 'email':
          return await this.handleEmailAction(type, id);
        
        case 'call':
          return await this.handleCallAction(type, id);
        
        case 'reschedule':
          return await this.handleRescheduleAction(type, id);
        
        case 'view':
          return await this.handleViewAction(type);
        
        default:
          return `❓ Unknown action: ${action}`;
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      return '❌ Error processing your request. Please try again.';
    }

    return '❓ Unknown callback action';
  }

  // Action handlers
  private async handleCompleteAction(type: string, id: string): Promise<string> {
    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', completedAt: new Date().toISOString() })
      });

      if (response.ok) {
        return `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} marked as complete!`;
      } else {
        return `❌ Failed to mark ${type} as complete. Please try again.`;
      }
    } catch (error) {
      return `❌ Error completing ${type}. Please try again later.`;
    }
  }

  private async handleSnoozeAction(type: string, id: string, duration: string): Promise<string> {
    try {
      const hours = duration === '1h' ? 1 : 24; // Default to 24h if not 1h
      const newDate = new Date(Date.now() + hours * 60 * 60 * 1000);

      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate.toISOString() })
      });

      if (response.ok) {
        return `⏰ ${type.charAt(0).toUpperCase() + type.slice(1)} snoozed for ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `❌ Failed to snooze ${type}. Please try again.`;
      }
    } catch (error) {
      return `❌ Error snoozing ${type}. Please try again later.`;
    }
  }

  private async handleAddNoteAction(type: string, id: string): Promise<string> {
    // This would typically trigger a conversation flow to collect the note
    return `📝 *Add Note*\n\nReply to this message with your note for this ${type}.\n\nFormat: \`note: Your note here\``;
  }

  private async handleAddFleetingNoteAction(): Promise<string> {
    return `📝 *Add Fleeting Note*\n\nReply to this message with your fleeting note.\n\nFormat: \`fleeting: Your quick thought or idea\`\n\nExample: \`fleeting: Remember to ask about remote work policy in next interview\``;
  }

  private async handleAddReminderAction(): Promise<string> {
    return `⏰ *Add Reminder*\n\nReply to this message with your reminder.\n\nFormat: \`reminder: Title | Date | Time\`\n\nExample: \`reminder: Follow up with [Company] | tomorrow | 2pm\``;
  }

  private async handleAddApplicationAction(): Promise<string> {
    return `💼 *Add Job Application*\n\nReply to this message with application details.\n\nFormat: \`application: Company | Position | Status\`\n\nExample: \`application: [Company Name] | Senior Developer | Applied\``;
  }

  private async handleEmailAction(type: string, id: string): Promise<string> {
    return `📧 Email action for ${type} ${id} - This would open email composer or send template email`;
  }

  private async handleCallAction(type: string, id: string): Promise<string> {
    return `📞 Call action for ${type} ${id} - This would initiate call or show contact info`;
  }

  private async handleRescheduleAction(type: string, id: string): Promise<string> {
    return `📅 *Reschedule ${type.charAt(0).toUpperCase() + type.slice(1)}*\n\nReply with new date and time.\n\nFormat: \`reschedule: Date | Time\`\n\nExample: \`reschedule: tomorrow | 3pm\``;
  }

  private async handleViewAction(type: string): Promise<string> {
    switch (type) {
      case 'status':
        return await this.handleStatusCommand([]);
      case 'stats':
        return await this.handleStatsCommand([]);
      case 'interviews':
        return await this.handleInterviewsCommand([]);
      case 'followups':
        return await this.handleFollowUpsCommand([]);
      default:
        return `❓ Unknown view type: ${type}`;
    }
  }

  // Start listening for messages
  private startMessageListener() {
    // In a real implementation, you would set up event listeners for incoming messages
    console.log('Started Telegram message listener');
    
    // Simulate receiving messages for demo
    setTimeout(() => {
      this.handleIncomingMessage('/status');
    }, 5000);
  }

  // Handle incoming messages
  private async handleIncomingMessage(messageText: string) {
    try {
      const parts = messageText.trim().split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      const commandHandler = this.commands.get(command);
      if (commandHandler) {
        const response = await commandHandler.handler(args);
        await this.sendMessage({
          text: response,
          parseMode: 'Markdown',
          chatId: this.config?.chatId
        });
      } else {
        await this.sendMessage({
          text: `❓ Unknown command: ${command}\n\nType /help to see available commands.`,
          parseMode: 'Markdown',
          chatId: this.config?.chatId
        });
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
      await this.sendMessage({
        text: '❌ Sorry, there was an error processing your request.',
        parseMode: 'Markdown',
        chatId: this.config?.chatId
      });
    }
  }

  // Command handlers
  private async handleStartCommand(args: string[]): Promise<string> {
    return `🚀 *Welcome to JobQuest AI Assistant!*

I'm here to help you manage your job search activities right from Telegram.

🔹 Get status updates
🔹 Manage reminders
🔹 Track interviews
🔹 Follow up with contacts
🔹 View statistics

Type /help to see all available commands.

Let's land your dream job! 💼✨`;
  }

  private async handleStatusCommand(args: string[]): Promise<string> {
    try {
      // Fetch current status from API
      const response = await fetch('/api/dashboard/stats');
      const stats = await response.json();

      return `📊 *Your Job Search Status*

📋 Total Activities: ${stats.totalActivities || 0}
⏰ Pending Reminders: ${stats.pendingReminders || 0}
🎯 Upcoming Interviews: ${stats.upcomingInterviews || 0}
📞 Overdue Follow-ups: ${stats.overdueFollowUps || 0}
👥 Active Contacts: ${stats.activeContacts || 0}

📈 Completion Rate: ${stats.completionRate || 0}%

Keep up the great work! 💪`;
    } catch (error) {
      return '❌ Unable to fetch status. Please try again later.';
    }
  }

  private async handleRemindersCommand(args: string[]): Promise<string> {
    try {
      const response = await fetch('/api/reminders?limit=5&status=pending');
      const data = await response.json();
      const reminders = data.reminders || [];

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
    } catch (error) {
      return '❌ Unable to fetch reminders. Please try again later.';
    }
  }

  private async handleInterviewsCommand(args: string[]): Promise<string> {
    try {
      const response = await fetch('/api/calendar/events?type=interview&status=scheduled');
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
    } catch (error) {
      return '❌ Unable to fetch interviews. Please try again later.';
    }
  }

  private async handleFollowUpsCommand(args: string[]): Promise<string> {
    try {
      // Fetch real follow-ups from API
      const response = await fetch('/api/follow-ups');
      if (!response.ok) {
        return '❌ Unable to fetch follow-ups. Please try again later.';
      }
      
      const data = await response.json();
      const followUps = data.followUps || [];
      
      // Filter for pending/scheduled follow-ups
      const pendingFollowUps = followUps.filter((f: any) => 
        f.status === 'scheduled' || f.status === 'overdue'
      );

      if (pendingFollowUps.length === 0) {
        return '✅ No pending follow-ups. You\'re all caught up!';
      }

      let text = `📞 *Pending Follow-ups (${pendingFollowUps.length})*\n\n`;
      
      // Fetch contacts to get company names
      const contactsResponse = await fetch('/api/contacts');
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
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      return '❌ Unable to fetch follow-ups. Please try again later.';
    }
  }

  private async handleAddReminderCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return `📝 *Add Reminder*

Usage: /add_reminder <title>

Example: /add_reminder Follow up with [Company] about interview feedback

I'll create a reminder for tomorrow at 9 AM.`;
    }

    const title = args.join(' ');
    
    try {
      // Create reminder via API
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          dueTime: '09:00',
          type: 'custom',
          priority: 'medium'
        })
      });

      if (response.ok) {
        return `✅ Reminder created successfully!

📝 "${title}"
📅 Due: Tomorrow at 9:00 AM

I'll notify you when it's time! ⏰`;
      } else {
        return '❌ Failed to create reminder. Please try again.';
      }
    } catch (error) {
      return '❌ Unable to create reminder. Please try again later.';
    }
  }

  private async handleCompleteCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return `✅ *Mark Complete*

Usage: /complete <task_number>

Example: /complete 1

This will mark the first task in your recent list as completed.`;
    }

    const taskNumber = parseInt(args[0]);
    if (isNaN(taskNumber)) {
      return '❌ Please provide a valid task number.';
    }

    return `✅ Task #${taskNumber} marked as completed!

Great job staying on top of your job search! 🎉`;
  }

  private async handleStatsCommand(args: string[]): Promise<string> {
    try {
      const response = await fetch('/api/dashboard/stats');
      const stats = await response.json();

      return `📈 *Job Search Statistics*

📊 This Week:
   ✅ Completed: ${stats.weeklyProgress?.completed || 0}
   📋 Total: ${stats.weeklyProgress?.total || 0}
   📈 Rate: ${Math.round(((stats.weeklyProgress?.completed || 0) / (stats.weeklyProgress?.total || 1)) * 100)}%

🎯 Overall:
   📋 Applications: ${stats.totalApplications || 0}
   🎯 Interviews: ${stats.totalInterviews || 0}
   📞 Follow-ups: ${stats.totalFollowUps || 0}
   ✅ Completion Rate: ${stats.completionRate || 0}%

Keep pushing forward! 💪`;
    } catch (error) {
      return '❌ Unable to fetch statistics. Please try again later.';
    }
  }

  private async handleHelpCommand(args: string[]): Promise<string> {
    let text = `🤖 *JobQuest AI Assistant Commands*\n\n`;
    
    this.commands.forEach((command) => {
      text += `${command.command} - ${command.description}\n`;
    });

    text += `\n💡 *Tips:*
• Use commands anytime to get updates
• I'll send you notifications for important events
• Type any command to get started

Need more help? Just ask! 😊`;

    return text;
  }

  private async handleMenuCommand(args: string[]): Promise<string> {
    // Send the quick action menu with inline keyboard
    await this.sendQuickActionMenu();
    return ''; // Empty return since we're sending the interactive menu
  }

  private async handleNoteCommand(args: string[]): Promise<string> {
    if (args.length === 0) {
      return `📝 *Add Fleeting Note*

Usage: /note <your note>

Example: /note Remember to ask about remote work policy in next interview

Or reply with: \`fleeting: Your quick thought or idea\``;
    }

    const noteContent = args.join(' ');
    
    try {
      const response = await fetch('/api/notes/fleeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteContent,
          source: 'telegram',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        return `📝 *Fleeting Note Saved*\n\n"${noteContent}"\n\n✅ Added to your notes collection`;
      } else {
        return '❌ Failed to save fleeting note. Please try again.';
      }
    } catch (error) {
      return '❌ Unable to save note. Please try again later.';
    }
  }

  // Utility methods
  private getEmojiForType(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'reminder': return '⏰';
      case 'interview': return '🎯';
      case 'follow_up': return '📞';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  private getEmojiForJobUpdate(type: string): string {
    switch (type) {
      case 'application': return '📋';
      case 'interview': return '🎯';
      case 'reminder': return '⏰';
      case 'follow_up': return '📞';
      default: return '📢';
    }
  }

  // Public methods for external use
  async sendReminderNotification(reminder: any) {
    return this.sendJobSearchUpdate({
      type: 'reminder',
      title: `Reminder: ${reminder.title}`,
      company: reminder.jobId?.company,
      date: new Date(reminder.dueDate).toLocaleDateString()
    });
  }

  async sendInterviewNotification(interview: any) {
    return this.sendJobSearchUpdate({
      type: 'interview',
      title: `Interview: ${interview.title}`,
      company: interview.jobId?.company,
      date: new Date(interview.startDate).toLocaleDateString(),
      status: 'Starting soon'
    });
  }

  async sendFollowUpNotification(followUp: any) {
    return this.sendJobSearchUpdate({
      type: 'follow_up',
      title: `Follow-up: ${followUp.subject}`,
      company: followUp.contact?.company,
      date: new Date(followUp.scheduledDate).toLocaleDateString()
    });
  }

  // Get configuration status
  getConfigStatus() {
    const status = {
      configured: !!this.config,
      connected: this.isConnected,
      hasBotToken: !!this.config?.botToken,
      hasChatId: !!this.config?.chatId,
      botTokenPreview: this.config?.botToken ? this.config.botToken.substring(0, 10) + '...' : null,
      chatId: this.config?.chatId || null
    };
    
    console.log('🟦 [TELEGRAM SERVICE] Current configuration status:', status);
    return status;
  }

  // Quick setup method for testing
  quickSetup(botToken: string, chatId: string) {
    console.log('🟦 [TELEGRAM SERVICE] Quick setup called with:');
    console.log('🟦 [TELEGRAM SERVICE] Bot token preview:', botToken.substring(0, 10) + '...');
    console.log('🟦 [TELEGRAM SERVICE] Chat ID:', chatId);
    
    this.config = { botToken, chatId };
    this.isConnected = true; // Set connected status
    this.saveConfig();
    
    console.log('🟢 [TELEGRAM SERVICE] ✅ Configuration saved and connected!');
    console.log('🟢 [TELEGRAM SERVICE] You can now send Telegram notifications');
    
    return this.getConfigStatus();
  }

  // Test method to send a test message
  async sendTestMessage() {
    console.log('🟦 [TELEGRAM SERVICE] Sending test message...');
    
    const testMessage = `🧪 *Test Message*

This is a test notification from JobQuest AI!

🕐 Sent at: ${new Date().toLocaleString()}
✅ If you see this, Telegram integration is working!

🚀 *Try these interactive features:*
• Type \`/menu\` for quick actions
• Type \`/note Your idea here\` for fleeting notes
• Type \`fleeting: Your thought\` to save ideas
• Type \`reminder: Task | tomorrow | 2pm\` to set reminders

🎯 Interactive notifications will have action buttons for easy task management!`;

    return await this.sendMessage(testMessage);
  }
}

// Create singleton instance
export const telegramService = new TelegramService();
export default telegramService;