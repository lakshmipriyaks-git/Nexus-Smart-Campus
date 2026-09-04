import { useState, useCallback } from 'react';
import {
    collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc,
    serverTimestamp, addDoc, onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useSubjectPreferences = () => {
    const { user } = useAuth();
    const [preferencesLoading, setPreferencesLoading] = useState(false);

    // ==========================================
    // HOD: CREATE AND MANAGE FORMS
    // ==========================================

    const createPreferenceForm = async (title, subjects, deadline) => {
        if (!user?.departmentId) {
            toast.error("Department ID missing.");
            return false;
        }
        try {
            await addDoc(collection(db, 'preferenceForms'), {
                departmentId: user.departmentId,
                title,
                subjects,
                deadline: new Date(deadline),
                status: 'open',
                createdAt: serverTimestamp(),
                createdBy: user.id
            });
            toast.success("Form created successfully!");
            return true;
        } catch (error) {
            console.error("Error creating form:", error);
            toast.error("Failed to create form.");
            return false;
        }
    };

    const toggleFormStatus = async (formId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'open' ? 'closed' : 'open';
            await updateDoc(doc(db, 'preferenceForms', formId), {
                status: newStatus
            });
            toast.success(`Form ${newStatus} successfully.`);
            return true;
        } catch (error) {
             console.error("Error toggling status:", error);
             toast.error("Failed to update status.");
             return false;
        }
    };

    // ==========================================
    // TEACHER & HOD: GET FORMS & RESPONSES
    // ==========================================

    const getFormId = (teacherId, formId) => `${teacherId}_${formId}`;

    const loadTeacherPreference = useCallback(async (formId) => {
        if (!user?.id || !formId) return null;
        try {
            setPreferencesLoading(true);
            const responseId = getFormId(user.id, formId);
            const responseRef = doc(db, 'subjectPreferences', responseId);
            const snap = await getDoc(responseRef);
            
            setPreferencesLoading(false);
            if (snap.exists()) {
                return { id: snap.id, ...snap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error loading teacher preference:', error);
            setPreferencesLoading(false);
            return null;
        }
    }, [user?.id]);

    const saveTeacherPreference = async (formId, formTitle, preferences, isSubmit = false, isEditing = false) => {
        if (!user?.id || !user?.departmentId) {
            toast.error("User ID or Department ID missing.");
            return false;
        }
        
        // Validate preferences (min 2, max 3 uniqueness handled in UI but good to double check)
        const validPrefs = preferences.filter(Boolean);
        if (isSubmit && validPrefs.length < 2) {
             toast.error("Please select at least 2 preferences before submitting.");
             return false;
        }
        
        try {
            const responseId = getFormId(user.id, formId);
            const status = isSubmit ? 'submitted' : (isEditing ? 'draft' : 'draft');
            
            const payload = {
                teacherId: user.id,
                teacherName: user.name,
                departmentId: user.departmentId,
                formId,
                formTitle,
                preferences: validPrefs,
                status,
                updatedAt: serverTimestamp()
            };

            const docRef = doc(db, 'subjectPreferences', responseId);
            
            if (isSubmit) {
                payload.submittedAt = serverTimestamp();
            }

            await setDoc(docRef, payload, { merge: true });

            if (isSubmit) toast.success('Preferences submitted successfully!');
            else toast.success('Draft saved.');
            
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences.');
            return false;
        }
    };

    // ==========================================
    // HOD: ALLOCATIONS & LOCKING
    // ==========================================

    const saveAllocations = async (responseId, allocations) => {
        try {
            const docRef = doc(db, 'subjectPreferences', responseId);
            await updateDoc(docRef, {
                allocations,
                updatedAt: serverTimestamp()
            });
            toast.success('Allocations saved successfully!');
            return true;
        } catch (error) {
            console.error('Error saving allocations:', error);
            toast.error('Failed to save allocations.');
            return false;
        }
    };
    
    const lockResponse = async (responseId, isLocked) => {
         try {
             const docRef = doc(db, 'subjectPreferences', responseId);
             await updateDoc(docRef, {
                 status: isLocked ? 'locked' : 'submitted',
                 updatedAt: serverTimestamp()
             });
             toast.success(isLocked ? 'Response locked' : 'Response unlocked');
         } catch(error) {
             toast.error('Failed to update response status');
         }
    };

    const getHODResponsesForForm = useCallback(async (formId) => {
         if (!formId) return [];
         try {
             // We can query responses where formId == formId
             const q = query(
                 collection(db, 'subjectPreferences'), 
                 where('formId', '==', formId)
             );
             const snap = await getDocs(q);
             return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         } catch (error) {
             console.error("Error fetching responses:", error);
             return [];
         }
    }, []);

    return {
        preferencesLoading,
        createPreferenceForm,
        toggleFormStatus,
        loadTeacherPreference,
        saveTeacherPreference,
        saveAllocations,
        lockResponse,
        getHODResponsesForForm
    };
};
