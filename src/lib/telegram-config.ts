import User from '@/models/User';
import connectDB from '@/lib/db';

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  enabled: boolean;
}

export async function getTelegramConfig(userEmail?: string): Promise<TelegramConfig | null> {
  try {
    if (!userEmail) {
      console.log('🟡 [TELEGRAM CONFIG] No user email provided');
      return null;
    }

    await connectDB();
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('🟡 [TELEGRAM CONFIG] User not found:', userEmail);
      return null;
    }

    if (!user.telegramConfig || !user.telegramConfig.enabled) {
      console.log('🟡 [TELEGRAM CONFIG] Telegram not configured or disabled for user:', userEmail);
      return null;
    }

    console.log('🟢 [TELEGRAM CONFIG] Found Telegram config for user:', userEmail);
    return user.telegramConfig;
  } catch (error) {
    console.error('🔴 [TELEGRAM CONFIG] Error fetching Telegram config:', error);
    return null;
  }
}

export async function getBotTokenFromDB(): Promise<string | null> {
  try {
    await connectDB();
    
    // For webhook, we need to find any user with a valid bot token
    // In a real app, you might want to have a single bot for all users
    // or implement user identification in the webhook
    const user = await User.findOne({
      'telegramConfig.botToken': { $exists: true, $ne: null },
      'telegramConfig.enabled': true
    });
    
    if (!user || !user.telegramConfig?.botToken) {
      console.log('🟡 [TELEGRAM CONFIG] No bot token found in database');
      return null;
    }

    console.log('🟢 [TELEGRAM CONFIG] Found bot token in database');
    return user.telegramConfig.botToken;
  } catch (error) {
    console.error('🔴 [TELEGRAM CONFIG] Error fetching bot token from DB:', error);
    return null;
  }
}

export async function getUserByTelegramChatId(chatId: string): Promise<any> {
  try {
    await connectDB();
    
    const user = await User.findOne({
      'telegramConfig.chatId': chatId,
      'telegramConfig.enabled': true
    });
    
    if (!user) {
      console.log('🟡 [TELEGRAM CONFIG] No user found for chat ID:', chatId);
      return null;
    }

    console.log('🟢 [TELEGRAM CONFIG] Found user for chat ID:', chatId);
    return user;
  } catch (error) {
    console.error('🔴 [TELEGRAM CONFIG] Error finding user by chat ID:', error);
    return null;
  }
}