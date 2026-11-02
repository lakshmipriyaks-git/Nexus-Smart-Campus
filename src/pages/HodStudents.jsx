import React, { useState } from 'react';
import { GraduationCap, Mail, Search, UserMinus, ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useHodAdmin } from '../hooks/useHodAdmin';
import { DEPARTMENTS } from '../utils/constants';

export default function HodStudents() {
    const navigate = useNavigate();
    const {
        allStudents,
        hodLoading,
        removeStudent,
        selectedDepartment,
        setSelectedDepartment
    } = useHodAdmin();

    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null });

    const currentDeptInfo = DEPARTMENTS.find(d => d.id === selectedDepartment) || { id: selectedDepartment, label: selectedDepartment };

    const filteredStudents = allStudents.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.usn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirmRemove = async () => {
        await removeStudent(confirmModal.student.id);
        setConfirmModal({ isOpen: false, student: null });
    };

    if (hodLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <LoadingSpinner size="large" />
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
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            Student Directory
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        {currentDeptInfo.label} Students
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Viewing registered and enrolled learners for <strong>{selectedDepartment}</strong>.
                    </p>
                </div>

                {/* Department Switcher */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                    <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Department:</span>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="bg-transparent text-xs font-bold text-purple-600 dark:text-purple-400 focus:outline-none cursor-pointer pr-1"
                    >
                        {DEPARTMENTS.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                {dept.id} — {dept.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Enrolled Students ({allStudents.length})
                    </h2>
                    <p className="text-xs text-gray-400">
                        Students associated with {selectedDepartment} department or classes.
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students by name, USN, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Student & USN</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold overflow-hidden">
                                                {student.profilePicture
                                                    ? <img src={student.profilePicture} alt={student.name} className="h-full w-full object-cover" />
                                                    : student.name?.[0] || 'S'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{student.name}</p>
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
                                                        {student.usn || '1KS21CS001'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-400">ID: {student.id?.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {student.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                        {student.createdAt ? new Date(student.createdAt.toDate?.() || student.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setConfirmModal({ isOpen: true, student })}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                                        >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        No registered students found in {selectedDepartment}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, student: null })}
                onConfirm={handleConfirmRemove}
                title="Remove Student"
                message={`Are you sure you want to remove "${confirmModal.student?.name}" from ${selectedDepartment}? This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
