import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Megaphone } from 'lucide-react';
import RichTextEditor from '../ui/RichTextEditor';

export default function PostAnnouncement() {
    const { addAnnouncement } = useData();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // Get plain text for validation
    const getPlainText = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate both title and content
        const plainContent = getPlainText(content);
        if (!title.trim() || !plainContent.trim()) {
            return;
        }

        addAnnouncement({
            id: Date.now(),
            title,
            content, // This is now HTML
            plainText: plainContent, // Store plain text for notifications
            date: new Date().toISOString().split('T')[0],
            author: user.name
        });

        setTitle('');
        setContent('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-blue-600" />
                    Post Announcement
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-field"
                            placeholder="e.g., Final Exam Schedule"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            placeholder="Write your announcement here..."
                            maxLength={1000}
                        />
                    </div>
                    <Button type="submit" className="w-full btn-primary">
                        Post Announcement
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
