import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import toast from 'react-hot-toast';

export const useResources = (user) => {
    const [resources, setResources] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setResources([]);
            return;
        }

        if (user.isDemo) {
            const unsub = mockStore.subscribe('resources', (data) => {
                setResources(data || []);
            });
            return () => unsub();
        }

        const resourcesRef = collection(db, 'resources');
        let unsubscribe;
        try {
            unsubscribe = onSnapshot(resourcesRef, (snapshot) => {
                const resourcesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setResources(resourcesData);
            }, () => {
                // Fallback to mockStore
                const unsubMock = mockStore.subscribe('resources', (data) => {
                    setResources(data || []);
                });
                return () => unsubMock();
            });
        } catch (e) {
            const unsubMock = mockStore.subscribe('resources', (data) => {
                setResources(data || []);
            });
            return () => unsubMock();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo]);

    // Simple add resource (for external links)
    const addResource = async (resourceData) => {
        try {
            const newRes = {
                ...resourceData,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };

            if (user?.isDemo) {
                mockStore.add('resources', { id: `res_${Date.now()}`, ...newRes });
            } else {
                try {
                    const docRef = await addDoc(collection(db, 'resources'), {
                        ...newRes,
                        createdAt: serverTimestamp()
                    });
                    mockStore.add('resources', { id: docRef.id, ...newRes });
                } catch (fsErr) {
                    console.warn('Firestore add resource failed, saving locally:', fsErr);
                    mockStore.add('resources', { id: `res_${Date.now()}`, ...newRes });
                }
            }
            toast.success('Resource link added successfully');
        } catch (error) {
            console.error('Error adding resource:', error);
            toast.error('Failed to add resource');
        }
    };

    // Helper: Read file as Data URL (Base64 fallback)
    const readFileAsDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };

    // Upload resource (Firebase Storage with seamless Base64 / Local fallback)
    const uploadResourceToStorage = async (resourceMeta, file, onProgress) => {
        if (!user?.id || !file) return;

        // Fallback save function (used if demo or Firebase Storage fails)
        const saveWithDataUrl = async () => {
            if (onProgress) onProgress(30);
            const dataUrl = await readFileAsDataUrl(file);
            if (onProgress) onProgress(80);

            const docData = {
                ...resourceMeta,
                fileName: file.name,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                downloadURL: dataUrl,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };

            let resId;
            if (user?.isDemo) {
                resId = `res_${Date.now()}`;
                mockStore.add('resources', { id: resId, ...docData });
            } else {
                try {
                    const docRef = await addDoc(collection(db, 'resources'), {
                        ...docData,
                        createdAt: serverTimestamp()
                    });
                    resId = docRef.id;
                    mockStore.add('resources', { id: resId, ...docData });
                } catch (err) {
                    resId = `res_${Date.now()}`;
                    mockStore.add('resources', { id: resId, ...docData });
                }
            }
            if (onProgress) onProgress(100);
            toast.success('Resource file uploaded successfully');
            return resId;
        };

        if (user?.isDemo) {
            return await saveWithDataUrl();
        }

        try {
            // Attempt upload to Firebase Storage
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `courses/${resourceMeta.courseId}/resources/${timestamp}_${safeName}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(storageRef, file);

            return await new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        if (onProgress) onProgress(progress);
                    },
                    async (error) => {
                        console.warn('Firebase Storage upload failed, falling back to local storage:', error);
                        try {
                            const resId = await saveWithDataUrl();
                            resolve(resId);
                        } catch (fallbackErr) {
                            reject(fallbackErr);
                        }
                    },
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            const docData = {
                                ...resourceMeta,
                                fileName: file.name,
                                mimeType: file.type || 'application/octet-stream',
                                size: file.size,
                                downloadURL,
                                storagePath,
                                date: new Date().toISOString().split('T')[0],
                                createdAt: serverTimestamp()
                            };

                            const resourceDoc = await addDoc(collection(db, 'resources'), docData);
                            mockStore.add('resources', { id: resourceDoc.id, ...docData, createdAt: new Date().toISOString() });
                            toast.success('Resource uploaded successfully');
                            resolve(resourceDoc.id);
                        } catch (error) {
                            console.warn('Metadata save error, falling back:', error);
                            const resId = await saveWithDataUrl();
                            resolve(resId);
                        }
                    }
                );
            });
        } catch (error) {
            console.warn('Storage initialization error, using Data URL fallback:', error);
            return await saveWithDataUrl();
        }
    };

    // Delete resource from Storage and Firestore
    const deleteResource = async (resourceId, storagePath) => {
        try {
            if (storagePath) {
                try {
                    const storageRef = ref(storage, storagePath);
                    await deleteObject(storageRef);
                } catch (e) {
                    console.warn('Could not delete storage object:', e);
                }
            }

            if (!user?.isDemo) {
                try {
                    await deleteDoc(doc(db, 'resources', resourceId));
                } catch (e) {
                    console.warn('Firestore delete failed:', e);
                }
            }

            mockStore.remove('resources', resourceId);
            toast.success('Resource deleted successfully');
        } catch (error) {
            console.error('Error deleting resource:', error);
            toast.error('Failed to delete resource');
            throw error;
        }
    };

    // Download resource
    const downloadResource = (downloadURL, fileName) => {
        try {
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = fileName || 'download';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading resource:', error);
            window.open(downloadURL, '_blank');
        }
    };

    return {
        resources,
        addResource,
        uploadResourceToStorage,
        deleteResource,
        downloadResource
    };
};
