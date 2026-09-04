import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

export default function CalendarWidget() {
    const { events, addEvent, deleteEvent, tasks, addTask, deleteTask } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [itemType, setItemType] = useState('task'); // 'task' or 'event'

    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        if (!day) return; // Prevent clicking on empty slots
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.trim() || !selectedDate) return;

        const dateStr = selectedDate.toISOString().split('T')[0];

        if (itemType === 'task') {
            addTask({
                title: newItem,
                description: '',
                priority: 'medium',
                date: dateStr
            });
        } else {
            addEvent({
                title: newItem,
                date: dateStr
            });
        }
        setNewItem('');
        setSelectedDate(null);
    };

    const getItemsForDay = (day) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
        const dayEvents = events.filter(e => e.date === dateStr).map(e => ({ ...e, type: 'event' }));
        const dayTasks = tasks.filter(t => t.date === dateStr).map(t => ({ ...t, type: 'task' }));
        return [...dayEvents, ...dayTasks];
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const daysArr = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            daysArr.push(null);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            daysArr.push(i);
        }

        return daysArr;
    };

    // Combine events and tasks for the list view
    const allItems = [
        ...events.map(e => ({ ...e, type: 'event' })),
        ...tasks.filter(t => t.date).map(t => ({ ...t, type: 'task' }))
    ];

    return (
        <Card className="h-full flex flex-col relative">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <CalendarIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-1">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    {days.map(day => (
                        <div key={day} className="text-gray-400 dark:text-gray-500 font-medium py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1">
                    {generateCalendarDays().map((day, index) => (
                        <div
                            key={index}
                            onClick={() => day && handleDateClick(day)}
                            className={`
                                aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all relative
                                ${!day ? 'invisible' : ''}
                                ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
                                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <span className="z-10">{day}</span>
                            {day && getItemsForDay(day).length > 0 && (
                                <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                                    {getItemsForDay(day).slice(0, 4).map((item, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full ${item.type === 'task' ? 'bg-green-500 dark:bg-green-400' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Upcoming Items List */}
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[100px]">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Month</div>
                    {allItems
                        .filter(item => new Date(item.date).getMonth() === currentDate.getMonth())
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map(item => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`flex items-center gap-3 p-2 rounded-lg border group ${item.type === 'task' ? 'bg-green-50/50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800'
                                    }`}
                            >
                                <div className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'task' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                    }`}>
                                    {new Date(item.date).getDate()}
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{item.title}</div>
                                <button
                                    onClick={() => item.type === 'task' ? deleteTask(item.id) : deleteEvent(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    {allItems.filter(item => new Date(item.date).getMonth() === currentDate.getMonth()).length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-2">No events or tasks this month</div>
                    )}
                </div>
            </CardContent>

            {/* Add Item Modal */}
            {selectedDate && (
                <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 rounded-2xl">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Add to {months[selectedDate.getMonth()]} {selectedDate.getDate()}
                    </h3>
                    <form onSubmit={handleAddItem} className="w-full space-y-3">
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setItemType('task')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${itemType === 'task' ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                Task
                            </button>
                            <button
                                type="button"
                                onClick={() => setItemType('event')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${itemType === 'event' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                Event
                            </button>
                        </div>
                        <input
                            type="text"
                            autoFocus
                            className="input-field w-full bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            placeholder={itemType === 'task' ? "Task title..." : "Event title..."}
                            value={newItem}
                            onChange={e => setNewItem(e.target.value)}
                        />
                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setSelectedDate(null)} className="flex-1 btn-secondary">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 btn-primary">
                                Add
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </Card>
    );
}
