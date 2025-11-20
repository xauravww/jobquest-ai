'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';

const ChatPage = () => {
  return (
    <AppLayout>
      <div className="p-4 md:p-8 bg-bg min-h-screen">
        <h1 className="text-3xl font-bold text-white mb-6">Chat</h1>
        <div className="bg-bg-card rounded-xl shadow-lg border border-border p-6">
          <p className="text-text-muted">Chat functionality coming soon...</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;