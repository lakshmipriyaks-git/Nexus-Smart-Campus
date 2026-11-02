import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, CheckSquare, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export default function CalendarWidget() {
    const { tasks = [], addTask, deleteTask, events = [], addEvent, deleteEvent } = useData() || {};
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [newItem, setNewItem] = useState('');
    const [itemType, setItemType] = useState('task'); // 'task' or 'event'

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.trim() || !selectedDate) return;

        const dateStr = selectedDate.toISOString().split('T')[0];

        if (itemType === 'task') {
            addTask({
                title: newItem,
                dueDate: dateStr,
                status: 'todo',
                priority: 'medium'
            });
        } else {
            addEvent({
                title: newItem,
                date: dateStr,
                type: 'academic'
            });
        }

        setNewItem('');
        setSelectedDate(null);
    };

    // Combine tasks and events for the current view
    const allItems = [
        ...tasks.map(t => ({ ...t, type: 'task', date: t.dueDate })),
        ...events.map(e => ({ ...e, type: 'event', date: e.date }))
    ].filter(item => item.date);

    const getItemsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return allItems.filter(item => item.date === dateStr);
    };

    const generateCalendarDays = () => {
        const totalDays = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate);
        const calendarDays = [];

        // Add blank days for previous month
        for (let i = 0; i < startDay; i++) {
            calendarDays.push(null);
        }

        // Add current month days
        for (let i = 1; i <= totalDays; i++) {
            calendarDays.push(i);
        }

        return calendarDays;
    };

    const todayDate = new Date();
    const isCurrentMonth = currentDate.getMonth() === todayDate.getMonth() && currentDate.getFullYear() === todayDate.getFullYear();

    return (
        <Card className="h-full flex flex-col relative bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E6F2] dark:border-[#1E2D4A]/60 bg-[#F8F9FE] dark:bg-[#0A0F1D]/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#202442] dark:text-white font-display">
                    <CalendarIcon className="h-4 w-4 text-[#6558E8] dark:text-[#06B6D4]" />
                    <span>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </CardTitle>
                <div className="flex gap-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 rounded-lg text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white hover:bg-[#EEF1FC] dark:hover:bg-[#111A2E] transition-colors"
                        title="Previous Month"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 rounded-lg text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white hover:bg-[#EEF1FC] dark:hover:bg-[#111A2E] transition-colors"
                        title="Next Month"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-3">
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    {days.map(day => (
                        <div key={day} className="text-[#7E87A2] dark:text-slate-400 font-mono text-[11px] font-bold py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1">
                    {generateCalendarDays().map((day, index) => {
                        const isToday = isCurrentMonth && day === todayDate.getDate();
                        const isSelected = selectedDate && day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();
                        const dayItems = getItemsForDay(day);

                        return (
                            <div
                                key={index}
                                onClick={() => day && handleDateClick(day)}
                                className={`
                                    aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all relative text-xs font-semibold select-none
                                    ${!day ? 'invisible pointer-events-none' : ''}
                                    ${isSelected
                                        ? 'bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] font-bold shadow-md shadow-[#6558E8]/25 dark:shadow-[0_0_12px_rgba(6,182,212,0.45)]'
                                        : isToday
                                            ? 'border-2 border-[#6558E8] dark:border-[#22D3EE] text-[#6558E8] dark:text-[#22D3EE] bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 font-bold'
                                            : 'text-[#202442] dark:text-slate-200 hover:bg-[#6558E8]/10 dark:hover:bg-[#111A2E] hover:text-[#6558E8] dark:hover:text-white'}
                                `}
                            >
                                <span className="z-10">{day}</span>
                                {day && dayItems.length > 0 && (
                                    <div className="flex gap-0.5 mt-0.5 justify-center">
                                        {dayItems.slice(0, 3).map((item, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    isSelected || isToday
                                                        ? 'bg-white dark:bg-[#070A11]'
                                                        : item.type === 'task'
                                                            ? 'bg-[#22A875] dark:bg-[#10B981]'
                                                            : 'bg-[#6558E8] dark:bg-[#06B6D4]'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Upcoming Items List */}
                <div className="mt-3 pt-3 border-t border-[#E2E6F2] dark:border-[#1E2D4A]/60 space-y-2 overflow-y-auto max-h-[90px]">
                    <div className="text-[10px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                        Events & Tasks · {months[currentDate.getMonth()]}
                    </div>
                    {allItems
                        .filter(item => new Date(item.date).getMonth() === currentDate.getMonth())
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map(item => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs group ${
                                    item.type === 'task'
                                        ? 'bg-[#22A875]/10 border-[#22A875]/25 text-[#202442] dark:text-slate-200'
                                        : 'bg-[#6558E8]/10 border-[#6558E8]/25 text-[#202442] dark:text-slate-200'
                                }`}
                            >
                                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    item.type === 'task'
                                        ? 'bg-[#22A875]/20 text-[#22A875] dark:text-[#34D399]'
                                        : 'bg-[#6558E8]/20 text-[#6558E8] dark:text-[#22D3EE]'
                                }`}>
                                    {new Date(item.date).getDate()}
                                </div>
                                <div className="text-xs text-[#202442] dark:text-white truncate flex-1 font-medium">{item.title}</div>
                                <button
                                    onClick={() => item.type === 'task' ? deleteTask(item.id) : deleteEvent(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[#7E87A2] hover:text-rose-500 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    {allItems.filter(item => new Date(item.date).getMonth() === currentDate.getMonth()).length === 0 && (
                        <div className="text-xs text-[#7E87A2] dark:text-slate-500 text-center py-2">No active items for this month</div>
                    )}
                </div>
            </CardContent>

            {/* Add Item Modal */}
            {selectedDate && (
                <div className="absolute inset-0 bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-5 rounded-2xl border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-xl">
                    <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-[#E2E6F2] dark:border-[#1E2D4A]">
                        <h3 className="font-bold text-[#202442] dark:text-white text-xs">
                            Add to {months[selectedDate.getMonth()]} {selectedDate.getDate()}
                        </h3>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-[#7E87A2] hover:text-[#202442] dark:hover:text-white p-1 rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleAddItem} className="w-full space-y-3">
                        <div className="flex gap-2 p-1 bg-[#EEF1FC] dark:bg-[#0A0F1D] rounded-full border border-[#E2E6F2] dark:border-[#1E2D4A]">
                            <button
                                type="button"
                                onClick={() => setItemType('task')}
                                className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                                    itemType === 'task'
                                        ? 'bg-[#22A875] dark:bg-[#10B981] text-white dark:text-[#070A11] shadow-xs'
                                        : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                                }`}
                            >
                                Task
                            </button>
                            <button
                                type="button"
                                onClick={() => setItemType('event')}
                                className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                                    itemType === 'event'
                                        ? 'bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] shadow-xs'
                                        : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                                }`}
                            >
                                Event
                            </button>
                        </div>
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-white text-xs placeholder:text-[#7E87A2] dark:placeholder:text-slate-500 focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4]"
                            placeholder={itemType === 'task' ? "Task description..." : "Event title..."}
                            value={newItem}
                            onChange={e => setNewItem(e.target.value)}
                        />
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setSelectedDate(null)}
                                className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-[#EEF1FC] dark:bg-[#0A0F1D] text-[#59627E] dark:text-slate-300 border border-[#E2E6F2] dark:border-[#1E2D4A] hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] hover:bg-[#5446D7] dark:hover:bg-[#22D3EE] shadow-sm"
                            >
                                Add {itemType === 'task' ? 'Task' : 'Event'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </Card>
    );
}
