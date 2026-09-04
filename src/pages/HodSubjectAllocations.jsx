import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSubjectPreferences } from '../hooks/useSubjectPreferences';
import { useNavigate } from 'react-router-dom';
import SubjectPreferenceForm from '../components/forms/SubjectPreferenceForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { BookOpen, User, Plus, Calendar, Clock, ArrowLeft } from 'lucide-react';

export default function HodSubjectAllocations() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { saveAllocations, lockResponse } = useSubjectPreferences();
    
    const [forms, setForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(true);
    
    const [activeForm, setActiveForm] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // Load available Preference Forms for the Department
    useEffect(() => {
        if (!user) return;
        
        const formsRef = collection(db, 'preferenceForms');
        let q;
        if (user.departmentId) {
            q = query(formsRef, where('departmentId', '==', user.departmentId));
        } else {
            q = query(formsRef);
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by createdAt desc
            data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setForms(data);
            
            // Sync active form if it updates
            setForms((prevForms) => {
                const refreshed = data.find(d => d.id === prevForms.find(pf => pf.id === d.id)?.id);
                // We're handling activeForm sync in a separate effect or by relying on forms state
                return data;
            });
            setLoadingForms(false);
        }, (err) => {
            console.error('Error fetching forms:', err);
            setLoadingForms(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Sync active form if it updates within the forms list
    useEffect(() => {
        if (activeForm && forms.length > 0) {
            const updated = forms.find(f => f.id === activeForm.id);
            if (updated && updated.status !== activeForm.status) {
                setActiveForm(updated);
            }
        }
    }, [forms]);

    // When a form is selected, load its submissions
    useEffect(() => {
        if (!activeForm) {
            setSubmissions([]);
            setSelectedSubmission(null);
            return;
        }

        const subsRef = collection(db, 'subjectPreferences');
        const q = query(subsRef, where('formId', '==', activeForm.id));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSubmissions(data);

            if (selectedSubmission) {
                 const refreshedInfo = data.find(d => d.id === selectedSubmission.id);
                 if (refreshedInfo) setSelectedSubmission(refreshedInfo);
            }
        });

        return () => unsubscribe();
    }, [activeForm, selectedSubmission]);


    const handleAllocate = async (allocations) => {
        if (!selectedSubmission) return;
        await saveAllocations(selectedSubmission.id, allocations);
    };

    const handleLockToggle = async (isLocked) => {
        if (!selectedSubmission) return;
        await lockResponse(selectedSubmission.id, isLocked);
    };

    if (loadingForms) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // View 1: List Forms
    if (!activeForm) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subject Preference Forms</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage subject collection forms.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/create-preference-form')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Create Form
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                            No forms created yet. Click "Create Form" to start.
                        </div>
                    )}
                    {forms.map(form => {
                        const isClosed = form.status === 'closed';
                        const deadlineDate = form.deadline?.toDate();
                        const isExpired = deadlineDate && new Date() > deadlineDate;

                        // Handle both old array format and new object format
                        let allSubjects = [];
                        if (Array.isArray(form.subjects)) {
                            allSubjects = form.subjects;
                        } else if (form.subjects) {
                            Object.values(form.subjects).forEach(arr => {
                                if (Array.isArray(arr)) allSubjects = [...allSubjects, ...arr];
                            });
                        }

                        return (
                            <div 
                                key={form.id} 
                                onClick={() => setActiveForm(form)}
                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">{form.title}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            isClosed ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                                            isExpired ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                            {isClosed ? 'Closed' : (isExpired ? 'Expired' : 'Open')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                        {allSubjects.length > 5 ? `${allSubjects.slice(0, 5).join(', ')} ... +${allSubjects.length - 5} more` : allSubjects.join(', ')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" /> 
                                        {deadlineDate ? deadlineDate.toLocaleDateString() : 'No deadline'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 2: View Form Responses
    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => {
                    setActiveForm(null);
                    setSelectedSubmission(null);
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Forms Form
            </button>

            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeForm.title}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Review faculty preferences and allocate subjects.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left pane: List of submissions */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/50">
                        Teacher Submissions ({submissions.length})
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[600px]">
                        {submissions.length === 0 ? (
                            <p className="p-6 text-center text-gray-500 text-sm">No submissions received yet.</p>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {submissions.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubmission(sub)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                            selectedSubmission?.id === sub.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{sub.teacherName}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                sub.status === 'locked' ? 'bg-red-100 text-red-700' :
                                                sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-200 text-gray-600'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {sub.updatedAt?.toDate() ? sub.updatedAt.toDate().toLocaleString() : 'No date'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right pane: Selected form viewer/editor */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedSubmission ? (
                            <motion.div
                                key={selectedSubmission.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <SubjectPreferenceForm
                                    initialData={selectedSubmission}
                                    teacherName={selectedSubmission.teacherName}
                                    isHodView={true}
                                    onAllocate={handleAllocate}
                                    onLockToggle={handleLockToggle}
                                    formDetails={activeForm} // Pass the parent form
                                />
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                                <User className="h-12 w-12 mb-3 opacity-20 mx-auto" />
                                <p>Select a teacher from the list to view their preferences.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
