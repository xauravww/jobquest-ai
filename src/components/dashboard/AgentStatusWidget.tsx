'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Power, RefreshCw, CheckCircle, Clock } from 'lucide-react';

const AgentStatusWidget = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [lastScan, setLastScan] = useState<Date | null>(new Date(Date.now() - 1000 * 60 * 5)); // 5 mins ago
    const [nextScan, setNextScan] = useState<Date | null>(new Date(Date.now() + 1000 * 60 * 10)); // in 10 mins
    const [scannedCount, setScannedCount] = useState(1240);

    const handleScanToggle = () => {
        setIsScanning(!isScanning);
    };

    return (
        <div className="w-full bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-light)] border border-[var(--border)] rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            {/* Background Pulse Effect */}
            {isScanning && (
                <div className="absolute inset-0 bg-[var(--primary)]/5 animate-pulse pointer-events-none" />
            )}

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Status Indicator */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isScanning
                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30 shadow-[0_0_30px_rgba(45,211,191,0.2)]'
                            : 'bg-[var(--bg-deep)] border border-[var(--border)]'
                        }`}>
                        <Activity className={`w-8 h-8 ${isScanning ? 'text-[var(--primary)] animate-pulse' : 'text-[var(--text-muted)]'}`} />
                        {isScanning && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-[var(--primary)] rounded-full animate-ping" />
                        )}
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            AI Agent Status
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${isScanning
                                    ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                                    : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--border)]'
                                }`}>
                                {isScanning ? 'Active' : 'Standby'}
                            </span>
                        </h2>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            {isScanning
                                ? 'Currently scanning job boards for new matches...'
                                : 'Waiting for scheduled scan cycle.'}
                        </p>
                    </div>
                </div>

                {/* Stats & Timers */}
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-center md:text-right">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-end">
                            <CheckCircle size={12} /> Scanned Today
                        </div>
                        <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
                            {scannedCount.toLocaleString()}
                        </div>
                    </div>

                    <div className="h-10 w-px bg-[var(--border)] hidden md:block" />

                    <div className="text-center md:text-right">
                        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-end">
                            <Clock size={12} /> Next Scan
                        </div>
                        <div className="text-lg font-mono font-medium text-[var(--primary)]">
                            {nextScan ? '10:00 min' : '--:--'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleScanToggle}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${isScanning
                                ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 hover:bg-[var(--danger)]/20'
                                : 'bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(45,211,191,0.3)] hover:shadow-[0_0_30px_rgba(45,211,191,0.5)] hover:-translate-y-0.5'
                            }`}
                    >
                        <Power size={18} />
                        {isScanning ? 'Stop Agent' : 'Run Now'}
                    </button>

                    <button className="p-3 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)]/30 transition-all">
                        <RefreshCw size={18} className={isScanning ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentStatusWidget;
