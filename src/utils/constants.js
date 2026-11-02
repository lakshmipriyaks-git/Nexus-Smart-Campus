export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    STAFF: 'staff',
    HOD: 'hod',
    ADMIN: 'admin',
    DRIVER: 'driver',
    ADMIN_LIBRARY: 'admin_library',
    ADMIN_XEROX: 'admin_xerox',
    ADMIN_CANTEEN: 'admin_canteen'
};

export const FULL_ACCESS_ROLES = [
    ROLES.STUDENT,
    ROLES.TEACHER,
    ROLES.STAFF,
    ROLES.HOD,
    ROLES.ADMIN,
    'student',
    'teacher',
    'staff',
    'hod',
    'admin'
];

export const ROLE_ALLOWED_DOMAINS = {
    [ROLES.ADMIN_XEROX]: ['printhub'],
    'admin_xerox': ['printhub'],
    [ROLES.ADMIN_CANTEEN]: ['canteen'],
    'admin_canteen': ['canteen'],
    [ROLES.DRIVER]: ['bustracking'],
    'driver': ['bustracking'],
    [ROLES.ADMIN_LIBRARY]: ['library'],
    'admin_library': ['library']
};

export const DOMAIN_HOME_PATHS = {
    eduhub: '/dashboard',
    library: '/digital-library',
    printhub: '/print-hub',
    canteen: '/canteen',
    bustracking: '/bus-tracking',
    events: '/events',
    complaints: '/complaints'
};

export const canRoleAccessDomain = (role, domainKey) => {
    if (!role) return false;
    const r = String(role).toLowerCase().trim();
    if (FULL_ACCESS_ROLES.includes(r)) return true;
    const allowed = ROLE_ALLOWED_DOMAINS[r];
    if (allowed && allowed.includes(domainKey)) return true;
    return false;
};

export const getAllowedDomainsForRole = (role) => {
    if (!role) return [];
    const r = String(role).toLowerCase().trim();
    if (FULL_ACCESS_ROLES.includes(r)) {
        return ['eduhub', 'library', 'printhub', 'canteen', 'bustracking', 'events', 'complaints'];
    }
    return ROLE_ALLOWED_DOMAINS[r] || [];
};

export const ROLE_DOMAIN_NAMES = {
    [ROLES.STUDENT]: 'Student Community',
    [ROLES.STAFF]: 'Staff / Faculty',
    [ROLES.TEACHER]: 'Staff / Faculty',
    [ROLES.HOD]: 'HOD Department',
    [ROLES.ADMIN_XEROX]: 'Print Hub (Xerox Admin)',
    [ROLES.ADMIN_CANTEEN]: 'Smart Canteen (Canteen Admin)',
    [ROLES.DRIVER]: 'Bus Tracking (Bus Driver)',
    [ROLES.ADMIN_LIBRARY]: 'Digital Library (Library Admin)',
    student: 'Student Community',
    staff: 'Staff / Faculty',
    teacher: 'Staff / Faculty',
    hod: 'HOD Department',
    admin_xerox: 'Print Hub (Xerox Admin)',
    admin_canteen: 'Smart Canteen (Canteen Admin)',
    driver: 'Bus Tracking (Bus Driver)',
    admin_library: 'Digital Library (Library Admin)',
};

export const getDomainKeyForRole = (role) => {
    if (!role) return 'eduhub';
    const r = String(role).toLowerCase().trim();
    if (r === 'admin_xerox') return 'printhub';
    if (r === 'admin_canteen') return 'canteen';
    if (r === 'driver') return 'bustracking';
    if (r === 'admin_library') return 'library';
    if (r === 'hod') return 'hod';
    if (r === 'staff' || r === 'teacher') return 'staff';
    return 'student';
};

const BINDINGS_STORAGE_KEY = 'nexus_email_domain_bindings';

const DEFAULT_SEED_BINDINGS = {
    'student@kssem.edu': { role: 'student', domainKey: 'eduhub', domainName: 'Student Community' },
    'staff@kssem.edu': { role: 'staff', domainKey: 'staff', domainName: 'Staff / Faculty' },
    'hod@kssem.edu': { role: 'hod', domainKey: 'hod', domainName: 'HOD Department' },
    'xerox@kssem.edu': { role: 'admin_xerox', domainKey: 'printhub', domainName: 'Print Hub (Xerox Admin)' },
    'canteen@kssem.edu': { role: 'admin_canteen', domainKey: 'canteen', domainName: 'Smart Canteen (Canteen Admin)' },
    'driver@kssem.edu': { role: 'driver', domainKey: 'bustracking', domainName: 'Bus Tracking (Bus Driver)' },
    'library@kssem.edu': { role: 'admin_library', domainKey: 'library', domainName: 'Digital Library (Library Admin)' },
    'manjunathtk@kssem.edu.in': { role: 'hod', domainKey: 'hod', domainName: 'HOD Department' },
    'suhani@gmail.com': { role: 'admin_xerox', domainKey: 'printhub', domainName: 'Print Hub (Xerox Admin)' },
    'ambika@gmail.com': { role: 'admin_library', domainKey: 'library', domainName: 'Digital Library (Library Admin)' },
    'canteen@gmail.com': { role: 'admin_canteen', domainKey: 'canteen', domainName: 'Smart Canteen (Canteen Admin)' },
    'balaya@gmail.com': { role: 'admin_canteen', domainKey: 'canteen', domainName: 'Smart Canteen (Canteen Admin)' },
    'shilpa@gmail.com': { role: 'staff', domainKey: 'staff', domainName: 'Staff / Faculty' },
    'sanjana@gmail.com': { role: 'student', domainKey: 'eduhub', domainName: 'Student Community' }
};

