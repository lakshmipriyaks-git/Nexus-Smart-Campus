import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CheckCircle2, Circle, Clock, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KanbanBoard() {
    const { tasks, updateTaskStatus, addTask, deleteTask } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', date: '' });

    const columns = [
        { id: 'todo', title: 'To Do', icon: Circle, color: 'text-gray-500' },
        { id: 'in-progress', title: 'In Progress', icon: Clock, color: 'text-blue-500' },
        { id: 'done', title: 'Done', icon: CheckCircle2, color: 'text-green-500' },
    ];

    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-red-100 text-red-700'
    };

    const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

    const handleMove = (taskId, currentStatus) => {
        const statusOrder = ['todo', 'in-progress', 'done'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const nextStatus = statusOrder[currentIndex + 1];
        if (nextStatus) {
            updateTaskStatus(taskId, nextStatus);
        }
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        addTask(newTask);
        setNewTask({ title: '', description: '', priority: 'medium', date: '' });
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Task Board</h2>
                <Button onClick={() => setIsModalOpen(true)} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Add Task
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
                {columns.map((column, colIndex) => (
                    <motion.div
                        key={column.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: colIndex * 0.1 }}
                        className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 flex flex-col gap-3 h-full overflow-hidden"
                    >
                        <div className="flex items-center gap-2 mb-2 flex-none">
                            <column.icon className={`h-5 w-5 ${column.color}`} />
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{column.title}</h3>
                            <Badge variant="default" className="ml-auto">
                                {getTasksByStatus(column.id).length}
                            </Badge>
                        </div>

                        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2">
                            <AnimatePresence mode='popLayout'>
                                {getTasksByStatus(column.id).map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card
                                            className="cursor-pointer hover:shadow-md transition-all group relative bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600"
                                            onClick={() => handleMove(task.id, task.status)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge className={`text-[10px] px-1.5 py-0.5 ${priorityColors[task.priority] || priorityColors.medium}`}>
                                                        {task.priority}
                                                    </Badge>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteTask(task.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{task.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description}</p>
                                                {task.date && (
                                                    <div className="flex items-center text-xs text-gray-400">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {task.date}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {getTasksByStatus(column.id).length === 0 && (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                    No tasks
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md"
                        >
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add New Task</h3>
                                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleAddTask} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="input-field w-full bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                                value={newTask.title}
                                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                                placeholder="e.g., Study for Math"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                            <textarea
                                                className="input-field w-full min-h-[80px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                                value={newTask.description}
                                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                                placeholder="Add details..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                className="input-field w-full bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                                value={newTask.date}
                                                onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                            <div className="flex gap-2">
                                                {['low', 'medium', 'high'].map(p => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setNewTask({ ...newTask, priority: p })}
                                                        className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all border ${newTask.priority === p
                                                            ? priorityColors[p] + ' border-transparent ring-2 ring-offset-1 ring-gray-200 dark:ring-gray-700'
                                                            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-6">
                                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit">
                                                Add Task
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
