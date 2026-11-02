import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StickyNote, Plus, Trash2 } from 'lucide-react';

const TINT_BORDERS = [
    'border-l-[#ECA23B] dark:border-l-[#F59E0B] bg-[#ECA23B]/5 dark:bg-[#F59E0B]/5',
    'border-l-[#6558E8] dark:border-l-[#06B6D4] bg-[#6558E8]/5 dark:bg-[#06B6D4]/5',
    'border-l-[#22A875] dark:border-l-[#10B981] bg-[#22A875]/5 dark:bg-[#10B981]/5',
    'border-l-[#4389F5] dark:border-l-[#8B5CF6] bg-[#4389F5]/5 dark:bg-[#8B5CF6]/5'
];

export default function NotesWidget() {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const savedNotes = typeof localStorage !== 'undefined' ? localStorage.getItem('student_notes') : null;
        if (savedNotes) {
            try {
                setNotes(JSON.parse(savedNotes));
            } catch {
                setNotes([]);
            }
        } else {
            setNotes([
                { id: 1, text: 'Review Chapter 4 Algorithms (L2 Notes)', tint: 0 },
                { id: 2, text: 'Collect IEEE paper printout from Print Hub', tint: 1 }
            ]);
        }
    }, []);

    const saveNotes = (updatedNotes) => {
        setNotes(updatedNotes);
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('student_notes', JSON.stringify(updatedNotes));
        }
    };

    const addNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const note = {
            id: Date.now(),
            text: newNote.trim(),
            tint: Math.floor(Math.random() * TINT_BORDERS.length)
        };

        saveNotes([note, ...notes]);
        setNewNote('');
    };

    const deleteNote = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    return (
        <Card className="h-full flex flex-col bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E6F2] dark:border-[#1E2D4A]/60 bg-[#F8F9FE] dark:bg-[#0A0F1D]/50">
                <CardTitle className="text-sm font-bold flex items-center justify-between w-full font-display text-[#202442] dark:text-white">
                    <span className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-[#ECA23B] dark:text-[#F59E0B]" />
                        <span>Quick Notes & Memo</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ECA23B]/10 text-[#C87910] border border-[#ECA23B]/30 dark:bg-[#F59E0B]/15 dark:text-[#FBBF24] dark:border-[#F59E0B]/30 font-bold">
                        {notes.length} Active
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-3">
                <form onSubmit={addNote} className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Type a memo and press Enter..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-white text-xs placeholder:text-[#7E87A2] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4] transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-3 py-2 bg-[#6558E8] hover:bg-[#5446D7] text-white dark:bg-[#06B6D4] dark:hover:bg-[#22D3EE] dark:text-[#070A11] font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
                        title="Add Memo"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </form>

                <div className="space-y-2 overflow-y-auto flex-1 max-h-[160px] pr-1 custom-scrollbar">
                    {notes.map(note => {
                        const tintClass = TINT_BORDERS[note.tint % TINT_BORDERS.length] || TINT_BORDERS[0];
                        return (
                            <div
                                key={note.id}
                                className={`p-2.5 rounded-lg border-l-4 border border-[#E2E6F2] dark:border-[#1E2D4A] ${tintClass} relative group transition-all flex items-start justify-between gap-2`}
                            >
                                <p className="text-xs text-[#202442] dark:text-slate-100 font-medium leading-relaxed select-text">
                                    {note.text}
                                </p>
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[#7E87A2] hover:text-rose-500 transition-opacity p-0.5"
                                    title="Delete note"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                    {notes.length === 0 && (
                        <div className="text-center text-[#7E87A2] dark:text-slate-500 text-xs py-6 font-medium">
                            No notes added yet. Capture your quick campus reminders here.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
