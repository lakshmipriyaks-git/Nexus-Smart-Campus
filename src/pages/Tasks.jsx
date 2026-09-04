import React from 'react';
import KanbanBoard from '../components/student/KanbanBoard';

export default function Tasks() {
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 px-6 pt-6">My Tasks</h1>
            <div className="flex-1 overflow-hidden px-6 pb-6">
                <KanbanBoard />
            </div>
        </div>
    );
}
