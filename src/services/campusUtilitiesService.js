import { collection, getDocs, doc, setDoc, updateDoc, addDoc, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// ==========================================
// 1. Bus Tracking Services
// ==========================================
export const getBuses = async () => {
    const busesRef = collection(db, 'buses');
    const snapshot = await getDocs(busesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateBusLocation = async (busId, coords) => {
    const busRef = doc(db, 'buses', busId);
    await updateDoc(busRef, {
        currentLocation: coords,
        updatedAt: serverTimestamp()
    });
};

// ==========================================
// 2. Digital Library Services
// ==========================================
export const getBooks = async () => {
    const booksRef = collection(db, 'libraryBooks');
    const snapshot = await getDocs(booksRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const borrowBook = async (bookId, userId) => {
    const bookRef = doc(db, 'libraryBooks', bookId);
    const bookSnap = await getDoc(bookRef);
    
    if (bookSnap.exists()) {
        const data = bookSnap.data();
        if (data.availableCopies > 0) {
            await updateDoc(bookRef, {
                availableCopies: data.availableCopies - 1
            });
            // Ideally, you'd also track which user borrowed it in a subcollection or separate 'borrowedBooks' collection
            return true;
        }
    }
    return false; // Book unavailable
};

export const returnBook = async (bookId, userId) => {
    const bookRef = doc(db, 'libraryBooks', bookId);
    const bookSnap = await getDoc(bookRef);
    
    if (bookSnap.exists()) {
        const data = bookSnap.data();
        if (data.availableCopies < data.totalCopies) {
            await updateDoc(bookRef, {
                availableCopies: data.availableCopies + 1
            });
            return true;
        }
    }
    return false;
};

// ==========================================
// 3. Xerox & Print Hub Services
// ==========================================
export const submitPrintJob = async (jobData) => {
    const jobsRef = collection(db, 'printJobs');
    const docRef = await addDoc(jobsRef, {
        ...jobData,
        status: 'Queued',
        timestamp: serverTimestamp()
    });
    return docRef.id;
};

export const getStudentPrintJobs = async (userId) => {
    const jobsRef = collection(db, 'printJobs');
    const q = query(jobsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllPrintJobs = async () => {
    const jobsRef = collection(db, 'printJobs');
    const snapshot = await getDocs(jobsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updatePrintJobStatus = async (jobId, status) => {
    const jobRef = doc(db, 'printJobs', jobId);
    await updateDoc(jobRef, { status });
};

// ==========================================
// 4. Canteen Pre-Ordering Services
// ==========================================
export const getMenu = async () => {
    const menuRef = collection(db, 'canteenMenu');
    const snapshot = await getDocs(menuRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const placeOrder = async (orderData) => {
    const ordersRef = collection(db, 'canteenOrders');
    const docRef = await addDoc(ordersRef, {
        ...orderData,
        status: 'Received',
        orderTime: serverTimestamp()
    });
    return docRef.id;
};

export const getUserOrders = async (userId) => {
    const ordersRef = collection(db, 'canteenOrders');
    const q = query(ordersRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateOrderStatus = async (orderId, status) => {
    const orderRef = doc(db, 'canteenOrders', orderId);
    await updateDoc(orderRef, { status });
};


// ==========================================
// 5. Seed Initial Data
// ==========================================
export const seedCampusData = async () => {
    try {
        console.log("Seeding Campus Data...");

        // Seed Buses (KSSEM Routes)
        const busesRef = collection(db, 'buses');
        const dummyBuses = [
            { routeNumber: '1', routeName: 'KSSEM to Majestic', driverName: 'Raju', driverPhone: '9876543210', currentLocation: { lat: 12.89, lng: 77.53 }, nextStop: 'Banashankari', etaMinutes: 15, status: 'On Time' },
            { routeNumber: '2', routeName: 'KSSEM to Silk Board', driverName: 'Kumar', driverPhone: '9876543211', currentLocation: { lat: 12.88, lng: 77.56 }, nextStop: 'BTM Layout', etaMinutes: 25, status: 'Delayed' },
            { routeNumber: '3', routeName: 'KSSEM to Kengeri', driverName: 'Ramesh', driverPhone: '9876543212', currentLocation: { lat: 12.90, lng: 77.50 }, nextStop: 'RR Nagar', etaMinutes: 10, status: 'On Time' },
            { routeNumber: '4', routeName: 'KSSEM to Jayanagar', driverName: 'Suresh', driverPhone: '9876543213', currentLocation: { lat: 12.92, lng: 77.58 }, nextStop: 'JP Nagar', etaMinutes: 20, status: 'On Time' }
        ];

        for (const bus of dummyBuses) {
            await addDoc(busesRef, bus);
        }

        // Seed Digital Library Books
        const libraryRef = collection(db, 'libraryBooks');
        const dummyBooks = [
            { title: 'Data Structures and Algorithms', author: 'Narasimha Karumanchi', isbn: '978-8192107554', category: 'Computer Science', availableCopies: 5, totalCopies: 5, shelfLocation: 'CS-Rack1' },
            { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', availableCopies: 2, totalCopies: 3, shelfLocation: 'CS-Rack1' },
            { title: 'Engineering Thermodynamics', author: 'P.K. Nag', isbn: '978-1259062568', category: 'Mechanical', availableCopies: 4, totalCopies: 4, shelfLocation: 'ME-Rack2' },
            { title: 'Higher Engineering Mathematics', author: 'B.S. Grewal', isbn: '978-8174091956', category: 'Mathematics', availableCopies: 10, totalCopies: 15, shelfLocation: 'MA-Rack3' }
        ];

        for (const book of dummyBooks) {
            await addDoc(libraryRef, book);
        }

        // Seed Canteen Menu
        const menuRef = collection(db, 'canteenMenu');
        const dummyMenu = [
            { itemName: 'Masala Dosa', category: 'Meals', price: 45, isAvailable: true, prepTimeMinutes: 5, imageUrl: 'dosa.jpg' },
            { itemName: 'Veg Meals', category: 'Meals', price: 60, isAvailable: true, prepTimeMinutes: 10, imageUrl: 'meals.jpg' },
            { itemName: 'Samosa', category: 'Snacks', price: 15, isAvailable: true, prepTimeMinutes: 2, imageUrl: 'samosa.jpg' },
            { itemName: 'Filter Coffee', category: 'Beverages', price: 12, isAvailable: true, prepTimeMinutes: 3, imageUrl: 'coffee.jpg' },
            { itemName: 'Paneer Fried Rice', category: 'Meals', price: 80, isAvailable: true, prepTimeMinutes: 15, imageUrl: 'fried_rice.jpg' }
        ];

        for (const item of dummyMenu) {
            await addDoc(menuRef, item);
        }

        console.log("Seeding Completed!");
        return true;
    } catch (error) {
        console.error("Error seeding data:", error);
        return false;
    }
};
