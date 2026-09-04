import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import toast from 'react-hot-toast';

export const useResources = (user) => {
    const [resources, setResources] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setResources([]);
            return;
        }

        const resourcesRef = collection(db, 'resources');
        const unsubscribe = onSnapshot(resourcesRef, (snapshot) => {
            const resourcesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setResources(resourcesData);
        });

        return unsubscribe;
    }, [user]);

    // Legacy: Simple add resource (for external links)
    const addResource = async (resourceData) => {
        try {
            await addDoc(collection(db, 'resources'), {
                ...resourceData,
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });
            toast.success('Resource added successfully');
        } catch (error) {
            console.error('Error adding resource:', error);
            toast.error('Failed to add resource');
        }
    };

    // New: Upload resource to Firebase Storage
    const uploadResourceToStorage = async (resourceMeta, file, onProgress) => {
        if (!user?.id) return;

        try {
            // Create storage reference: /courses/{courseId}/resources/{timestamp}_{filename}
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const storageRef = ref(storage, `courses/${resourceMeta.courseId}/resources/${fileName}`);

            // Start upload
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Progress callback
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        if (onProgress) {
                            onProgress(progress);
                        }
                    },
                    (error) => {
                        // Error callback
                        console.error('Error uploading file:', error);
                        toast.error('Failed to upload file');
                        reject(error);
                    },
                    async () => {
                        // Success callback
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                            // Create Firestore document with metadata
                            const resourceDoc = await addDoc(collection(db, 'resources'), {
                                ...resourceMeta,
                                fileName: file.name,
                                mimeType: file.type,
                                size: file.size,
                                downloadURL,
                                storagePath: uploadTask.snapshot.ref.fullPath,
                                date: new Date().toISOString().split('T')[0],
                                createdAt: serverTimestamp()
                            });

                            toast.success('Resource uploaded successfully');
                            resolve(resourceDoc.id);
                        } catch (error) {
                            console.error('Error creating resource document:', error);
                            toast.error('Failed to save resource metadata');
                            reject(error);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error uploading resource:', error);
            toast.error('Failed to upload resource');
            throw error;
        }
    };

    // Delete resource from Storage and Firestore
    const deleteResource = async (resourceId, storagePath) => {
        try {
            // Delete from Storage if path exists
            if (storagePath) {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
            }

            // Delete Firestore document
            await deleteDoc(doc(db, 'resources', resourceId));

            toast.success('Resource deleted successfully');
        } catch (error) {
            console.error('Error deleting resource:', error);
            toast.error('Failed to delete resource');
            throw error;
        }
    };

    // Download resource (just opens the download URL)
    const downloadResource = (downloadURL, fileName) => {
        try {
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading resource:', error);
            toast.error('Failed to download resource');
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
