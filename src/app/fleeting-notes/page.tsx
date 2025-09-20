'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Search,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Archive,
  Tag
} from 'lucide-react';
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

const NOTES_PER_PAGE = 10;

export default function FleetingNotesPage() {
  const [notes, setNotes] = useState<FleetingNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<FleetingNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'web' | 'telegram'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredNotes.length / NOTES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
  const endIndex = startIndex + NOTES_PER_PAGE;
  const currentNotes = filteredNotes.slice(startIndex, endIndex);

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Filter notes when search/filter changes
  useEffect(() => {
    let filtered = notes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by source
    if (filterSource !== 'all') {
      filtered = filtered.filter(note => note.source === filterSource);
    }

    // Filter by archived status
    filtered = filtered.filter(note => note.archived === showArchived);

    setFilteredNotes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [notes, searchQuery, filterSource, showArchived]);

  const loadNotes = async () => {
    try {
      const response = await fetch('/api/notes/fleeting');
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading fleeting notes:', error);
      toast.error('Failed to load notes');
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch('/api/notes/fleeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote.trim(),
          source: 'web',
          timestamp: new Date().toISOString(),
          tags
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => [data.note, ...prev]);
        setNewNote('');
        setNewTags('');
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

  const updateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const tags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch('/api/notes/fleeting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          content: editContent.trim(),
          tags
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => prev.map(note => 
          note.id === noteId ? data.note : note
        ));
        setEditingNote(null);
        setEditContent('');
        setEditTags('');
        toast.success('Note updated!');
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error updating note');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

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

  const toggleArchive = async (noteId: string, archived: boolean) => {
    try {
      const response = await fetch('/api/notes/fleeting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: noteId,
          archived: !archived
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(prev => prev.map(note => 
          note.id === noteId ? data.note : note
        ));
        toast.success(archived ? 'Note unarchived' : 'Note archived');
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error updating note');
    }
  };

  const startEditing = (note: FleetingNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
    setEditTags('');
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

  const clearFilters = () => {
    setSearchQuery('');
    setFilterSource('all');
    setShowArchived(false);
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <StickyNote className="w-10 h-10 text-yellow-400" />
              Fleeting Notes
            </h1>
            <p className="text-text-muted text-lg">
              Capture quick thoughts, ideas, and reminders
            </p>
          </div>

          {/* Add new note */}
          <div className="bg-bg-card rounded-xl p-6 border border-border mb-8">
            <h3 className="text-white text-lg font-semibold mb-4">Add New Note</h3>
            <div className="space-y-4">
              <textarea
                placeholder="Capture a quick thought, idea, or reminder..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-bg-light border border-border text-white placeholder-text-muted resize-none rounded-lg p-4"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addNote();
                  }
                }}
              />
              <FormInput
                placeholder="Tags (comma-separated)"
                value={newTags}
                onChange={setNewTags}
                icon={<Tag className="w-4 h-4" />}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-text-muted">
                  Press Ctrl+Enter to save quickly
                </p>
                <Button
                  onClick={addNote}
                  disabled={!newNote.trim() || loading}
                  className="bg-primary hover:bg-primary/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
          </div>

          {/* Telegram tip */}
          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 font-medium mb-2">💡 Telegram Integration</p>
                <p className="text-blue-200/80 text-sm">
                  Send <code className="bg-blue-800/50 px-2 py-1 rounded text-xs">fleeting: Your idea here</code> to your Telegram bot to add notes instantly from anywhere!
                </p>
              </div>
            </div>
          </div>

          {/* Search and filters */}
          <div className="bg-bg-card rounded-xl p-6 border border-border mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <FormInput
                placeholder="Search notes and tags..."
                value={searchQuery}
                onChange={setSearchQuery}
                icon={<Search className="w-4 h-4" />}
              />
              
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as any)}
                className="px-4 py-3 bg-bg-light border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="web">Web Only</option>
                <option value="telegram">Telegram Only</option>
              </select>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowArchived(!showArchived)}
                  variant={showArchived ? "default" : "outline"}
                  className="flex-1"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </Button>
                
                {(searchQuery || filterSource !== 'all' || showArchived) && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Active filters display */}
            {(searchQuery || filterSource !== 'all' || showArchived) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <span className="text-sm text-text-muted">Active filters:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    Search: "{searchQuery}"
                  </span>
                )}
                {filterSource !== 'all' && (
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    Source: {filterSource}
                  </span>
                )}
                {showArchived && (
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    Archived
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-card rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-white">{notes.length}</div>
              <div className="text-text-muted text-sm">Total Notes</div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-blue-400">
                {notes.filter(n => n.source === 'telegram').length}
              </div>
              <div className="text-text-muted text-sm">From Telegram</div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-green-400">
                {notes.filter(n => n.source === 'web').length}
              </div>
              <div className="text-text-muted text-sm">From Web</div>
            </div>
            <div className="bg-bg-card rounded-lg p-4 border border-border">
              <div className="text-2xl font-bold text-yellow-400">
                {notes.filter(n => n.archived).length}
              </div>
              <div className="text-text-muted text-sm">Archived</div>
            </div>
          </div>

          {/* Notes list */}
          <div className="bg-bg-card rounded-xl border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-white text-lg font-semibold">
                  {showArchived ? 'Archived Notes' : 'Active Notes'} ({filteredNotes.length})
                </h3>
                
                {/* Pagination info */}
                {totalPages > 1 && (
                  <div className="text-text-muted text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {currentNotes.length === 0 ? (
                <div className="text-center py-12 text-text-muted">
                  <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">
                    {showArchived ? 'No archived notes' : 'No notes found'}
                  </p>
                  <p className="text-sm">
                    {searchQuery || filterSource !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Add your first quick thought above'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-bg-light/50 border border-border rounded-lg p-4 group hover:bg-bg-light/70 transition-colors"
                    >
                      {editingNote === note.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-bg-light border border-border text-white resize-none rounded-lg p-3"
                            rows={3}
                          />
                          <FormInput
                            placeholder="Tags (comma-separated)"
                            value={editTags}
                            onChange={setEditTags}
                            icon={<Tag className="w-4 h-4" />}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateNote(note.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-500"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={cancelEditing}
                              size="sm"
                              variant="outline"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white leading-relaxed whitespace-pre-wrap break-words mb-3">
                              {note.content}
                            </p>
                            
                            {/* Tags */}
                            {note.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {note.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-text-muted">
                              <span>{formatTimestamp(note.timestamp)}</span>
                              {note.source === 'telegram' && (
                                <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">
                                  📱 Telegram
                                </span>
                              )}
                              {note.archived && (
                                <span className="bg-yellow-600/20 text-yellow-300 px-2 py-0.5 rounded-full">
                                  📦 Archived
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={() => startEditing(note)}
                              size="sm"
                              variant="ghost"
                              className="text-text-muted hover:text-blue-400 hover:bg-blue-900/20 p-2 h-auto"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => toggleArchive(note.id, note.archived)}
                              size="sm"
                              variant="ghost"
                              className="text-text-muted hover:text-yellow-400 hover:bg-yellow-900/20 p-2 h-auto"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteNote(note.id)}
                              size="sm"
                              variant="ghost"
                              className="text-text-muted hover:text-red-400 hover:bg-red-900/20 p-2 h-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-border">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 py-1 text-text-muted">...</span>
                        <Button
                          onClick={() => setCurrentPage(totalPages)}
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          className="w-10"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}