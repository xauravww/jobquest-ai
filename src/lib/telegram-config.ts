import User from '@/models/User';
import connectDB from '@/lib/db';

export interface TelegramConfig {
  userId?: string;
  username?: string;
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

export function getSharedBotToken(): string | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.log('🟡 [TELEGRAM CONFIG] No shared bot token found in environment');
    return null;
  }
  console.log('🟢 [TELEGRAM CONFIG] Using shared bot token from environment');
  return botToken;
}

export async function getUserByTelegramUserId(userId: string): Promise<any> {
  try {
    await connectDB();
    
    const user = await User.findOne({
      'telegramConfig.userId': userId,
      'telegramConfig.enabled': true
    });
    
    if (!user) {
      console.log('🟡 [TELEGRAM CONFIG] No user found for Telegram user ID:', userId);
      return null;
    }

    console.log('🟢 [TELEGRAM CONFIG] Found user for Telegram user ID:', userId);
    return user;
  } catch (error) {
    console.error('🔴 [TELEGRAM CONFIG] Error finding user by Telegram user ID:', error);
    return null;
  }
}

export async function linkTelegramUser(userEmail: string, telegramUserId: string, telegramUsername?: string): Promise<boolean> {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('🟡 [TELEGRAM CONFIG] User not found for linking:', userEmail);
      return false;
    }

    user.telegramConfig = {
      userId: telegramUserId,
      username: telegramUsername,
      enabled: true
    };

    await user.save();
    console.log('🟢 [TELEGRAM CONFIG] Successfully linked Telegram user:', telegramUserId, 'to', userEmail);
    return true;
  } catch (error) {
    console.error('🔴 [TELEGRAM CONFIG] Error linking Telegram user:', error);
    return false;
  }
}