import { collection, getDocs, doc, setDoc, updateDoc, addDoc, query, where, serverTimestamp, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';

// Default KSSEM Campus Fleet Routes
export const DEFAULT_KSSEM_BUSES = [
    {
        id: 'bus-1',
        routeNumber: '1',
        routeName: 'Banashankari — KSSEM Express',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 98451 23456',
        status: 'On Time',
        etaMinutes: 12,
        nextStop: 'Konanakunte Cross Metro',
        stops: ['Banashankari TTMC', 'Jaya Nagar 4th Block', 'Sarakki Junction', 'Konanakunte Cross', 'KSSEM Campus'],
        capacity: 45,
        currentLocation: { lat: 12.8992, lng: 77.5682 }
    },
    {
        id: 'bus-2',
        routeNumber: '2',
        routeName: 'Majestic — South End — KSSEM',
        driverName: 'Suresh Gowda',
        driverPhone: '+91 98457 89123',
        status: 'Delayed',
        etaMinutes: 24,
        nextStop: 'South End Circle',
        stops: ['Majestic (Kempegowda)', 'KR Market', 'Lalbagh West Gate', 'South End Circle', 'Yelachenahalli', 'KSSEM Campus'],
        capacity: 50,
        currentLocation: { lat: 12.9280, lng: 77.5750 }
    },
    {
        id: 'bus-3',
        routeNumber: '3',
        routeName: 'Electronic City — NICE Rd — KSSEM',
        driverName: 'Manjunath B',
        driverPhone: '+91 99801 23789',
        status: 'On Time',
        etaMinutes: 18,
        nextStop: 'NICE Road Toll Plaza',
        stops: ['Electronic City Phase 1', 'Bommasandra', 'NICE Road Interchange', 'Kanakapura Exit', 'KSSEM Campus'],
        capacity: 48,
        currentLocation: { lat: 12.8550, lng: 77.6200 }
    },
    {
        id: 'bus-4',
        routeNumber: '4',
        routeName: 'Kengeri — Uttarahalli — KSSEM',
        driverName: 'Venkatesh N',
        driverPhone: '+91 98445 67890',
        status: 'On Time',
        etaMinutes: 15,
        nextStop: 'Uttarahalli Circle',
        stops: ['Kengeri Satellite Town', 'RR Nagar Arch', 'Channasandra', 'Uttarahalli Circle', 'KSSEM Campus'],
        capacity: 42,
        currentLocation: { lat: 12.9020, lng: 77.5250 }
    },
    {
        id: 'bus-5',
        routeNumber: '5',
        routeName: 'Bannerghatta — Meenakshi — KSSEM',
        driverName: 'Anand Swamy',
        driverPhone: '+91 97412 34567',
        status: 'On Time',
        etaMinutes: 8,
        nextStop: 'Gottigere Junction',
        stops: ['Bannerghatta National Park', 'Gottigere Junction', 'Meenakshi Mall', 'Kothnur Dinne', 'KSSEM Campus'],
        capacity: 46,
        currentLocation: { lat: 12.8750, lng: 77.5850 }
    }
];

// ==========================================
// 1. Bus Tracking Services
// ==========================================
export const getBuses = async () => {
    try {
        const busesRef = collection(db, 'buses');
        const snapshot = await getDocs(busesRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {}
    const mock = mockStore.get('buses');
    if (mock && Array.isArray(mock) && mock.length > 0) return mock;

    mockStore.data['buses'] = DEFAULT_KSSEM_BUSES;
    mockStore.saveCollection('buses', DEFAULT_KSSEM_BUSES);
    return DEFAULT_KSSEM_BUSES;
};

export const clearDemoData = () => {
    mockStore.clearDemoData();
    return true;
};

export const updateBusLocation = async (busId, coords) => {
    mockStore.update('buses', busId, { currentLocation: coords });
    try {
        const busRef = doc(db, 'buses', busId);
        await updateDoc(busRef, {
            currentLocation: coords,
            updatedAt: serverTimestamp()
        });
    } catch (e) {}
};

export const fetchBusGpsFeed = async (currentBuses = []) => {
    const feedUrl = import.meta.env?.VITE_BUS_GPS_API_URL;

    if (feedUrl) {
        try {
            const response = await fetch(feedUrl, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`GPS feed returned ${response.status}`);
            }

            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : (payload?.buses || [payload]);

            return data
                .filter(Boolean)
                .map((item) => {
                    const lat = Number(item.latitude ?? item.lat ?? item.currentLocation?.lat ?? item.location?.lat);
                    const lng = Number(item.longitude ?? item.lng ?? item.currentLocation?.lng ?? item.location?.lng);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

                    return {
                        id: item.id || item.busId || item.routeNumber,
                        routeNumber: item.routeNumber || item.busNumber || item.id,
                        currentLocation: { lat, lng },
                        updatedAt: item.updatedAt || new Date().toISOString(),
                    };
                })
                .filter(Boolean);
        } catch (error) {
            console.warn('Using fallback GPS simulation because live device feed is unavailable:', error.message);
        }
    }

    return (currentBuses || []).map((bus, index) => {
        const baseLat = Number(bus.currentLocation?.lat ?? 12.9 + index * 0.005);
        const baseLng = Number(bus.currentLocation?.lng ?? 77.53 + index * 0.006);
        const driftLat = (Math.sin(Date.now() / 120000 + index) * 0.0008);
        const driftLng = (Math.cos(Date.now() / 150000 + index) * 0.0012);

        return {
            id: bus.id,
            routeNumber: bus.routeNumber,
            currentLocation: {
                lat: Number((baseLat + driftLat).toFixed(6)),
                lng: Number((baseLng + driftLng).toFixed(6)),
            },
            updatedAt: new Date().toISOString(),
        };
    });
};

// ==========================================
// 2. Digital Library Services (Full Admin & Student/Teacher Control)
// ==========================================
export const getBooks = async () => {
    try {
        const booksRef = collection(db, 'libraryBooks');
        const snapshot = await getDocs(booksRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {}
    return mockStore.get('libraryBooks');
};

export const addBook = async (bookData) => {
    const total = parseInt(bookData.totalCopies, 10) || 1;
    const available = parseInt(bookData.availableCopies, 10) ?? total;
    const isAvail = available > 0 && bookData.isAvailable !== false;
    
    const newBook = mockStore.add('libraryBooks', {
        ...bookData,
        totalCopies: total,
        availableCopies: available,
        isAvailable: isAvail,
        expectedAvailableDate: isAvail ? 'Available Now' : (bookData.expectedAvailableDate || 'Not specified'),
        shelfLocation: bookData.shelfLocation || 'General Rack',
        category: bookData.category || 'General',
        notes: bookData.notes || '',
        createdAt: new Date().toISOString()
    });

    try {
        const booksRef = collection(db, 'libraryBooks');
        await addDoc(booksRef, {
            ...newBook,
            createdAt: serverTimestamp()
        });
    } catch (e) {}

    return newBook;
};

export const updateBook = async (bookId, updates) => {
    const current = mockStore.get('libraryBooks').find(b => b.id === bookId) || {};
    const totalCopies = updates.totalCopies !== undefined ? parseInt(updates.totalCopies, 10) : current.totalCopies;
    let availableCopies = updates.availableCopies !== undefined ? parseInt(updates.availableCopies, 10) : current.availableCopies;
    
    // Bounds check
    if (availableCopies > totalCopies) availableCopies = totalCopies;
    if (availableCopies < 0) availableCopies = 0;

    const isAvailable = updates.isAvailable !== undefined 
        ? updates.isAvailable 
        : (availableCopies > 0);

    const merged = {
        ...updates,
        totalCopies,
        availableCopies,
        isAvailable,
        expectedAvailableDate: isAvailable && availableCopies > 0 
            ? 'Available Now' 
            : (updates.expectedAvailableDate || current.expectedAvailableDate || 'Pending Return')
    };

    const updated = mockStore.update('libraryBooks', bookId, merged);

    try {
        const bookRef = doc(db, 'libraryBooks', bookId);
        await updateDoc(bookRef, {
            ...merged,
            updatedAt: serverTimestamp()
        });
    } catch (e) {}

    return updated;
};

export const deleteBook = async (bookId) => {
    mockStore.remove('libraryBooks', bookId);
    try {
        const bookRef = doc(db, 'libraryBooks', bookId);
        await setDoc(bookRef, { deleted: true }, { merge: true });
    } catch (e) {}
    return true;
};

// ── Borrowing & Lending Registry Services ──
export const getBorrowings = async () => {
    try {
        const borrowingsRef = collection(db, 'libraryBorrowings');
        const snapshot = await getDocs(borrowingsRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {}
    return mockStore.get('libraryBorrowings') || [];
};

export const getUserBorrowings = async (userId) => {
    try {
        const borrowingsRef = collection(db, 'libraryBorrowings');
        const q = query(borrowingsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {}
    const list = mockStore.get('libraryBorrowings') || [];
    return list.filter(b => b.userId === userId);
};

export const issueBook = async (issueData) => {
    const {
        bookId,
        bookTitle,
        userId,
        userName,
        userRole = 'student',
        userEmail = '',
        borrowDate = new Date().toISOString().split('T')[0],
        dueDate,
        notes = ''
    } = issueData;

    // Create borrowing record
    const newBorrowing = mockStore.add('libraryBorrowings', {
        bookId,
        bookTitle,
        userId,
        userName,
        userRole,
        userEmail,
        borrowDate,
        dueDate,
        returnDate: null,
        status: 'active',
        notes,
        issuedAt: new Date().toISOString()
    });

    // Decrement available copies in book and update expected availability date
    const books = mockStore.get('libraryBooks');
    const book = books.find(b => b.id === bookId);
    if (book) {
        const newAvailable = Math.max(0, (book.availableCopies || 1) - 1);
        const isAvail = newAvailable > 0;
        await updateBook(bookId, {
            availableCopies: newAvailable,
            isAvailable: isAvail,
            expectedAvailableDate: isAvail ? 'Available Now' : dueDate
        });
    }

    try {
        const borrowingsRef = collection(db, 'libraryBorrowings');
        await addDoc(borrowingsRef, {
            ...newBorrowing,
            issuedAt: serverTimestamp()
        });
    } catch (e) {}

    return newBorrowing;
};

export const returnBorrowedBook = async (borrowingId, bookId, returnDate = new Date().toISOString().split('T')[0]) => {
    // 1. Update borrowing record
    const updatedBorrowing = mockStore.update('libraryBorrowings', borrowingId, {
        returnDate,
        status: 'returned',
        returnedAt: new Date().toISOString()
    });

    // 2. Increment book available copies
    const books = mockStore.get('libraryBooks');
    const book = books.find(b => b.id === bookId);
    if (book) {
        const newAvailable = Math.min(book.totalCopies || 1, (book.availableCopies || 0) + 1);
        await updateBook(bookId, {
            availableCopies: newAvailable,
            isAvailable: true,
            expectedAvailableDate: 'Available Now'
        });
    }

    try {
        const borrowRef = doc(db, 'libraryBorrowings', borrowingId);
        await updateDoc(borrowRef, {
            returnDate,
            status: 'returned',
            returnedAt: serverTimestamp()
        });
    } catch (e) {}

    return updatedBorrowing;
};

export const updateBorrowing = async (borrowingId, updates) => {
    const updated = mockStore.update('libraryBorrowings', borrowingId, updates);
    try {
        const borrowRef = doc(db, 'libraryBorrowings', borrowingId);
        await updateDoc(borrowRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (e) {}
    return updated;
};

export const borrowBook = async (bookId, userObj) => {
    const uid = typeof userObj === 'string' ? userObj : (userObj?.uid || userObj?.id || 'student-demo');
    const uName = userObj?.name || 'Student User';
    const uRole = userObj?.role || 'student';
    const uEmail = userObj?.email || '';

    const books = mockStore.get('libraryBooks');
    const book = books.find(b => b.id === bookId);
    if (!book || book.availableCopies <= 0) return false;

    // Calculate 14 days default due date
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0];

    return await issueBook({
        bookId: book.id,
        bookTitle: book.title,
        userId: uid,
        userName: uName,
        userRole: uRole,
        userEmail: uEmail,
        borrowDate: today.toISOString().split('T')[0],
        dueDate,
        notes: 'Self-checkout via Smart Campus Portal'
    });
};

export const returnBook = async (bookId, userId) => {
    const list = mockStore.get('libraryBorrowings') || [];
    const active = list.find(b => b.bookId === bookId && (b.userId === userId || !userId) && b.status !== 'returned');
    if (active) {
        return await returnBorrowedBook(active.id, bookId);
    }

    // Fallback: direct increment
    const books = mockStore.get('libraryBooks');
    const book = books.find(b => b.id === bookId);
    if (book && book.availableCopies < book.totalCopies) {
        await updateBook(bookId, { availableCopies: book.availableCopies + 1 });
        return true;
    }
    return false;
};

// ==========================================
// 3. Xerox & Print Hub Services (Admin & Student/Staff Desk)
// ==========================================
export const submitPrintJob = async (jobData) => {
    // Generate unique pickup token if not supplied
    const pickupToken = jobData.pickupToken || `PX-${Math.floor(1000 + Math.random() * 9000)}`;
    const customerUniqueId = jobData.customerUniqueId || '';
    const jobId = jobData.id || `print-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newJob = {
        ...jobData,
        id: jobId,
        pickupToken,
        customerUniqueId,
        fileType: jobData.fileType || 'PDF Document',
        paperType: jobData.paperType || 'A4 Standard (75 GSM)',
        bindingType: jobData.bindingType || 'None',
        specialInstructions: jobData.specialInstructions || '',
        counterNote: jobData.counterNote || 'Queued at Campus Print Desk',
        status: jobData.status || 'Queued',
        timestamp: new Date().toISOString(),
        notifiedAt: null
    };

    mockStore.add('printJobs', newJob);

    try {
        const jobRef = doc(db, 'printJobs', jobId);
        await setDoc(jobRef, {
            ...newJob,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.warn('Firestore submitPrintJob fallback:', e.message);
    }

    try {
        const bc = new BroadcastChannel('nexus_printhub_jobs');
        bc.postMessage({ type: 'NEW_PRINT_JOB', job: newJob });
        bc.close();
    } catch (e) {}

    return newJob;
};

export const getStudentPrintJobs = async (userId, userEmail = null, customerId = null) => {
    try {
        const jobsRef = collection(db, 'printJobs');
        const snapshot = await getDocs(jobsRef);
        if (!snapshot.empty) {
            const all = snapshot.docs
                .map(doc => ({ ...doc.data(), firestoreId: doc.id, id: doc.id }))
                .filter(j => !j.deleted);
            const matched = all.filter(j => 
                !userId || 
                j.userId === userId || 
                (userEmail && j.userEmail === userEmail) || 
                (customerId && j.customerUniqueId === customerId)
            );
            return matched;
        }
    } catch (e) {}

    const list = (mockStore.get('printJobs') || []).filter(j => !j.deleted);
    const matched = list.filter(j => 
        !userId || 
        j.userId === userId || 
        (userEmail && j.userEmail === userEmail) || 
        (customerId && j.customerUniqueId === customerId)
    );

    return matched;
};

export const getAllPrintJobs = async () => {
    try {
        const jobsRef = collection(db, 'printJobs');
        const snapshot = await getDocs(jobsRef);
        if (!snapshot.empty) {
            return snapshot.docs
                .map(doc => ({ ...doc.data(), firestoreId: doc.id, id: doc.id }))
                .filter(j => !j.deleted);
        }
    } catch (e) {}
    return (mockStore.get('printJobs') || []).filter(j => !j.deleted);
};

export const updatePrintJobStatus = async (jobId, status, extraFields = {}) => {
    const isReady = status === 'Ready for Pickup';
    const updates = {
        status,
        ...extraFields,
        ...(isReady ? { notifiedAt: new Date().toISOString() } : {}),
        ...(status === 'Completed' ? { completedAt: new Date().toISOString() } : {})
    };

    // 1. Update mockStore (supporting id, pickupToken, or firestoreId)
    const updated = mockStore.update('printJobs', jobId, updates);

    // 2. Update Firestore
    try {
        let updatedInFirestore = false;

        if (jobId) {
            const jobRef = doc(db, 'printJobs', jobId);
            const docSnap = await getDoc(jobRef);
            if (docSnap.exists()) {
                await updateDoc(jobRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
                updatedInFirestore = true;
            }
        }

        if (!updatedInFirestore && jobId) {
            const q = query(collection(db, 'printJobs'), where('id', '==', jobId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                for (const d of snap.docs) {
                    await updateDoc(d.ref, {
                        ...updates,
                        updatedAt: serverTimestamp()
                    });
                }
                updatedInFirestore = true;
            }
        }

        const tokenToSearch = updates?.pickupToken || extraFields?.pickupToken || jobId;
        if (!updatedInFirestore && tokenToSearch) {
            const qToken = query(collection(db, 'printJobs'), where('pickupToken', '==', tokenToSearch));
            const snapToken = await getDocs(qToken);
            if (!snapToken.empty) {
                for (const d of snapToken.docs) {
                    await updateDoc(d.ref, {
                        ...updates,
                        updatedAt: serverTimestamp()
                    });
                }
                updatedInFirestore = true;
            }
        }
    } catch (e) {
        console.warn('Firestore updatePrintJobStatus fallback error:', e);
    }

    // 3. Broadcast real-time status change
    try {
        const bc = new BroadcastChannel('nexus_printhub_jobs');
        bc.postMessage({
            type: 'PRINT_JOB_STATUS_CHANGED',
            jobId,
            status,
            updates
        });
        bc.close();
    } catch (e) {}

    try {
        localStorage.setItem('nexus_printhub_last_status_update', JSON.stringify({
            jobId,
            status,
            updates,
            timestamp: Date.now()
        }));
    } catch (e) {}

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_printhub_status_changed', {
            detail: { jobId, status, updates }
        }));
    }

    return updated;
};

export const deletePrintJob = async (jobId, pickupToken = null) => {
    mockStore.remove('printJobs', jobId);
    try {
        let deletedInFirestore = false;
        if (jobId) {
            const jobRef = doc(db, 'printJobs', jobId);
            const docSnap = await getDoc(jobRef);
            if (docSnap.exists()) {
                await setDoc(jobRef, { deleted: true }, { merge: true });
                deletedInFirestore = true;
            }
        }
        if (!deletedInFirestore && jobId) {
            const q = query(collection(db, 'printJobs'), where('id', '==', jobId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                for (const d of snap.docs) {
                    await setDoc(d.ref, { deleted: true }, { merge: true });
                }
                deletedInFirestore = true;
            }
        }
        const token = pickupToken || jobId;
        if (!deletedInFirestore && token) {
            const qToken = query(collection(db, 'printJobs'), where('pickupToken', '==', token));
            const snapToken = await getDocs(qToken);
            if (!snapToken.empty) {
                for (const d of snapToken.docs) {
                    await setDoc(d.ref, { deleted: true }, { merge: true });
                }
            }
        }
    } catch (e) {}

    try {
        const bc = new BroadcastChannel('nexus_printhub_jobs');
        bc.postMessage({ type: 'PRINT_JOB_DELETED', jobId });
        bc.close();
    } catch (e) {}

    return true;
};

// ==========================================
// 4. Canteen Daily Menu & Kitchen Order Dispatch Services
// ==========================================
export const getMenu = async () => {
    try {
        const menuRef = collection(db, 'canteenMenu');
        const snapshot = await getDocs(menuRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {}
    return mockStore.get('canteenMenu') || [];
};

export const addMenuItem = async (itemData) => {
    const newItem = mockStore.add('canteenMenu', {
        ...itemData,
        price: parseFloat(itemData.price) || 0,
        prepTimeMinutes: parseInt(itemData.prepTimeMinutes, 10) || 5,
        isAvailable: itemData.isAvailable !== false,
        isSpecial: !!itemData.isSpecial,
        category: itemData.category || 'Breakfast',
        dietaryType: itemData.dietaryType || 'Veg',
        mealSlot: itemData.mealSlot || 'All Day',
        description: itemData.description || '',
        imageUrl: itemData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        calories: itemData.calories || '250 kcal',
        rating: itemData.rating || 4.8,
        createdAt: new Date().toISOString()
    });

    try {
        const menuRef = collection(db, 'canteenMenu');
        await addDoc(menuRef, {
            ...newItem,
            createdAt: serverTimestamp()
        });
    } catch (e) {}

    return newItem;
};

export const updateMenuItem = async (itemId, updates) => {
    const cleanUpdates = {
        ...updates,
        ...(updates.price !== undefined ? { price: parseFloat(updates.price) || 0 } : {}),
        ...(updates.prepTimeMinutes !== undefined ? { prepTimeMinutes: parseInt(updates.prepTimeMinutes, 10) || 5 } : {}),
        ...(updates.isAvailable !== undefined ? { isAvailable: Boolean(updates.isAvailable) } : {}),
        ...(updates.isSpecial !== undefined ? { isSpecial: Boolean(updates.isSpecial) } : {}),
        updatedAt: new Date().toISOString()
    };

    const updated = mockStore.update('canteenMenu', itemId, cleanUpdates);

    try {
        const itemRef = doc(db, 'canteenMenu', itemId);
        await updateDoc(itemRef, {
            ...cleanUpdates,
            updatedAt: serverTimestamp()
        });
    } catch (e) {}

    return updated;
};

export const deleteMenuItem = async (itemId) => {
    mockStore.remove('canteenMenu', itemId);
    try {
        const itemRef = doc(db, 'canteenMenu', itemId);
        await setDoc(itemRef, { deleted: true }, { merge: true });
    } catch (e) {}
    return true;
};

export const toggleMenuItemAvailability = async (itemId, isAvailable) => {
    return await updateMenuItem(itemId, { isAvailable });
};

/**
 * Synthesizes a pleasant cash register / payment received sound chime using Web Audio API
 */
export const playPaymentChime = () => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // 3-tone cheerful cash register chime: 587Hz (D5) -> 880Hz (A5) -> 1174Hz (D6)
        const notes = [
            { freq: 587.33, start: 0, duration: 0.12 },
            { freq: 880.00, start: 0.10, duration: 0.15 },
            { freq: 1174.66, start: 0.22, duration: 0.35 }
        ];

        notes.forEach(({ freq, start, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

            gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        });
    } catch (e) {
        console.warn('Could not play audio chime:', e);
    }
};

/**
 * Notifies the Canteen Admin across Firestore, mockStore, BroadcastChannel, and localStorage
 */
export const notifyCanteenAdminPaidOrder = (order) => {
    if (!order) return;

    const notif = {
        title: 'New Paid Canteen Order Received!',
        message: `Token #${order.orderToken} paid (₹${Number(order.totalAmount || 0).toFixed(2)}) by ${order.userName || 'Customer'} via ${order.paymentMethod || 'UPI QR'}.`,
        module: 'canteen',
        type: 'canteen_paid_order',
        orderToken: order.orderToken,
        orderId: order.id,
        amount: order.totalAmount,
        paymentId: order.razorpayPaymentId || null,
        customerName: order.userName || 'Customer',
        targetRole: 'admin_canteen',
        unread: true,
        createdAt: new Date().toISOString()
    };

    // 1. Add to notifications collection (mockStore + Firestore)
    mockStore.add('notifications', notif);
    try {
        const notifsRef = collection(db, 'notifications');
        addDoc(notifsRef, {
            ...notif,
            createdAt: serverTimestamp()
        }).catch(() => {});
    } catch (e) {}

    // 2. Broadcast across tabs and windows
    try {
        const bc = new BroadcastChannel('nexus_canteen_orders');
        bc.postMessage({
            type: 'NEW_PAID_CANTEEN_ORDER',
            order
        });
        setTimeout(() => bc.close(), 1000);
    } catch (e) {}

    // 3. LocalStorage event & window CustomEvent for immediate reactivity
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('nexus_last_canteen_paid_order', JSON.stringify({
                ...order,
                _ts: Date.now()
            }));
            window.dispatchEvent(new CustomEvent('nexus_canteen_paid_order', { detail: order }));
        } catch (e) {}
    }
};

/**
 * Real-time subscription to canteen orders across mockStore and Firestore
 */
export const subscribeCanteenOrders = (callback) => {
    // 1. Subscribe to mockStore
    const unsubMock = mockStore.subscribe('canteenOrders', (data) => {
        callback((data || []).filter(o => !o.deleted));
    });

    // 2. Subscribe to Firestore if available
    let unsubFirestore = null;
    try {
        const ordersRef = collection(db, 'canteenOrders');
        unsubFirestore = onSnapshot(ordersRef, (snapshot) => {
            if (!snapshot.empty) {
                const items = snapshot.docs
                    .map(doc => ({ ...doc.data(), firestoreId: doc.id, id: doc.id }))
                    .filter(o => !o.deleted);
                callback(items);
            }
        }, (err) => {
            console.warn('Firestore canteenOrders onSnapshot fallback to mockStore:', err.message);
        });
    } catch (e) {}

    return () => {
        if (unsubMock) unsubMock();
        if (unsubFirestore) unsubFirestore();
    };
};

export const placeOrder = async (orderData) => {
    // Generate unique order token e.g. CT-4821
    const orderToken = orderData.orderToken || `CT-${Math.floor(1000 + Math.random() * 9000)}`;
    const customerUniqueId = orderData.customerUniqueId || '';
    const orderId = orderData.id || `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newOrder = {
        ...orderData,
        id: orderId,
        orderToken,
        customerUniqueId,
        status: 'Placed',
        pickupStation: orderData.pickupStation || 'Counter 1 · Main Serving Desk',
        specialInstructions: orderData.specialInstructions || '',
        orderTime: new Date().toISOString(),
        notifiedAt: null,
        completedAt: null
    };

    mockStore.add('canteenOrders', newOrder);

    try {
        const orderRef = doc(db, 'canteenOrders', orderId);
        await setDoc(orderRef, {
            ...newOrder,
            orderTime: serverTimestamp()
        });
    } catch (e) {
        console.warn('Firestore placeOrder fallback:', e.message);
    }

    // Instantly notify Canteen Admin if order was paid
    if (orderData.paymentStatus === 'Paid') {
        notifyCanteenAdminPaidOrder(newOrder);
    }

    return newOrder;
};

export const getUserOrders = async (userId, userEmail = null, customerId = null) => {
    try {
        const ordersRef = collection(db, 'canteenOrders');
        const snapshot = await getDocs(ordersRef);
        if (!snapshot.empty) {
            const all = snapshot.docs
                .map(doc => ({ ...doc.data(), firestoreId: doc.id, id: doc.id }))
                .filter(o => !o.deleted);
            const matched = all.filter(o =>
                !userId ||
                o.userId === userId ||
                (userEmail && o.userEmail === userEmail) ||
                (customerId && o.customerUniqueId === customerId)
            );
            return matched;
        }
    } catch (e) {}

    const list = (mockStore.get('canteenOrders') || []).filter(o => !o.deleted);
    const matched = list.filter(o =>
        !userId ||
        o.userId === userId ||
        (userEmail && o.userEmail === userEmail) ||
        (customerId && o.customerUniqueId === customerId)
    );

    return matched;
};

export const getAllCanteenOrders = async () => {
    try {
        const ordersRef = collection(db, 'canteenOrders');
        const snapshot = await getDocs(ordersRef);
        if (!snapshot.empty) {
            return snapshot.docs
                .map(doc => ({ ...doc.data(), firestoreId: doc.id, id: doc.id }))
                .filter(o => !o.deleted);
        }
    } catch (e) {}
    return (mockStore.get('canteenOrders') || []).filter(o => !o.deleted);
};

export const updateOrderStatus = async (orderId, status, extraFields = {}) => {
    const isReady = status === 'Ready for Pickup';
    const isCompleted = status === 'Completed' || status === 'Delivered';

    const updates = {
        status,
        ...extraFields,
        ...(isReady ? { notifiedAt: new Date().toISOString() } : {}),
        ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
    };

    // 1. Update mockStore (supporting id, orderToken, or firestoreId)
    const updated = mockStore.update('canteenOrders', orderId, updates);

    // 2. Update Firestore document (try doc id, query by id, and query by orderToken)
    try {
        let updatedInFirestore = false;

        if (orderId) {
            const orderRef = doc(db, 'canteenOrders', orderId);
            const docSnap = await getDoc(orderRef);
            if (docSnap.exists()) {
                await updateDoc(orderRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
                updatedInFirestore = true;
            }
        }

        if (!updatedInFirestore && orderId) {
            const q = query(collection(db, 'canteenOrders'), where('id', '==', orderId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                for (const d of snap.docs) {
                    await updateDoc(d.ref, {
                        ...updates,
                        updatedAt: serverTimestamp()
                    });
                }
                updatedInFirestore = true;
            }
        }

        const tokenToSearch = updates?.orderToken || extraFields?.orderToken || orderId;
        if (!updatedInFirestore && tokenToSearch) {
            const qToken = query(collection(db, 'canteenOrders'), where('orderToken', '==', tokenToSearch));
            const snapToken = await getDocs(qToken);
            if (!snapToken.empty) {
                for (const d of snapToken.docs) {
                    await updateDoc(d.ref, {
                        ...updates,
                        updatedAt: serverTimestamp()
                    });
                }
                updatedInFirestore = true;
            }
        }
    } catch (e) {
        console.warn('Firestore updateOrderStatus fallback error:', e);
    }

    // 3. Broadcast status change across all open tabs, windows, and devices
    try {
        const bc = new BroadcastChannel('nexus_canteen_orders');
        bc.postMessage({
            type: 'CANTEEN_ORDER_STATUS_CHANGED',
            orderId,
            status,
            updates
        });
        bc.close();
    } catch (e) {}

    try {
        localStorage.setItem('nexus_canteen_last_order_status_update', JSON.stringify({
            orderId,
            status,
            updates,
            timestamp: Date.now()
        }));
    } catch (e) {}

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_canteen_order_status_changed', {
            detail: { orderId, status, updates }
        }));
    }

    return updated;
};

export const deleteCanteenOrder = async (orderId, orderToken = null) => {
    mockStore.remove('canteenOrders', orderId);
    try {
        let deletedInFirestore = false;
        if (orderId) {
            const orderRef = doc(db, 'canteenOrders', orderId);
            const docSnap = await getDoc(orderRef);
            if (docSnap.exists()) {
                await setDoc(orderRef, { deleted: true }, { merge: true });
                deletedInFirestore = true;
            }
        }
        if (!deletedInFirestore && orderId) {
            const q = query(collection(db, 'canteenOrders'), where('id', '==', orderId));
            const snap = await getDocs(q);
            if (!snap.empty) {
                for (const d of snap.docs) {
                    await setDoc(d.ref, { deleted: true }, { merge: true });
                }
                deletedInFirestore = true;
            }
        }
        const token = orderToken || orderId;
        if (!deletedInFirestore && token) {
            const qToken = query(collection(db, 'canteenOrders'), where('orderToken', '==', token));
            const snapToken = await getDocs(qToken);
            if (!snapToken.empty) {
                for (const d of snapToken.docs) {
                    await setDoc(d.ref, { deleted: true }, { merge: true });
                }
            }
        }
    } catch (e) {}

    try {
        const bc = new BroadcastChannel('nexus_canteen_orders');
        bc.postMessage({ type: 'CANTEEN_ORDER_DELETED', orderId });
        bc.close();
    } catch (e) {}

    return true;
};

// ==========================================
// 5. Event Management Services (Staff & HOD Upload, Student RSVP & Browsing)
// ==========================================
export const getEvents = async () => {
    try {
        const eventsRef = collection(db, 'campusEvents');
        const snapshot = await getDocs(eventsRef);
        if (!snapshot.empty) {
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (e) {
        console.warn('Firestore getEvents fallback:', e.message);
    }
    return mockStore.get('events') || [];
};

export const createEvent = async (eventData) => {
    const defaultBanner = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
    const capacity = parseInt(eventData.maxCapacity, 10) || 100;
    const fee = parseFloat(eventData.registrationFee) || 0;

    const newEvent = {
        id: eventData.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: eventData.title?.trim() || 'Untitled Campus Event',
        tagline: eventData.tagline?.trim() || '',
        category: eventData.category || 'Workshop',
        department: eventData.department || 'All Departments',
        departmentId: eventData.departmentId || 'ALL',
        organizerName: eventData.organizerName || 'Faculty Coordinator',
        organizerRole: eventData.organizerRole || 'staff',
        organizerEmail: eventData.organizerEmail || 'events@nexus.edu',
        organizerPhone: eventData.organizerPhone || '',
        venue: eventData.venue || 'Campus Auditorium',
        venueType: eventData.venueType || 'In-Person',
        meetingLink: eventData.meetingLink || '',
        eventDate: eventData.eventDate || new Date().toISOString().split('T')[0],
        endDate: eventData.endDate || eventData.eventDate || new Date().toISOString().split('T')[0],
        startTime: eventData.startTime || '10:00 AM',
        endTime: eventData.endTime || '04:00 PM',
        bannerImage: eventData.bannerImage || defaultBanner,
        maxCapacity: capacity,
        registeredCount: 0,
        registrationDeadline: eventData.registrationDeadline || eventData.eventDate || '',
        registrationFee: fee,
        isFree: fee === 0,
        isFeatured: !!eventData.isFeatured,
        status: eventData.status || 'Upcoming',
        tags: Array.isArray(eventData.tags) ? eventData.tags : (eventData.tags ? eventData.tags.split(',').map(t => t.trim()) : ['Campus']),
        eligibility: eventData.eligibility || 'Open to all students',
        perks: Array.isArray(eventData.perks) ? eventData.perks : ['Certificate of Participation'],
        description: eventData.description || 'Join us for this exciting campus event.',
        createdAt: new Date().toISOString()
    };

    const saved = mockStore.add('events', newEvent);

    try {
        const eventsRef = collection(db, 'campusEvents');
        await setDoc(doc(eventsRef, saved.id), saved);
    } catch (e) {
        console.warn('Firestore createEvent fallback:', e.message);
    }

    return saved;
};

export const updateEvent = async (eventId, updates) => {
    const updated = mockStore.update('events', eventId, updates);
    try {
        const eventRef = doc(db, 'campusEvents', eventId);
        await updateDoc(eventRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn('Firestore updateEvent fallback:', e.message);
    }
    return updated;
};

export const deleteEvent = async (eventId) => {
    mockStore.remove('events', eventId);
    try {
        const eventRef = doc(db, 'campusEvents', eventId);
        await setDoc(eventRef, { deleted: true }, { merge: true });
    } catch (e) {
        console.warn('Firestore deleteEvent fallback:', e.message);
    }
    return true;
};

export const getEventRegistrations = async (eventId = null) => {
    let list = mockStore.get('eventRegistrations') || [];
    try {
        const regRef = collection(db, 'eventRegistrations');
        const snapshot = await getDocs(regRef);
        if (!snapshot.empty) {
            list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
    } catch (e) {
        console.warn('Firestore getEventRegistrations fallback:', e.message);
    }

    if (eventId) {
        return list.filter(r => r.eventId === eventId && r.status !== 'Cancelled');
    }
    return list.filter(r => r.status !== 'Cancelled');
};

export const registerForEvent = async (eventId, studentData) => {
    const events = mockStore.get('events') || [];
    const event = events.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    const currentRegs = mockStore.get('eventRegistrations') || [];
    const alreadyRegistered = currentRegs.find(
        r => r.eventId === eventId && (r.userId === studentData.userId || r.userEmail === studentData.userEmail) && r.status !== 'Cancelled'
    );
    if (alreadyRegistered) {
        throw new Error('You are already registered for this event.');
    }

    const ticketNumber = `NX-EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRegistration = {
        id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        eventId,
        eventTitle: event.title,
        userId: studentData.userId || '',
        userName: studentData.userName || '',
        userEmail: studentData.userEmail || '',
        userRole: studentData.userRole || 'student',
        usn: studentData.usn || '',
        semester: studentData.semester || '',
        department: studentData.department || '',
        phone: studentData.phone || '',
        ticketNumber,
        registrationDate: new Date().toISOString(),
        status: 'Confirmed'
    };

    const savedReg = mockStore.add('eventRegistrations', newRegistration);

    // Increment registered count
    const updatedCount = (event.registeredCount || 0) + 1;
    mockStore.update('events', eventId, { registeredCount: updatedCount });

    try {
        const regRef = collection(db, 'eventRegistrations');
        await setDoc(doc(regRef, savedReg.id), savedReg);

        const eventRef = doc(db, 'campusEvents', eventId);
        await updateDoc(eventRef, { registeredCount: updatedCount });
    } catch (e) {
        console.warn('Firestore registerForEvent fallback:', e.message);
    }

    return savedReg;
};

export const cancelEventRegistration = async (registrationId, eventId) => {
    mockStore.update('eventRegistrations', registrationId, { status: 'Cancelled' });

    const events = mockStore.get('events') || [];
    const event = events.find(e => e.id === eventId);
    if (event) {
        const updatedCount = Math.max(0, (event.registeredCount || 1) - 1);
        mockStore.update('events', eventId, { registeredCount: updatedCount });
        try {
            const eventRef = doc(db, 'campusEvents', eventId);
            await updateDoc(eventRef, { registeredCount: updatedCount });
        } catch (e) {}
    }

    try {
        const regRef = doc(db, 'eventRegistrations', registrationId);
        await updateDoc(regRef, { status: 'Cancelled' });
    } catch (e) {}

    return true;
};

// ==========================================
// 6. Complaint Portal Services (Student Filing, Staff & HOD Review/Resolution)
// ==========================================
export const getComplaints = async (user = null) => {
    try {
        const complaintsRef = collection(db, 'campusComplaints');
        let q = complaintsRef;

        if (user?.id) {
            const role = (user.role || '').toLowerCase();
            const dept = user.departmentId || user.department || 'CSE';

            if (role === 'student') {
                // 1. Fetch own non-anonymous complaints
                const qNonAnon = query(complaintsRef, where('studentId', '==', user.id));
                const nonAnonSnap = await getDocs(qNonAnon);
                const nonAnonList = nonAnonSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // 2. Fetch tracked anonymous complaints from private subcollection
                let anonList = [];
                try {
                    const trackedRef = collection(db, 'users', user.id, 'trackedComplaints');
                    const trackedSnap = await getDocs(trackedRef);
                    const trackedDocIds = trackedSnap.docs.map(d => d.id);
                    if (trackedDocIds.length > 0) {
                        const fetchedAnon = await Promise.all(
                            trackedDocIds.map(async (cid) => {
                                const cSnap = await getDoc(doc(db, 'campusComplaints', cid));
                                return cSnap.exists() ? { id: cSnap.id, ...cSnap.data(), isAnonymous: true } : null;
                            })
                        );
                        anonList = fetchedAnon.filter(Boolean);
                    }
                } catch (trErr) {
                    console.warn('Could not load tracked anonymous complaints:', trErr.message);
                }

                // Merge and deduplicate
                const allStudent = [...nonAnonList, ...anonList].filter(c => !c.deleted);
                return allStudent;
            } else if (role === 'teacher' || role === 'staff') {
                // General Faculty / Staff: strictly restricted to Staff Advisor or Campus Maintenance
                q = query(
                    complaintsRef,
                    where('departmentId', 'in', [dept, 'ALL']),
                    where('targetAuthority', 'in', ['Staff Advisor (Faculty Mentor)', 'Campus Maintenance Desk'])
                );
            } else if (role === 'hod') {
                // HOD: all complaints for verified department
                q = query(complaintsRef, where('departmentId', 'in', [dept, 'ALL']));
            }
        }

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(c => !c.deleted);
        }
    } catch (e) {
        console.warn('Firestore getComplaints fallback:', e.message);
    }
    const list = mockStore.get('complaints') || [];
    if (user?.id) {
        const role = (user.role || '').toLowerCase();
        const dept = user.departmentId || user.department;
        if (role === 'student') {
            return list.filter(c => (c.studentId === user.id || c.submitterUid === user.id) && !c.deleted);
        } else if (role === 'teacher' || role === 'staff') {
            return list.filter(c => (!dept || c.departmentId === dept || c.departmentId === 'ALL') &&
                (c.targetAuthority === 'Staff Advisor (Faculty Mentor)' || c.targetAuthority === 'Campus Maintenance Desk' || c.assignedTo === user.name) && !c.deleted);
        } else if (role === 'hod') {
            return list.filter(c => (!dept || c.departmentId === dept || c.departmentId === 'ALL') && !c.deleted);
        }
    }
    return list.filter(c => !c.deleted);
};

export const subscribeComplaints = (user, callback, onError) => {
    if (!user?.id) {
        callback([]);
        return () => {};
    }

    if (user.isDemo) {
        const unsub = mockStore.subscribe('complaints', (data) => {
            const list = data || [];
            const role = (user.role || '').toLowerCase();
            const dept = user.departmentId || user.department;
            if (role === 'student') {
                callback(list.filter(c => (c.studentId === user.id || c.submitterUid === user.id) && !c.deleted));
            } else if (role === 'teacher' || role === 'staff') {
                callback(list.filter(c => (!dept || c.departmentId === dept || c.departmentId === 'ALL') &&
                    (c.targetAuthority === 'Staff Advisor (Faculty Mentor)' || c.targetAuthority === 'Campus Maintenance Desk' || c.assignedTo === user.name) && !c.deleted));
            } else if (role === 'hod') {
                callback(list.filter(c => (!dept || c.departmentId === dept || c.departmentId === 'ALL') && !c.deleted));
            } else {
                callback(list.filter(c => !c.deleted));
            }
        });
        return unsub;
    }

    try {
        const complaintsRef = collection(db, 'campusComplaints');
        const role = (user.role || '').toLowerCase();
        const dept = user.departmentId || user.department || 'CSE';

        if (role === 'student') {
            let nonAnonItems = [];
            let trackedAnonItems = [];

            const mergeAndEmit = () => {
                const combined = [...nonAnonItems, ...trackedAnonItems].filter(c => !c.deleted);
                callback(combined);
            };

            // 1. Non-anonymous listener
            const qNonAnon = query(complaintsRef, where('studentId', '==', user.id));
            const unsubNonAnon = onSnapshot(qNonAnon, (snapshot) => {
                nonAnonItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                mergeAndEmit();
            }, (err) => {
                console.warn('Non-anon complaint listener error:', err.message);
                if (onError) onError(err);
            });

            // 2. Private tracked complaints listener
            const trackedRef = collection(db, 'users', user.id, 'trackedComplaints');
            const unsubTracked = onSnapshot(trackedRef, async (snapshot) => {
                try {
                    const ids = snapshot.docs.map(d => d.id);
                    if (ids.length === 0) {
                        trackedAnonItems = [];
                        mergeAndEmit();
                        return;
                    }
                    const fetched = await Promise.all(
                        ids.map(async (cid) => {
                            const cSnap = await getDoc(doc(db, 'campusComplaints', cid));
                            return cSnap.exists() ? { id: cSnap.id, ...cSnap.data(), isAnonymous: true } : null;
                        })
                    );
                    trackedAnonItems = fetched.filter(Boolean);
                    mergeAndEmit();
                } catch (e) {
                    console.warn('Tracked complaint fetch error:', e.message);
                }
            });

            return () => {
                unsubNonAnon();
                unsubTracked();
            };
        }

        let q = complaintsRef;
        if (role === 'teacher' || role === 'staff') {
            q = query(
                complaintsRef,
                where('departmentId', 'in', [dept, 'ALL']),
                where('targetAuthority', 'in', ['Staff Advisor (Faculty Mentor)', 'Campus Maintenance Desk'])
            );
        } else if (role === 'hod') {
            q = query(complaintsRef, where('departmentId', 'in', [dept, 'ALL']));
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => !c.deleted);
                callback(items);
            },
            (error) => {
                console.warn('Complaints listener error, falling back:', error.message);
                if (onError) onError(error);
                const list = mockStore.get('complaints') || [];
                callback(list.filter(c => !c.deleted));
            }
        );
        return unsubscribe;
    } catch (e) {
        console.warn('subscribeComplaints setup error:', e);
        if (onError) onError(e);
        return () => {};
    }
};

export const createComplaint = async (complaintData) => {
    const ticketNumber = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const isAnon = !!complaintData.isAnonymous;
    const realStudentUid = complaintData.studentId || '';

    // Sanitize attachments: remove real user UID from storage path/URL
    const sanitizedAttachments = (complaintData.attachments || []).map(att => {
        const opaqueId = Math.random().toString(36).substring(2, 10);
        let safeUrl = att.url || '';
        if (isAnon && realStudentUid && safeUrl.includes(realStudentUid)) {
            safeUrl = safeUrl.replace(realStudentUid, `anon-${opaqueId}`);
        }
        return {
            id: att.id || `att-${Date.now()}-${opaqueId}`,
            name: att.name || 'Evidence Attachment',
            url: safeUrl,
            storagePath: isAnon
                ? `attachments/complaints/anonymous/${opaqueId}/${att.name || 'file'}`
                : (att.storagePath || `attachments/complaints/${realStudentUid}/${att.name || 'file'}`),
            isAnonymous: isAnon
        };
    });

    const newComplaint = {
        id: complaintData.id || `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ticketNumber,
        title: complaintData.title?.trim() || 'Untitled Complaint',
        category: complaintData.category || 'Infrastructure & Lab Equipment',
        department: complaintData.department || 'All Departments',
        departmentId: complaintData.departmentId || 'ALL',
        severity: complaintData.severity || 'Medium',
        targetAuthority: complaintData.targetAuthority || 'Staff Advisor (Faculty Mentor)',
        status: 'Pending Review',
        description: complaintData.description?.trim() || '',
        location: complaintData.location?.trim() || 'Campus Premises',
        isAnonymous: isAnon,
        // Crucial: for anonymous complaints, studentId is strictly masked to 'anonymous'
        studentId: isAnon ? 'anonymous' : realStudentUid,
        studentName: isAnon ? 'Anonymous Student' : (complaintData.studentName || ''),
        studentUsn: isAnon ? 'CONFIDENTIAL' : (complaintData.studentUsn || ''),
        studentEmail: isAnon ? '' : (complaintData.studentEmail || ''),
        studentPhone: isAnon ? '' : (complaintData.studentPhone || ''),
        submittedAt: new Date().toISOString(),
        assignedTo: complaintData.assignedTo || 'Department Review Committee',
        officialRemarks: '',
        resolvedAt: null,
        attachments: sanitizedAttachments,
        createdAt: new Date().toISOString()
    };

    // 1. Save to mockStore
    const saved = mockStore.add('complaints', { ...newComplaint, submitterUid: realStudentUid });

    // 2. Persist to Firestore
    try {
        const complaintsRef = collection(db, 'campusComplaints');
        await setDoc(doc(complaintsRef, saved.id), newComplaint);

        // 3. For anonymous complaints, register tracking reference in student's private subcollection
        if (isAnon && realStudentUid) {
            try {
                const trackingRef = doc(db, 'users', realStudentUid, 'trackedComplaints', saved.id);
                await setDoc(trackingRef, {
                    complaintId: saved.id,
                    ticketNumber,
                    title: newComplaint.title,
                    category: newComplaint.category,
                    departmentId: newComplaint.departmentId,
                    submittedAt: newComplaint.submittedAt,
                    isAnonymous: true
                });
            } catch (trErr) {
                console.warn('Private complaint tracking registration error:', trErr.message);
            }
        }
    } catch (e) {
        console.warn('Firestore createComplaint fallback:', e.message);
    }

    return saved;
};

export const updateComplaint = async (complaintId, updates) => {
    const updated = mockStore.update('complaints', complaintId, updates);
    try {
        const compRef = doc(db, 'campusComplaints', complaintId);
        await updateDoc(compRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (e) {
        console.warn('Firestore updateComplaint fallback:', e.message);
    }
    return updated;
};

export const deleteComplaint = async (complaintId) => {
    mockStore.remove('complaints', complaintId);
    try {
        const compRef = doc(db, 'campusComplaints', complaintId);
        await setDoc(compRef, { deleted: true }, { merge: true });
    } catch (e) {
        console.warn('Firestore deleteComplaint fallback:', e.message);
    }
    return true;
};

