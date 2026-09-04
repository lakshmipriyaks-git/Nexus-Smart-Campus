import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useSubjectPreferences } from '../hooks/useSubjectPreferences';
import SubjectPreferenceForm from '../components/forms/SubjectPreferenceForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Shield, BookOpen, Calendar, ArrowLeft } from 'lucide-react';

export default function SubjectPreferences() {
    const { user } = useAuth();
    const { loadTeacherPreference, saveTeacherPreference } = useSubjectPreferences();
    
    const [availableForms, setAvailableForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(true);
    
    const [selectedForm, setSelectedForm] = useState(null); // The preferenceForm object
    const [formData, setFormData] = useState(null); // The subjectPreferences response object
    const [loadingResponse, setLoadingResponse] = useState(false);

    // Load available Open forms for this teacher's department
    useEffect(() => {
        if (!user?.departmentId) {
            setLoadingForms(false);
            return;
        }

        const formsRef = collection(db, 'preferenceForms');
        const q = query(
            formsRef, 
            where('departmentId', '==', user.departmentId)
            // Removed 'status == open' query to avoid requiring a composite index which leads to silent crashes
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(form => form.status === 'open'); // Filter in memory
                
            // Sort by closing date soonest first
            data.sort((a, b) => {
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return a.deadline.toMillis() - b.deadline.toMillis();
            });
            setAvailableForms(data);
            setLoadingForms(false);
        }, (error) => {
            console.error("Error fetching forms:", error);
            setLoadingForms(false);
        });

        return () => unsubscribe();
    }, [user?.departmentId]);

    // When a teacher selects a form to answer, load their existing response
    useEffect(() => {
        const fetchResponse = async () => {
            if (selectedForm && user?.id) {
                setLoadingResponse(true);
                const data = await loadTeacherPreference(selectedForm.id);
                setFormData(data || { status: 'draft' }); // Default to draft if no response yet
                setLoadingResponse(false);
            }
        };
        fetchResponse();
    }, [selectedForm, user?.id, loadTeacherPreference]);

    const handleSaveDraft = async (preferences) => {
        const success = await saveTeacherPreference(selectedForm.id, selectedForm.title, preferences, false, true);
        if (success) {
            const updated = await loadTeacherPreference(selectedForm.id);
            setFormData(updated);
        }
    };

    const handleSubmit = async (preferences) => {
        const success = await saveTeacherPreference(selectedForm.id, selectedForm.title, preferences, true);
        if (success) {
            const updated = await loadTeacherPreference(selectedForm.id);
            setFormData(updated);
        }
    };

    if (loadingForms) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (!user?.departmentId) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h2 className="text-lg font-bold">No Department Assigned</h2>
                    <p className="mt-2">You must belong to a department to view Subject Preference forms.</p>
                 </div>
            </div>
        );
    }

    // View 1: List of available forms
    if (!selectedForm) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subject Preferences</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Select an open form to submit your teaching preferences.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableForms.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                            No open preference forms available at the moment.
                        </div>
                    )}
                    {availableForms.map(form => {
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
                                onClick={() => !isExpired && setSelectedForm(form)}
                                className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col justify-between ${isExpired ? 'opacity-70 cursor-not-allowed' : 'hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer'}`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-1">{form.title}</h3>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex flex-wrap gap-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Subjects:</span>
                                        {allSubjects.length > 3 ? 
                                            `${allSubjects.slice(0, 3).join(', ')} ... +${allSubjects.length - 3} more` : 
                                            allSubjects.join(', ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>
                                        <Calendar className="h-4 w-4" /> 
                                        {deadlineDate ? `Due ${deadlineDate.toLocaleDateString()}` : 'No deadline'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 2: Fill out the response
    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <button
                onClick={() => {
                    setSelectedForm(null);
                    setFormData(null);
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Forms
            </button>

            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedForm.title}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Submit your top preferences from the available list.</p>
                </div>
            </div>

            {loadingResponse ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <SubjectPreferenceForm
                        initialData={formData}
                        teacherName={user?.name}
                        isHodView={false}
                        onSaveDraft={handleSaveDraft}
                        onSubmit={handleSubmit}
                        formDetails={selectedForm} // Pass the parent form details (title, subjects)
                    />
                </motion.div>
            )}
        </div>
    );
}
