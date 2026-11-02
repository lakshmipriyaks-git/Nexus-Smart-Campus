import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Clock, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * TeacherApprovalQueue
 * Shows all pending teacher registration requests with Approve / Reject actions.
 * Props: pendingTeachers, hodLoading, approveTeacher, rejectTeacher
 */
export default function TeacherApprovalQueue({ pendingTeachers, hodLoading, approveTeacher, rejectTeacher }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Teacher Approval Queue
                    {pendingTeachers.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            {pendingTeachers.length}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hodLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size="medium" />
                    </div>
                ) : pendingTeachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <CheckCircle2 className="h-10 w-10 text-green-400 mb-3" />
                        <p className="font-medium text-gray-700 dark:text-gray-300">All clear!</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No pending teacher requests at the moment.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        <AnimatePresence initial={false}>
                            {pendingTeachers.map((teacher) => (
                                <motion.li
                                    key={teacher.id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10"
                                >
                                    {/* Avatar + info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold flex-shrink-0">
                                            {teacher.name?.[0]?.toUpperCase() || 'T'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{teacher.name}</p>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                                    {teacher.departmentId || 'CSE'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                {teacher.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => approveTeacher(teacher.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
                                        >
                                            <UserCheck className="h-4 w-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => rejectTeacher(teacher.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </button>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
