import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Award, ArrowUpRight, TrendingUp, Presentation, CheckCircle, AlertCircle, X, BarChart2 } from 'lucide-react';
import { getVtuGrade, calculateSgpa, calculateCgpa, cgpaToPercentage } from '../../utils/vtuCalculator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const PIE_COLORS = {
    'O': '#6366f1', // Indigo
    'A+': '#10b981', // Emerald
    'A': '#34d399', // Emerald lighter
    'B+': '#3b82f6', // Blue
    'B': '#60a5fa', // Blue lighter
    'C': '#eab308', // Yellow
    'P': '#facc15', // Yellow lighter
    'F': '#ef4444' // Red
};

export default function VtuPerformanceModal({ isOpen, onClose, studentName, studentId, studentClass, currentSubjects }) {
    
    // Process the provided currentSubjects (e.g., from CieSee marks or AtRiskAnalysis marks)
    const processedSubjects = useMemo(() => {
        if (!currentSubjects || currentSubjects.length === 0) return [];
        return currentSubjects.map(sub => {
            // Determine percentage from marks. Assuming out of 100 unless maxMarks is specified.
            const percentage = sub.percentage || (sub.totalMarks ? (sub.totalMarks / (sub.maxMarks || 100)) * 100 : 0);
            const { grade, point } = getVtuGrade(percentage);
            const credits = sub.credits || 4; // Mock 4 credits if absent

            return {
                name: sub.name || sub.subject_code || 'Unknown Subject',
                percentage,
                credits,
                grade,
                point,
                totalPoints: credits * point
            };
        });
    }, [currentSubjects]);

    // Calculate Current SGPA
    const sgpa = calculateSgpa(processedSubjects);

    // Mock Past Semesters to demonstrate CGPA Calculation
    // In a real scenario, this would come from a student's historical academic records in the database.
    const historicalSemesters = [
        { id: 'sem1', name: 'Semester 1', sgpa: 7.5 },
        { id: 'sem2', name: 'Semester 2', sgpa: 8.2 },
        { id: 'sem3', name: 'Semester 3', sgpa: 7.8 },
        // Append the current SGPA if it evaluates to > 0
        ...(sgpa > 0 ? [{ id: 'current', name: 'Current Semester', sgpa: sgpa }] : [])
    ];

    const cgpa = calculateCgpa(historicalSemesters);
    const percentageEq = cgpaToPercentage(cgpa);

    const pieDataMap = processedSubjects.reduce((acc, sub) => {
        const grade = sub.grade;
        if (!acc[grade]) acc[grade] = 0;
        acc[grade] += Number(sub.credits) || 0;
        return acc;
    }, {});
    const pieData = Object.keys(pieDataMap)
        .filter(grade => pieDataMap[grade] > 0)
        .map(grade => ({
            name: grade,
            value: Number(pieDataMap[grade])
        }));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sm:py-12 bg-black/50 backdrop-blur-sm overflow-y-auto pt-24 pb-24">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                    className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden shadow-black/50 my-auto"
                >
                    {/* Header Strip */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8">
                        <div className="flex items-start gap-4 mb-8 border-b border-gray-800 pb-6">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">VTU Academic Analysis</h2>
                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                                    <span className="font-medium text-gray-300">{studentName || 'Student'}</span>
                                    {studentId && <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700">{studentId}</span>}
                                    {studentClass && <span>{studentClass}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Top KPI Cards (SGPA, CGPA, Percent) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            {/* SGPA Card */}
                            <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <Presentation className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-300 text-sm tracking-wide">Current SGPA</h3>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-white tracking-tight">{sgpa.toFixed(2)}</span>
                                    <span className="text-gray-500 font-medium pb-1">/ 10</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <Calculator className="w-3 h-3" /> Average grade point of this semester
                                </p>
                            </div>

                            {/* CGPA Card */}
                            <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-300 text-sm tracking-wide">Overall CGPA</h3>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-white tracking-tight">{cgpa.toFixed(2)}</span>
                                    <span className="text-gray-500 font-medium pb-1">/ 10</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <Calculator className="w-3 h-3" /> Cumulative average across all sems
                                </p>
                            </div>

                            {/* VTU Percentage Card */}
                            <div className="p-5 rounded-2xl bg-gray-800/40 border border-gray-700/50 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-300 text-sm tracking-wide">VTU Percentage</h3>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-white tracking-tight">{percentageEq.toFixed(1)}</span>
                                    <span className="text-gray-500 font-medium pb-1">%</span>
                                </div>
                                <p className="text-xs text-emerald-500/80 mt-2 font-medium bg-emerald-500/10 py-1 px-2 rounded-md inline-flex">
                                    (CGPA - 0.75) × 10
                                </p>
                            </div>
                        </div>

                        {/* Middle Section: Visualizations */}
                        {processedSubjects.length > 0 && (
                            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Bar Chart: Grade Points per Subject */}
                                <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
                                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                                        <BarChart2 className="w-4 h-4" />
                                        Points Per Subject
                                    </h4>
                                    <div className="h-[250px] w-full mt-2">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={processedSubjects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#4B5563' }} />
                                                <YAxis domain={[0, 10]} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#4B5563' }} />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                                />
                                                <Bar dataKey="point" name="Grade Point" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Pie Chart: Credit Distribution by Grade */}
                                <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
                                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                                        <Award className="w-4 h-4" />
                                        Credits by Grade
                                    </h4>
                                    <div className="h-[250px] w-full flex items-center justify-center relative">
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#6B7280'} stroke="transparent" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    formatter={(value, name) => [`${value} Credits`, `Grade ${name}`]}
                                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-3xl font-bold text-white">{processedSubjects.reduce((sum, s) => sum + s.credits, 0)}</span>
                                            <span className="text-xs text-gray-400">Total Credits</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grade Points Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                Current Semester Breakdown
                                <span className="text-xs py-0.5 px-2 bg-gray-800 border border-gray-700 rounded-full text-gray-400 font-normal">
                                    {processedSubjects.length} Subjects recorded
                                </span>
                            </h3>

                            {processedSubjects.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/20">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs uppercase bg-gray-800/80 text-gray-400 font-medium tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Subject</th>
                                                <th className="px-6 py-4 text-center">Marks (%)</th>
                                                <th className="px-6 py-4 text-center">Grade</th>
                                                <th className="px-6 py-4 text-center">Grade Point (GP)</th>
                                                <th className="px-6 py-4 text-center">Credits (C)</th>
                                                <th className="px-6 py-4 text-right text-white">Total (C × GP)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {processedSubjects.map((sub, i) => (
                                                <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-200">
                                                        {sub.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-400">
                                                        {sub.percentage.toFixed(0)}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${
                                                            sub.grade === 'O' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                                                            sub.grade.includes('A') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                            sub.grade.includes('B') ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                            sub.grade === 'C' || sub.grade === 'P' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                                            'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}>
                                                            {sub.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-gray-300">
                                                        {sub.point}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-gray-400">
                                                        {sub.credits}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-gray-200">
                                                        {sub.totalPoints}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Footer Row for SGPA summary */}
                                            <tr className="bg-gray-800/60 border-t-2 border-gray-700">
                                                <td colSpan={4} className="px-6 py-4 text-right text-gray-400 font-medium">
                                                    Total Credits = <span className="text-white ml-1">{processedSubjects.reduce((sum, s) => sum + s.credits, 0)}</span>
                                                </td>
                                                <td colSpan={2} className="px-6 py-4 text-right text-gray-400 font-medium">
                                                    Total Points = <span className="text-white ml-1">{processedSubjects.reduce((sum, s) => sum + s.totalPoints, 0)}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center rounded-xl bg-gray-800/20 border border-gray-700/50">
                                    <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                                    <p className="text-gray-400">No subject marks immediately available to calculate current SGPA.</p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Section: CGPA Formula Breakdown & Trend */}
                        <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Historical SGPA Trend</h4>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 w-full md:w-1/2">
                                    <div className="flex flex-wrap gap-4 h-full content-center">
                                        {historicalSemesters.map((sem, i) => (
                                            <div key={sem.id} className="flex-1 min-w-[100px] p-3 rounded-lg bg-gray-800 border border-gray-700 text-center relative">
                                                <div className="text-xs text-gray-500 font-medium uppercase mb-1">{sem.name}</div>
                                                <div className="text-xl font-bold text-white">{sem.sgpa.toFixed(2)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 w-full md:w-1/2 h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historicalSemesters} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 10]} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="sgpa" name="SGPA" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <span className="text-sm text-gray-400 italic">CGPA = sum(SGPA) / {historicalSemesters.length} semesters</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-bold">
                                    <CheckCircle className="w-4 h-4" /> Final CGPA = {cgpa.toFixed(2)}
                                </span>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
