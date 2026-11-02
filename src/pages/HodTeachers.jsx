import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Search, ArrowLeft, BarChart2, UserMinus, Clock, Users, Building2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmModal from '../components/ui/ConfirmModal';
import AnalyticsDashboard from '../components/teacher/AnalyticsDashboard';
import AtRiskAnalysis from '../components/teacher/AtRiskAnalysis';
import TeacherPerformance from '../components/hod/TeacherPerformance';
import TeacherApprovalQueue from '../components/hod/TeacherApprovalQueue';
import { useHodAdmin } from '../hooks/useHodAdmin';
import { DEPARTMENTS } from '../utils/constants';

export default function HodTeachers() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {
        activeTeachers,
        pendingTeachers,
        hodLoading,
        removeTeacher,
        approveTeacher,
        rejectTeacher,
        selectedDepartment,
        setSelectedDepartment
    } = useHodAdmin();

    const currentTab = searchParams.get('tab') === 'pending' ? 'pending' : 'active';
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, teacher: null });

    const currentDeptInfo = DEPARTMENTS.find(d => d.id === selectedDepartment) || { id: selectedDepartment, label: selectedDepartment };

    const filteredTeachers = activeTeachers.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirmRemove = async () => {
        await removeTeacher(confirmModal.teacher.id);
        setConfirmModal({ isOpen: false, teacher: null });
        if (selectedTeacher?.id === confirmModal.teacher.id) setSelectedTeacher(null);
    };

    const handleTabChange = (tab) => {
        setSearchParams(tab === 'pending' ? { tab: 'pending' } : {});
    };

    if (hodLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (selectedTeacher) {
        return (
            <div className="space-y-6 animate-fadeIn">
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
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Dashboard</span>
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                            Faculty Management
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Users className="h-6 w-6" />
                        </div>
                        {currentDeptInfo.label} Faculty Portal
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Manage active teachers, evaluate subject performances, and approve pending faculty registrations for <strong>{selectedDepartment}</strong>.
                    </p>
                </div>

                {/* Department Switcher */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                    <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Department:</span>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer pr-1"
                    >
                        {DEPARTMENTS.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                {dept.id} — {dept.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tab Navigation Pill Bar */}
            <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl max-w-md">
                <button
                    onClick={() => handleTabChange('active')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        currentTab === 'active'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Active Faculty</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        currentTab === 'active'
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                        {activeTeachers.length}
                    </span>
                </button>

                <button
                    onClick={() => handleTabChange('pending')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        currentTab === 'pending'
                            ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>Pending Approvals</span>
                    {pendingTeachers.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                            {pendingTeachers.length}
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-500">
                            0
                        </span>
                    )}
                </button>
            </div>

            {/* TAB CONTENT: PENDING APPROVALS */}
            {currentTab === 'pending' && (
                <div className="space-y-4">
                    <TeacherApprovalQueue
                        pendingTeachers={pendingTeachers}
                        hodLoading={hodLoading}
                        approveTeacher={approveTeacher}
                        rejectTeacher={rejectTeacher}
                    />
                </div>
            )}

            {/* TAB CONTENT: ACTIVE TEACHERS */}
            {currentTab === 'active' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                {selectedDepartment} Approved Teachers
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {activeTeachers.length} verified teacher{activeTeachers.length !== 1 ? 's' : ''} currently active in {selectedDepartment}.
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{teacher.name}</p>
                                                        <p className="text-[11px] text-gray-400">ID: {teacher.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    {teacher.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                                {teacher.createdAt ? new Date(teacher.createdAt.toDate?.() || teacher.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedTeacher(teacher)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors"
                                                    >
                                                        <BarChart2 className="w-3.5 h-3.5" />
                                                        Performance
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, teacher })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                                No active teachers found in {selectedDepartment}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

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
