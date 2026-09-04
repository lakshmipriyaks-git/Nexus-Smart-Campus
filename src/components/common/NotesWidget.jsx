import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { StickyNote, Plus, Trash2 } from 'lucide-react';

export default function NotesWidget() {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const savedNotes = localStorage.getItem('student_notes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        } else {
            setNotes([
                { id: 1, text: 'Review Chapter 4 for Math', color: 'bg-yellow-100' },
                { id: 2, text: 'Buy new graph paper', color: 'bg-blue-100' }
            ]);
        }
    }, []);

    const saveNotes = (updatedNotes) => {
        setNotes(updatedNotes);
        localStorage.setItem('student_notes', JSON.stringify(updatedNotes));
    };

    const addNote = (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        const colors = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const note = {
            id: Date.now(),
            text: newNote,
            color: randomColor
        };

        saveNotes([note, ...notes]);
        setNewNote('');
    };

    const deleteNote = (id) => {
        saveNotes(notes.filter(n => n.id !== id));
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <StickyNote className="h-4 w-4 text-yellow-500" />
                    Quick Notes
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <form onSubmit={addNote} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 input-field py-1.5"
                    />
                    <button
                        type="submit"
                        className="p-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </form>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`${note.color} dark:bg-opacity-80 p-3 rounded-lg text-sm text-gray-800 dark:text-gray-900 relative group transition-all hover:shadow-sm`}
                        >
                            <p>{note.text}</p>
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className="text-center text-gray-400 dark:text-gray-500 text-xs py-8">
                            No notes yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
