export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    HOD: 'hod'
};

export const STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    REJECTED: 'rejected',
};

export const DEPARTMENTS = [
    { id: 'CSE', label: 'Computer Science & Engineering' },
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
