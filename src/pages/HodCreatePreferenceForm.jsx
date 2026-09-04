import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubjectPreferences } from '../hooks/useSubjectPreferences';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const SEMESTERS = {
    'EVEN': ['Semester-II', 'Semester-IV', 'Semester-VI'],
    'ODD':  ['Semester-III', 'Semester-V', 'Semester-VII']
};

export default function HodCreatePreferenceForm() {
    const navigate = useNavigate();
    const { createPreferenceForm } = useSubjectPreferences();
    
    // Academic Year & Term
    const [academicYear, setAcademicYear] = useState('2025-26');
    const [term, setTerm] = useState('EVEN'); // EVEN or ODD
    const [deadline, setDeadline] = useState('');
    
    // Rows representation. A list of objects { 'Semester-II': 'Subj..', 'Semester-IV': 'Subj..', ... }
    const [rows, setRows] = useState([
        { ...SEMESTERS['EVEN'].reduce((acc, sem) => ({ ...acc, [sem]: '' }), {}) }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTermChange = (newTerm) => {
        setTerm(newTerm);
        // Reset rows to fresh empty row for new term
        setRows([
            { ...SEMESTERS[newTerm].reduce((acc, sem) => ({ ...acc, [sem]: '' }), {}) }
        ]);
    };

    const handleAddRow = () => {
        setRows(prev => [
            ...prev,
            { ...SEMESTERS[term].reduce((acc, sem) => ({ ...acc, [sem]: '' }), {}) }
        ]);
    };

    const handleRemoveRow = (index) => {
        setRows(prev => {
            const newArray = [...prev];
            if (newArray.length > 1) newArray.splice(index, 1);
            return newArray;
        });
    };

    const handleSubjectChange = (rowIndex, semester, value) => {
        setRows(prev => {
            const newArray = [...prev];
            newArray[rowIndex] = { ...newArray[rowIndex], [semester]: value };
            return newArray;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!deadline) return toast.error("Please select a deadline.");
        
        // Convert rows to the `{ 'Semester-II': ['Sub1', 'Sub2'] }` format
        const cleanedSubjects = {};
        let totalValidSubjects = 0;

        SEMESTERS[term].forEach(sem => {
            cleanedSubjects[sem] = [];
            rows.forEach(row => {
                 if (row[sem]?.trim()) {
                     cleanedSubjects[sem].push(row[sem].trim());
                     totalValidSubjects++;
                 }
            });
        });

        if (totalValidSubjects < 3) {
            return toast.error("Please provide at least a few subjects across the semesters.");
        }

        const title = `${term} SEMESTER UG ${academicYear}`;

        setIsSubmitting(true);
        const success = await createPreferenceForm(title, cleanedSubjects, deadline);
        setIsSubmitting(false);

        if (success) {
            navigate('/subject-allocations');
        }
    };

    const semestersList = SEMESTERS[term];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <button
                onClick={() => navigate('/subject-allocations')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Allocations
            </button>

            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create Subject List</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Configure the official "Subject List" tabular document.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Academic Year</label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="e.g. 2025-26"
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Term</label>
                            <select
                                value={term}
                                onChange={(e) => handleTermChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            >
                                <option value="EVEN">EVEN SEMESTER</option>
                                <option value="ODD">ODD SEMESTER</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submission Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    <div className="print:block border border-black dark:border-gray-500 p-8 pt-6">
                        <div className="text-center font-bold mb-6 text-gray-900 dark:text-gray-100">
                            Encl: SUBJECT LIST
                        </div>
                        <div className="text-center font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
                            Subject List
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-black dark:border-gray-500">
                                <thead>
                                    <tr>
                                        {semestersList.map(sem => (
                                            <th key={sem} className="border border-black dark:border-gray-500 p-2 text-center font-bold text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">
                                                {sem}
                                            </th>
                                        ))}
                                        {/* Action column removed to keep it cleaner, we'll add row delete differently */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            {semestersList.map(sem => (
                                                <td key={sem} className="border border-black dark:border-gray-500 p-0 relative group">
                                                    <textarea
                                                        value={row[sem]}
                                                        onChange={(e) => handleSubjectChange(index, sem, e.target.value)}
                                                        placeholder={`Enter subject for ${sem}`}
                                                        rows={2}
                                                        className="w-full h-full min-h-[60px] p-2 outline-none border-none bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-900/30 transition-colors resize-y leading-snug"
                                                    />
                                                </td>
                                            ))}
                                            {/* Delete row button (absolute or next column) */}
                                            <td className="w-10 border-none p-0 align-middle">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(index)}
                                                    className="p-2 ml-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remove Row"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="text-sm flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                            >
                                <Plus className="h-4 w-4" /> Add Row
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-end mt-16 text-sm font-bold text-gray-900 dark:text-gray-100 uppercase">
                            <div className="flex items-center gap-2">
                                <span>DATE:</span>
                                <span className="w-32 border-b border-black dark:border-gray-400 pb-1"></span>
                            </div>
                            <div className="text-right">
                                SIGNATURE OF THE STAFF
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end pb-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary flex items-center gap-2 hover:shadow-lg"
                        >
                            <Save className="h-5 w-5" />
                            {isSubmitting ? 'Publishing...' : `Publish "Subject List" Form`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
