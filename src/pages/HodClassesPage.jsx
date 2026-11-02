import React from 'react';
import { motion } from 'framer-motion';
import { Library, Users, GraduationCap, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DepartmentClassesView from '../components/hod/DepartmentClassesView';
import { useHodAdmin } from '../hooks/useHodAdmin';
import { DEPARTMENTS } from '../utils/constants';

export default function HodClassesPage() {
    const navigate = useNavigate();
    const {
        departmentClasses,
        selectedDepartment,
        setSelectedDepartment,
        deleteClass,
        hodLoading
    } = useHodAdmin();

    const currentDeptInfo = DEPARTMENTS.find(d => d.id === selectedDepartment) || { id: selectedDepartment, label: selectedDepartment };

    // Calculate aggregated statistics
    const totalEnrolled = departmentClasses.reduce((acc, c) => acc + (c.studentCount || 0), 0);
    const uniqueFaculty = new Set(departmentClasses.map(c => c.teacherId || c.teacherName).filter(Boolean)).size;

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
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                            Academic Directory
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Library className="h-6 w-6" />
                        </div>
                        {currentDeptInfo.label} Classes
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Viewing all classes, assigned faculty in-charge, and student enrollments for <strong>{selectedDepartment}</strong>.
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

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
                >
                    <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Library className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Total Classes</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{departmentClasses.length}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
                >
                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Faculty In-Charge</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{uniqueFaculty}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4"
                >
                    <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase">Enrolled Students</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{totalEnrolled}</p>
                    </div>
                </motion.div>
            </div>

            {/* Department Classes Main Component */}
            <DepartmentClassesView
                departmentClasses={departmentClasses}
                selectedDepartment={selectedDepartment}
                onDeleteClass={deleteClass}
            />
        </div>
    );
}
