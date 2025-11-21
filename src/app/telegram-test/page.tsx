'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';

export default function TelegramTestPage() {
  const [command, setCommand] = useState('/start');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId] = useState('test-user-123');

  const testCommand = async () => {
    setLoading(true);
    setResponse('');

    try {
      console.log('🧪 Testing command:', command);

      const res = await fetch('/api/telegram/local-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command.trim(),
          chatId
        })
      });

      const data = await res.json();
      console.log('🧪 Test result:', data);

      if (data.success) {
        setResponse(data.response || 'No response generated');
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('🔴 Test error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testTextMessage = async (text: string) => {
    setLoading(true);
    setResponse('');

    try {
      console.log('🧪 Testing text message:', text);

      // Import and use the text handler
      const res = await fetch('/api/telegram/local-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: text,
          chatId,
          isTextMessage: true
        })
      });

      const data = await res.json();
      console.log('🧪 Text test result:', data);

      if (data.success) {
        setResponse(data.response || 'No response generated');
      } else {
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('🔴 Text test error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    '/start',
    '/status',
    '/reminders',
    '/interviews',
    '/followups',
    '/help',
    '/menu'
  ];

  const quickTexts = [
    'fleeting: This is a test note from local testing',
    'reminder: Test reminder | tomorrow | 2pm',
    'application: Test Company | Developer | Applied'
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 Telegram Commands Local Test
          </h1>
          <p className="text-gray-400 mb-6">
            Test Telegram commands locally since webhooks don't work on localhost
          </p>

          {/* Webhook Explanation */}
          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-300 font-semibold mb-2">
              🚨 Why Webhooks Don't Work on Localhost
            </h3>
            <div className="text-yellow-200/80 text-sm space-y-2">
              <p>• Telegram webhooks require a <strong>publicly accessible HTTPS URL</strong></p>
              <p>• <code>localhost</code> is only accessible from your computer</p>
              <p>• For production, deploy to Vercel/Netlify and set webhook there</p>
              <p>• For local testing, use this page or polling instead of webhooks</p>
            </div>
          </div>

          {/* Command Testing */}
          <div className="space-y-6">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Test Commands</h3>

              <div className="flex gap-2 mb-4">
                <FormInput
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter command (e.g., /start)"
                  className="flex-1"
                />
                <Button
                  onClick={testCommand}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500"
                >
                  {loading ? 'Testing...' : 'Test Command'}
                </Button>
              </div>

              {/* Quick Command Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickCommands.map((cmd) => (
                  <Button
                    key={cmd}
                    onClick={() => {
                      setCommand(cmd);
                      setTimeout(() => testCommand(), 100);
                    }}
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Message Testing */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Test Text Messages</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {quickTexts.map((text) => (
                  <Button
                    key={text}
                    onClick={() => testTextMessage(text)}
                    size="sm"
                    variant="secondary"
                    disabled={loading}
                    className="text-xs"
                  >
                    {text.split(':')[0]}:...
                  </Button>
                ))}
              </div>
            </div>

            {/* Response Display */}
            {response && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Response:</h4>
                <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
                  {response}
                </pre>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">📋 For Production Deployment:</h4>
              <div className="text-blue-200/80 text-sm space-y-1">
                <p>1. Deploy your app to Vercel/Netlify</p>
                <p>2. Set <code>TELEGRAM_BOT_TOKEN</code> environment variable</p>
                <p>3. Set webhook: <code>curl -X POST "https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook" -d {`'{"url":"https://your-domain.com/api/telegram/webhook"}'`}</code></p>
                <p>4. Test commands directly in Telegram</p>
              </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-gray-300 font-semibold mb-2">🔍 Debug Info:</h4>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Chat ID: <code>{chatId}</code></p>
                <p>Environment: <code>localhost:3000</code></p>
                <p>Webhook Status: <span className="text-red-400">Not applicable (localhost)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}