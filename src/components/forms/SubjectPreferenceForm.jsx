import React, { useState, useEffect } from 'react';
import { Save, Send, Lock, Unlock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

export default function SubjectPreferenceForm({
    initialData,
    teacherName,
    isHodView = false,
    formDetails, // The generic form object (title, subjects as object per semester, deadline)
    onSaveDraft,
    onSubmit,
    onAllocate,
    onLockToggle
}) {
    // Form state
    // initialData.preferences is now expected to be an object: { 'II (2025 Scheme)': ['', '', '', ''], ... }
    const [preferences, setPreferences] = useState(initialData?.preferences || {});
    const [allocations, setAllocations] = useState(
        initialData?.allocations || {}
    );
    const [isEditMode, setIsEditMode] = useState(
        !initialData?.status || initialData?.status === 'draft'
    );

    const formSubjects = formDetails?.subjects || {};
    const semesters = Object.keys(formSubjects);

    // Initialize state structure based on the form's semesters if new
    useEffect(() => {
        if (!initialData?.preferences) {
            const initialPrefs = {};
            semesters.forEach(sem => {
                initialPrefs[sem] = ['', '', ''];
            });
            setPreferences(initialPrefs);
        } else {
             const prefs = {...initialData.preferences};
             // Ensure 4 slots per semester
             semesters.forEach(sem => {
                 if (!prefs[sem]) prefs[sem] = ['', '', ''];
                 while (prefs[sem].length < 3) prefs[sem].push('');
             });
             setPreferences(prefs);
        }

        if (!initialData?.allocations) {
            const initialAlloc = {};
            semesters.forEach(sem => {
                initialAlloc[sem] = { theory: '', lab: '', workload: '' };
            });
            setAllocations(initialAlloc);
        } else {
             setAllocations(initialData.allocations);
        }
        
        setIsEditMode(!initialData?.status || initialData?.status === 'draft');
    }, [initialData, formDetails]);

    const status = initialData?.status || 'draft';
    const isLocked = status === 'locked';

    const handlePrefChange = (semester, index, value) => {
        setPreferences(prev => {
            const newPrefs = { ...prev };
            newPrefs[semester] = [...(newPrefs[semester] || ['', '', ''])];
            newPrefs[semester][index] = value;
            return newPrefs;
        });
    };

    const handleAllocChange = (semester, field, value) => {
        setAllocations(prev => {
            const newAlloc = { ...prev };
            newAlloc[semester] = { ...(newAlloc[semester] || { theory: '', lab: '', workload: '' }) };
            newAlloc[semester][field] = value;
            return newAlloc;
        });
    };

    const handleSaveDraft = () => {
        if (onSaveDraft) onSaveDraft(preferences);
    };

    const handleSubmit = () => {
        if (onSubmit) onSubmit(preferences);
        setIsEditMode(false);
    };

    const handleSaveAllocations = () => {
        if (onAllocate) onAllocate(allocations);
    };

    const isOptionDisabled = (semester, subject, currentIndex) => {
        const semPrefs = preferences[semester] || [];
        return semPrefs.some((p, i) => p === subject && i !== currentIndex);
    };

    // Validations: check if at least 1 preference is selected total (or per semester based on business logic)
    // To match original request, "minimum 2" total.
    let totalSelections = 0;
    Object.values(preferences).forEach(semPrefs => {
        totalSelections += semPrefs.filter(Boolean).length;
    });

    return (
        <Card className="max-w-4xl mx-auto shadow-sm bg-white dark:bg-gray-900 border-x-0 sm:border-x">
            
            {/* HOD Action Bar (if applicable) */}
            {isHodView && initialData && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        status === 'locked' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                        status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                        {status}
                    </span>
                    <button 
                        onClick={() => onLockToggle && onLockToggle(!isLocked)}
                        className={`flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
                            isLocked ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                        }`}
                    >
                        {isLocked ? <><Unlock className="h-4 w-4" /> Unlock Form</> : <><Lock className="h-4 w-4" /> Lock Form</>}
                    </button>
                </div>
            )}

            <CardContent className="p-8 sm:p-12">
                
                {isLocked && !isHodView && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p className="font-medium">This form has been locked by the HOD. You can no longer edit your preferences.</p>
                    </div>
                )}

                {/* Print Header */}
                <div className="text-center mb-8 border-b-2 border-gray-900 dark:border-gray-500 pb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                        SUBJECT PREFERENCE FOR {formDetails?.title || 'UPCOMING SEMESTER'}
                    </h2>
                </div>

                {/* Name */}
                <div className="mb-6 flex items-end gap-2 text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">
                    <span>Name of the faculty:</span>
                    <span className="flex-1 border-b border-black dark:border-gray-400 font-bold px-2">{teacherName || ''}</span>
                </div>

                {/* Preference Table */}
                <div className="overflow-x-auto mb-8">
                    <table className="w-full border-collapse border border-gray-900 dark:border-gray-600 text-sm sm:text-base">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="border border-gray-900 dark:border-gray-600 p-3 w-1/4 sm:w-48 font-bold text-gray-900 dark:text-white uppercase">SEM</th>
                                <th className="border border-gray-900 dark:border-gray-600 p-3 font-bold text-gray-900 dark:text-white uppercase">SUBJECT PREFERENCE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semesters.map((semester) => {
                                const semOptions = formSubjects[semester] || [];
                                const semPrefs = preferences[semester] || ['', '', ''];
                                return (
                                    <React.Fragment key={semester}>
                                        <tr>
                                            <td rowSpan={3} className="border border-gray-900 dark:border-gray-600 p-4 font-bold text-center text-gray-900 dark:text-gray-200">
                                                {semester.split(' ').map((word, i) => (
                                                    <div key={i} className={i === 0 ? "text-lg" : "text-xs mt-1"}>{word}</div>
                                                ))}
                                            </td>
                                            <td className="border border-gray-900 dark:border-gray-600 p-1 bg-white dark:bg-gray-900 relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 text-xs font-bold uppercase tracking-wider">
                                                    1st Priority <span className="text-red-500 ml-1">*</span>
                                                </div>
                                                <select
                                                    value={semPrefs[0]}
                                                    onChange={(e) => handlePrefChange(semester, 0, e.target.value)}
                                                    disabled={!isEditMode || isLocked || isHodView}
                                                    className="w-full p-2 pl-24 outline-none bg-transparent appearance-none disabled:opacity-70 disabled:cursor-not-allowed dark:text-gray-300 text-center"
                                                >
                                                    <option value="">-- Select Subject --</option>
                                                    {semOptions.map(opt => (
                                                        <option key={opt} value={opt} disabled={isOptionDisabled(semester, opt, 0)}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-900 dark:border-gray-600 p-1 bg-white dark:bg-gray-900 relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 text-xs font-bold uppercase tracking-wider">
                                                    2nd Priority <span className="text-red-500 ml-1">*</span>
                                                </div>
                                                <select
                                                    value={semPrefs[1]}
                                                    onChange={(e) => handlePrefChange(semester, 1, e.target.value)}
                                                    disabled={!isEditMode || isLocked || isHodView}
                                                    className="w-full p-2 pl-24 outline-none bg-transparent appearance-none disabled:opacity-70 disabled:cursor-not-allowed dark:text-gray-300 text-center"
                                                >
                                                    <option value="">-- Select Subject --</option>
                                                    {semOptions.map(opt => (
                                                        <option key={opt} value={opt} disabled={isOptionDisabled(semester, opt, 1)}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-900 dark:border-gray-600 p-1 bg-white dark:bg-gray-900 relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 text-xs font-bold uppercase tracking-wider">
                                                    3rd Priority
                                                </div>
                                                <select
                                                    value={semPrefs[2]}
                                                    onChange={(e) => handlePrefChange(semester, 2, e.target.value)}
                                                    disabled={!isEditMode || isLocked || isHodView}
                                                    className="w-full p-2 pl-24 outline-none bg-transparent appearance-none disabled:opacity-70 disabled:cursor-not-allowed dark:text-gray-300 text-center"
                                                >
                                                    <option value="">-- Select Subject --</option>
                                                    {semOptions.map(opt => (
                                                        <option key={opt} value={opt} disabled={isOptionDisabled(semester, opt, 2)}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Allocation Table (Always visible physically) */}
                <div className="overflow-x-auto mb-16">
                    <table className="w-full border-collapse border border-gray-900 dark:border-gray-600 text-sm sm:text-base">
                        <thead>
                            <tr>
                                <th colSpan={4} className="border border-gray-900 dark:border-gray-600 p-2 text-center font-bold text-gray-900 dark:text-white uppercase bg-gray-50 dark:bg-gray-800">
                                    SUBJECT ALLOCATION
                                </th>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="border border-gray-900 dark:border-gray-600 p-2 w-1/4 sm:w-48 font-bold text-gray-900 dark:text-white uppercase">SEM</th>
                                <th className="border border-gray-900 dark:border-gray-600 p-2 font-bold text-gray-900 dark:text-white uppercase w-1/4">THEORY</th>
                                <th className="border border-gray-900 dark:border-gray-600 p-2 font-bold text-gray-900 dark:text-white uppercase w-1/4">LAB</th>
                                <th className="border border-gray-900 dark:border-gray-600 p-2 font-bold text-gray-900 dark:text-white uppercase w-1/4">WORKLOAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semesters.map((semester) => {
                                const semAlloc = allocations[semester] || { theory: '', lab: '', workload: '' };
                                return (
                                    <tr key={semester} className="bg-white dark:bg-gray-900">
                                        <td className="border border-gray-900 dark:border-gray-600 p-2 font-bold text-center text-gray-900 dark:text-gray-200">
                                            {semester}
                                        </td>
                                        <td className="border border-gray-900 dark:border-gray-600 p-0">
                                            <input 
                                                value={semAlloc.theory}
                                                onChange={(e) => handleAllocChange(semester, 'theory', e.target.value)}
                                                readOnly={!isHodView}
                                                className="w-full p-3 outline-none bg-transparent read-only:opacity-80 dark:text-gray-300 text-center"
                                            />
                                        </td>
                                        <td className="border border-gray-900 dark:border-gray-600 p-0">
                                            <input 
                                                value={semAlloc.lab}
                                                onChange={(e) => handleAllocChange(semester, 'lab', e.target.value)}
                                                readOnly={!isHodView}
                                                className="w-full p-3 outline-none bg-transparent read-only:opacity-80 dark:text-gray-300 text-center"
                                            />
                                        </td>
                                        <td className="border border-gray-900 dark:border-gray-600 p-0">
                                            <input 
                                                value={semAlloc.workload}
                                                onChange={(e) => handleAllocChange(semester, 'workload', e.target.value)}
                                                readOnly={!isHodView}
                                                className="w-full p-3 outline-none bg-transparent read-only:opacity-80 dark:text-gray-300 text-center"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="flex justify-between items-end mt-12 text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                    <div className="flex items-center gap-2">
                        <span>DATE:</span>
                        <span className="w-32 border-b border-gray-900 dark:border-gray-400 pb-1 text-center font-normal">
                            {initialData?.submittedAt?.toDate() ? initialData.submittedAt.toDate().toLocaleDateString() : (totalSelections > 0 ? new Date().toLocaleDateString() : '')}
                        </span>
                    </div>
                    <div className="text-right">
                        SIGNATURE OF THE STAFF
                    </div>
                </div>

                {/* Submissions & Actions Layer (Overlay/Buttons) */}
                <div className="mt-12 flex flex-col sm:flex-row justify-end gap-4 print:hidden">
                    {!isHodView && isEditMode && !isLocked && (
                        <>
                            <button
                                onClick={handleSaveDraft}
                                className="btn-outline flex items-center justify-center gap-2 px-6"
                            >
                                <Save className="h-4 w-4" /> Save as Draft
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={totalSelections < 2}
                                className="btn-primary flex items-center justify-center gap-2 px-8 bg-gray-900 dark:bg-indigo-600 text-white disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" /> Final Submit
                            </button>
                        </>
                    )}
                    
                    {isHodView && (
                        <button
                            onClick={handleSaveAllocations}
                            className="btn-primary flex items-center justify-center gap-2 px-8 bg-gray-900 dark:bg-indigo-600 text-white"
                        >
                            <Save className="h-4 w-4" /> Save Allocations
                        </button>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
