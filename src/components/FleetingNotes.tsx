'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { StickyNote, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FleetingNote {
  id: string;
  content: string;
  source: 'web' | 'telegram';
  timestamp: string;
  userId: string;
  tags: string[];
  archived: boolean;
}

export default function FleetingNotes() {
  const [notes, setNotes] = useState<FleetingNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/notes/fleeting');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading fleeting notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notes/fleeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.trim(),
          source: 'web',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNote('');
        toast.success('📝 Fleeting note saved!');
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Error saving note');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/fleeting?id=${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast.success('Note deleted');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="p-6 pb-0">
        <h3 className="flex items-center gap-2 text-white text-lg font-semibold">
          <StickyNote className="w-5 h-5 text-yellow-400" />
          Fleeting Notes
          <span className="text-sm text-gray-400 font-normal">
            ({notes.length})
          </span>
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <textarea
            placeholder="Capture a quick thought, idea, or reminder..."
            value={newNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 resize-none rounded-md p-3"
            rows={2}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addNote();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Press Ctrl+Enter to save quickly
            </p>
            <Button
              onClick={addNote}
              disabled={!newNote.trim() || loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Telegram tip */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">💡 Telegram Tip</p>
              <p className="text-blue-200/80 mt-1">
                Send <code className="bg-blue-800/50 px-1 rounded text-xs">fleeting: Your idea here</code> to your Telegram bot to add notes instantly!
              </p>
            </div>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No fleeting notes yet</p>
              <p className="text-sm mt-1">Add your first quick thought above</p>
            </div>
          ) : (
            (showAll ? notes : notes.slice(0, 5)).map((note) => (
              <div
                key={note.id}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 group hover:bg-gray-700/70 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(note.timestamp)}
                      </span>
                      {note.source === 'telegram' && (
                        <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">
                          📱 Telegram
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteNote(note.id)}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-1 h-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Show more/less button */}
        {notes.length > 5 && (
          <div className="text-center pt-2 border-t border-gray-700">
            <Button
              onClick={() => setShowAll(!showAll)}
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:text-blue-300"
            >
              {showAll ? 'Show Less' : `Show All ${notes.length} Notes`}
            </Button>
          </div>
        )}

        {notes.length > 0 && (
          <div className="text-center pt-2 border-t border-gray-700 space-y-2">
            <p className="text-xs text-gray-400">
              {notes.filter(n => n.source === 'telegram').length} from Telegram • {notes.filter(n => n.source === 'web').length} from web
            </p>
            <a
              href="/fleeting-notes"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View all notes with full features
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}