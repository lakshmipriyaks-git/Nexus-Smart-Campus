const STORAGE_PREFIX = 'nexus_mock_';
const LEGACY_DATA_CLEARED_KEY = 'nexus_legacy_demo_data_cleared';

class MockStore {
    constructor() {
        this.listeners = new Map();
        this.clearLegacyData();
        this.data = this.loadAll();
    }

    clearLegacyData() {
        if (localStorage.getItem(LEGACY_DATA_CLEARED_KEY)) return;

        const keys = Object.keys(localStorage).filter((key) =>
            key.startsWith(STORAGE_PREFIX) || [
                'nexus_unified_auth_user',
                'nexus_demo_auth_user',
                'nexus_domain_auth_sessions'
            ].includes(key)
        );
        keys.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(LEGACY_DATA_CLEARED_KEY, 'true');
    }

    loadCollection(key, initialValue) {
        try {
            const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn(`Error loading mock data for ${key}:`, e);
        }
        return initialValue;
    }

    saveCollection(key, value) {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
            this.emit(key, value);
        } catch (e) {
            console.warn(`Error saving mock data for ${key}:`, e);
        }
    }

    loadAll() {
        return {
            users: this.loadCollection('users', []),
            classes: this.loadCollection('classes', []),
            courses: this.loadCollection('courses', []),
            joinRequests: this.loadCollection('joinRequests', []),
            assessments: this.loadCollection('assessments', []),
            grades: this.loadCollection('grades', []),
            attendance: this.loadCollection('attendance', []),
            tasks: this.loadCollection('tasks', []),
            events: this.loadCollection('events', []),
            announcements: this.loadCollection('announcements', []),
            buses: this.loadCollection('buses', []),
            libraryBooks: this.loadCollection('libraryBooks', []),
            libraryBorrowings: this.loadCollection('libraryBorrowings', []),
            canteenMenu: this.loadCollection('canteenMenu', []),
            canteenOrders: this.loadCollection('canteenOrders', []),
            printJobs: this.loadCollection('printJobs', []),
            eventRegistrations: this.loadCollection('eventRegistrations', []),
            complaints: this.loadCollection('complaints', []),
            preferenceForms: this.loadCollection('preferenceForms', []),
            subjectPreferences: this.loadCollection('subjectPreferences', []),
            payments: this.loadCollection('payments', []),
            notifications: this.loadCollection('notifications', []),
            resources: this.loadCollection('resources', [])
        };
    }

    subscribe(collectionKey, callback) {
        if (!this.listeners.has(collectionKey)) {
            this.listeners.set(collectionKey, new Set());
        }
        this.listeners.get(collectionKey).add(callback);

        // Immediately trigger with current data
        callback(this.data[collectionKey] || []);

        return () => {
            if (this.listeners.has(collectionKey)) {
                this.listeners.get(collectionKey).delete(callback);
            }
        };
    }

    emit(collectionKey, data) {
        if (this.listeners.has(collectionKey)) {
            this.listeners.get(collectionKey).forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`MockStore listener error on ${collectionKey}:`, e);
                }
            });
        }
    }

    get(collectionKey) {
        return this.data[collectionKey] || [];
    }

    add(collectionKey, item) {
        const id = item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newItem = {
            id,
            createdAt: new Date().toISOString(),
            ...item
        };
        const list = [...(this.data[collectionKey] || []), newItem];
        this.data[collectionKey] = list;
        this.saveCollection(collectionKey, list);
        return newItem;
    }

    update(collectionKey, id, updates) {
        const list = (this.data[collectionKey] || []).map(item => {
            if (
                item.id === id ||
                (item.orderToken && (item.orderToken === id || item.orderToken === updates?.orderToken)) ||
                (item.pickupToken && (item.pickupToken === id || item.pickupToken === updates?.pickupToken)) ||
                (item.firestoreId && item.firestoreId === id)
            ) {
                return { ...item, ...updates, updatedAt: new Date().toISOString() };
            }
            return item;
        });
        this.data[collectionKey] = list;
        this.saveCollection(collectionKey, list);
        return list.find(item => item.id === id || (item.orderToken && item.orderToken === id) || (item.pickupToken && item.pickupToken === id));
    }

    remove(collectionKey, id) {
        const list = (this.data[collectionKey] || []).filter(item =>
            item.id !== id &&
            item.orderToken !== id &&
            item.pickupToken !== id &&
            item.firestoreId !== id
        );
        this.data[collectionKey] = list;
        this.saveCollection(collectionKey, list);
    }

    resetAll() {
        localStorage.clear();
        this.data = this.loadAll();
        Object.keys(this.data).forEach(key => this.emit(key, this.data[key]));
    }

    clearDemoData() {
        const demoStorageKeys = [
            'nexus_unified_auth_user',
            'nexus_demo_auth_user',
            'nexus_domain_auth_sessions',
            ...Object.keys(localStorage).filter((key) => key.startsWith('nexus_mock_'))
        ];

        demoStorageKeys.forEach((key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('Unable to clear localStorage key:', key, e);
            }
        });

        Object.keys(this.data).forEach((key) => {
            this.data[key] = [];
            this.emit(key, this.data[key]);
        });
    }
}

export const mockStore = new MockStore();