const SEED_CAMPUS_EMAILS = [
    'manjunathtk@kssem.edu.in',
    'suhani@gmail.com',
    'ambika@gmail.com',
    'canteen@gmail.com',
    'shilpa@gmail.com',
    'sanjana@gmail.com',
    'student@kssem.edu',
    'staff@kssem.edu',
    'hod@kssem.edu',
    'xerox@kssem.edu',
    'canteen@kssem.edu',
    'driver@kssem.edu',
    'library@kssem.edu'
];

export const getEmailDomainBinding = (email) => {
    if (!email) return null;
    const cleanEmail = String(email).trim().toLowerCase();
    try {
        const stored = localStorage.getItem(BINDINGS_STORAGE_KEY);
        if (stored) {
            const map = JSON.parse(stored);
            if (map && map[cleanEmail]) {
                return map[cleanEmail];
            }
        }
    } catch (e) {}
    if (DEFAULT_SEED_BINDINGS[cleanEmail]) {
        return DEFAULT_SEED_BINDINGS[cleanEmail];
    }
    return null;
};

export const setEmailDomainBinding = (email, role) => {
    if (!email || !role) return;
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase();
    try {
        const stored = localStorage.getItem(BINDINGS_STORAGE_KEY);
        const map = stored ? JSON.parse(stored) : {};
        map[cleanEmail] = {
            role: cleanRole,
            domainKey: getDomainKeyForRole(cleanRole),
            domainName: ROLE_DOMAIN_NAMES[cleanRole] || cleanRole.toUpperCase(),
            boundAt: new Date().toISOString()
        };
        localStorage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
};

const SAVED_EMAILS_STORAGE_KEY = 'nexus_saved_campus_emails';

export const getSavedCampusEmails = () => {
    try {
        const direct = localStorage.getItem(SAVED_EMAILS_STORAGE_KEY);
        const list = direct ? JSON.parse(direct) : [];
        const bindings = localStorage.getItem(BINDINGS_STORAGE_KEY);
        const bindingMap = bindings ? JSON.parse(bindings) : {};
        const allEmails = Array.from(new Set([...list, ...Object.keys(bindingMap), ...SEED_CAMPUS_EMAILS])).filter(Boolean);
        return allEmails;
    } catch {
        return SEED_CAMPUS_EMAILS;
    }
};

export const saveCampusEmail = (email) => {
    if (!email) return;
    const clean = String(email).trim().toLowerCase();
    try {
        const direct = localStorage.getItem(SAVED_EMAILS_STORAGE_KEY);
        const list = direct ? JSON.parse(direct) : [];
        const filtered = list.filter(e => e.toLowerCase() !== clean);
        filtered.unshift(clean);
        localStorage.setItem(SAVED_EMAILS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 30)));
    } catch (e) {}
};

export const STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    REJECTED: 'rejected',
};

export const DEPARTMENTS = [
    { id: 'CSE', label: 'Computer Science & Engineering' },
    { id: 'AIDS', label: 'Artificial Intelligence and Data Science' },
    { id: 'ECE', label: 'Electronics & Communication' },
    { id: 'MECH', label: 'Mechanical Engineering' },
    { id: 'CIVIL', label: 'Civil Engineering' },
    { id: 'MBA', label: 'Master of Business Administration' },
];

export const SUBJECT_PREFS_TERMS = [
    { id: 'EVEN_UG_2025_26', label: 'EVEN SEMESTER UG 2025-26' },
    { id: 'ODD_UG_2025_26', label: 'ODD SEMESTER UG 2025-26' },
];

export const SUBJECT_PREFS_SEMESTERS = {
    'EVEN_UG_2025_26': ['Semester-II', 'Semester-IV', 'Semester-VI'],
    'ODD_UG_2025_26': ['Semester-III', 'Semester-V', 'Semester-VII'],
};

export const SUBJECTS_MOCK = {
    'Semester-II': [
        'Introduction to AI (1BAIA203)',
        'Introduction to Python Programming (1BPLC205B)',
        'Biology For Engineers'
    ],
    'Semester-IV': [
        'Analysis & Design of Algorithms (BCS401)',
        'Database Management Systems (BCS403)',
        'Discrete Mathematics (BCS405A)'
    ],
    'Semester-VI': [
        'Big Data Analytics (BAD601)',
        'Machine Learning (BAD602)',
        'Mobile Application Development with Flutter (BCGL657A)'
    ],
    // Mocking Odd semesters to prevent empty lists
    'Semester-III': ['Data Structures (BCS301)', 'Computer Organization (BCS302)'],
    'Semester-V': ['Computer Networks (BCS501)', 'Web Technologies (BCS502)'],
    'Semester-VII': ['Cloud Computing (BCS701)', 'Cyber Security (BCS702)'],
};
