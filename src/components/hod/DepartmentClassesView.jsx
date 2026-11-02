import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Users, Eye, X, GraduationCap, Calendar, UserCheck, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function DepartmentClassesView({ departmentClasses = [], selectedDepartment = 'CSE', onDeleteClass }) {
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClasses = departmentClasses.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Library className="h-5 w-5" />
                        </div>
                        <span>Department Classes & Enrolled Students</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {departmentClasses.length} {departmentClasses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                    </CardTitle>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search classes or faculty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {filteredClasses.length === 0 ? (
                    <div className="py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-400 mx-auto mb-3">
                            <Library className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {searchTerm ? 'No matching classes found' : `No classes created in ${selectedDepartment} yet`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Classes created by {selectedDepartment} faculty will appear here automatically in real-time.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold">Class Details</th>
                                    <th className="px-5 py-3.5 font-bold">Faculty In-Charge</th>
                                    <th className="px-5 py-3.5 font-bold">Department</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Enrolled Students</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Student List</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredClasses.map((cls) => {
                                    const studentCount = cls.studentCount || cls.approvedStudents?.length || 0;
                                    return (
                                        <tr key={cls.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900 dark:text-gray-100">{cls.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{cls.section || 'General'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                                                        {cls.teacherName?.[0] || 'F'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{cls.teacherName || 'Faculty'}</p>
                                                        <p className="text-[10px] text-gray-400">ID: {cls.teacherId?.slice(0, 6) || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                                                    {cls.departmentId || selectedDepartment}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                    studentCount > 0
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    <Users className="w-3.5 h-3.5" />
                                                    {studentCount} {studentCount === 1 ? 'student' : 'students'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedClass(cls)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 transition-colors shadow-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View Students ({studentCount})
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            {/* Students Modal */}
            <AnimatePresence>
                {selectedClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {selectedClass.name}
                                        </h2>
                                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                            {selectedClass.section || 'General'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Faculty In-Charge: <strong className="text-gray-700 dark:text-gray-300">{selectedClass.teacherName || 'Faculty'}</strong> · Department: <strong className="text-indigo-600 dark:text-indigo-400">{selectedClass.departmentId || selectedDepartment}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedClass(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                {(!selectedClass.allJoinedStudents || selectedClass.allJoinedStudents.length === 0) ? (
                                    <div className="py-12 text-center">
                                        <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">No students enrolled yet</p>
                                        <p className="text-xs text-gray-400 mt-1">When students join this class, they will appear here with timestamps.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Enrolled Students ({selectedClass.allJoinedStudents.length})
                                        </div>
                                        {selectedClass.allJoinedStudents.map((st, i) => (
                                            <div
                                                key={st.id || i}
                                                className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                                        {st.name?.[0] || 'S'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{st.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">ID: {st.id || 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {st.date}
                                                    </span>
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                        Enrolled
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => setSelectedClass(null)}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Card>
    );
}
