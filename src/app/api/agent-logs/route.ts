import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import AgentCurlLog from '@/models/AgentCurlLog';
import { appendLocalLog, readRecentLocalLogs, clearLocalLogs } from '@/lib/agentLogStore';

// GET /api/agent-logs - read logs directly from local disk files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostname = searchParams.get('hostname') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Read directly from local disk files (data/agent-curl-logs/*.jsonl)
    const diskLogs = readRecentLocalLogs(limit, hostname);

    return NextResponse.json({
      success: true,
      count: diskLogs.length,
      logs: diskLogs,
    });
  } catch (error) {
    console.error('Fetch agent logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

// POST /api/agent-logs - save incoming extension logs to local disk file & DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.logs) ? body.logs : [body];
    const savedRecords = [];

    for (const item of items) {
      if (!item.curl || !item.url) continue;

      let hostname = item.hostname || '';
      let pathname = item.pathname || '';
      try {
        const u = new URL(item.url);
        hostname = hostname || u.hostname;
        pathname = pathname || u.pathname;
      } catch {}

      // NEVER log internal localhost API requests (prevents infinite loop & disk bloat)
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        item.url.includes('/api/agent-logs')
      ) {
        continue;
      }

      const entry = {
        id: String(item.id || Date.now() + Math.random().toString(36).substr(2, 4)),
        timestamp: item.timestamp || new Date().toLocaleTimeString(),
        method: (item.method || 'GET').toUpperCase(),
        url: item.url,
        hostname,
        pathname,
        curl: item.curl,
        headers: item.headers || {},
        requestBody: typeof item.requestBody === 'string' ? item.requestBody : JSON.stringify(item.requestBody || ''),
        responseStatus: item.responseStatus || null,
        responseStatusText: item.responseStatusText || '',
        responseHeaders: item.responseHeaders || {},
        responseBody: typeof item.responseBody === 'string' ? item.responseBody : JSON.stringify(item.responseBody || ''),
        createdAt: new Date().toISOString(),
      };

      // 1. Write immediately to local disk files (data/agent-curl-logs/)
      appendLocalLog(entry);

      // 2. Also save to MongoDB in background
      try {
        await connectDB();
        await AgentCurlLog.create({
          userEmail: item.userEmail || 'default@jobquest.local',
          ...entry,
        });
      } catch (dbErr) {
        // Disk write already succeeded; non-fatal
      }

      savedRecords.push(entry);
    }

    return NextResponse.json({
      success: true,
      persistedCount: savedRecords.length,
      logs: savedRecords,
    });
  } catch (error) {
    console.error('Persist agent logs error:', error);
    return NextResponse.json({ error: 'Failed to persist logs' }, { status: 500 });
  }
}

// DELETE /api/agent-logs - clear local disk files and DB records
export async function DELETE(request: NextRequest) {
  try {
    // 1. Wipe local disk files
    clearLocalLogs();

    // 2. Wipe DB records
    try {
      await connectDB();
      await AgentCurlLog.deleteMany({});
    } catch {}

    return NextResponse.json({ success: true, message: 'Local disk logs cleared' });
  } catch (error) {
    console.error('Delete agent logs error:', error);
    return NextResponse.json({ error: 'Failed to delete logs' }, { status: 500 });
  }
}
