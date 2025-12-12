'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import FollowUpTracker from '@/components/FollowUpTracker';

const FollowUpsPage = () => {
    return (
        <AppLayout showFooter={false}>
            <div className="p-6 lg:p-10 min-h-screen bg-[var(--bg-deep)]">
                <FollowUpTracker />
            </div>
        </AppLayout>
    );
};

export default FollowUpsPage;
