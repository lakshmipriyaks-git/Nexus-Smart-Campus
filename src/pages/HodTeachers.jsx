import React, { useState } from 'react';
import { ShieldCheck, Mail, Search, ArrowLeft, BarChart2, UserMinus } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmModal from '../components/ui/ConfirmModal';
import AnalyticsDashboard from '../components/teacher/AnalyticsDashboard';
import AtRiskAnalysis from '../components/teacher/AtRiskAnalysis';
import TeacherPerformance from '../components/hod/TeacherPerformance';
import { useHodAdmin } from '../hooks/useHodAdmin';

export default function HodTeachers() {
    const { activeTeachers, hodLoading, removeTeacher } = useHodAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, teacher: null });

    const filteredTeachers = activeTeachers.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirmRemove = async () => {
        await removeTeacher(confirmModal.teacher.id);
        setConfirmModal({ isOpen: false, teacher: null });
        if (selectedTeacher?.id === confirmModal.teacher.id) setSelectedTeacher(null);
    };

    if (hodLoading) {
        return <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>;
    }

    if (selectedTeacher) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setSelectedTeacher(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            {selectedTeacher.profilePicture ? (
                                <img src={selectedTeacher.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 text-sm font-bold">
                                    {selectedTeacher.name?.[0] || 'T'}
                                </div>
                            )}
                            {selectedTeacher.name}'s Performance
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4" /> {selectedTeacher.email}
                        </p>
                    </div>
                </div>
                <TeacherPerformance targetTeacherId={selectedTeacher.id} />
                <AnalyticsDashboard targetTeacherId={selectedTeacher.id} />
                <AtRiskAnalysis targetTeacherId={selectedTeacher.id} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                        Active Teacher Directory
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {activeTeachers.length} active teacher{activeTeachers.length !== 1 ? 's' : ''} in the department.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Teacher</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTeachers.map(teacher => (
                                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                                                {teacher.profilePicture
                                                    ? <img src={teacher.profilePicture} alt={teacher.name} className="h-full w-full object-cover" />
                                                    : teacher.name?.[0] || 'T'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{teacher.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">ID: {teacher.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {teacher.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {teacher.createdAt ? new Date(teacher.createdAt.toDate?.() || teacher.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedTeacher(teacher)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                                            >
                                                <BarChart2 className="w-4 h-4" />
                                                Performance
                                            </button>
                                            <button
                                                onClick={() => setConfirmModal({ isOpen: true, teacher })}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTeachers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No active teachers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, teacher: null })}
                onConfirm={handleConfirmRemove}
                title="Remove Teacher"
                message={`Are you sure you want to remove "${confirmModal.teacher?.name}" from the department? Their classes will also be deleted. This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
