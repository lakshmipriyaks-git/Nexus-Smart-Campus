import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCampusAiContext, getContextualSuggestions } from '../src/services/aiContextBuilder.js';

test('1. Student Context: Builds verified profile and isolates student identity', () => {
    const studentUser = {
        id: 'student-101',
        name: 'Ananya Sharma',
        email: 'ananya.s@kssem.edu.in',
        role: 'student',
        usn: '1KS21CS088',
        departmentId: 'CSE',
        semester: '6th Semester'
    };

    const context = buildCampusAiContext({
        user: studentUser,
        locationPath: '/dashboard',
        dataContext: {}
    });

    assert.ok(context.includes('Ananya Sharma'), 'Should contain student name');
    assert.ok(context.includes('1KS21CS088'), 'Should contain student USN');
    assert.ok(context.includes('CSE'), 'Should contain department');
    assert.ok(context.includes('6th Semester'), 'Should contain semester');
    assert.ok(context.includes('User Role: STUDENT'), 'Should reflect student role');
});

test('2. Attendance Calculation: Accurately calculates percentage and flags <75% VTU threshold', () => {
    const studentUser = { id: 'stu-1', name: 'Rahul Verma', role: 'student', usn: '1KS21CS045' };

    const dataContext = {
        classes: [
            { id: 'cls-1', name: '6th Sem CSE A', section: 'A', teacherName: 'Dr. Rao' }
        ],
        courses: [
            { id: 'crs-high', classId: 'cls-1', name: 'Data Structures', code: 'CS301' },
            { id: 'crs-low', classId: 'cls-1', name: 'Operating Systems', code: 'CS302' }
        ],
        joinRequests: [
            { studentId: 'stu-1', classId: 'cls-1', status: 'approved' }
        ],
        attendance: [
            // crs-high: 10 sessions, 9 present, 1 absent => 90%
            ...Array.from({ length: 9 }).map((_, i) => ({
                courseId: 'crs-high',
                records: { 'stu-1': 'present' }
            })),
            { courseId: 'crs-high', records: { 'stu-1': 'absent' } },

            // crs-low: 10 sessions, 6 present, 4 absent => 60% (< 75%)
            ...Array.from({ length: 6 }).map((_, i) => ({
                courseId: 'crs-low',
                records: { 'stu-1': 'present' }
            })),
            ...Array.from({ length: 4 }).map((_, i) => ({
                courseId: 'crs-low',
                records: { 'stu-1': 'absent' }
            }))
        ],
        tasks: []
    };

    const context = buildCampusAiContext({
        user: studentUser,
        locationPath: '/dashboard',
        dataContext
    });

    assert.ok(context.includes('Data Structures (CS301): 90%'), 'High course should compute 90%');
    assert.ok(context.includes('[GOOD STANDING]'), 'High course should have good standing');
    assert.ok(context.includes('Operating Systems (CS302): 60%'), 'Low course should compute 60%');
    assert.ok(context.includes('ATTENDANCE BELOW 75% VTU CRITERIA'), 'Low course must flag VTU <75% warning');
});

test('3. Privacy & Role Isolation: Never leaks other students data to the caller', () => {
    const studentUser = { id: 'stu-alice', name: 'Alice', role: 'student', usn: '1KS21CS010' };

    const dataContext = {
        classes: [{ id: 'cls-1', name: 'CSE A' }],
        courses: [{ id: 'crs-1', classId: 'cls-1', name: 'Machine Learning', code: 'CS501' }],
        joinRequests: [
            { studentId: 'stu-alice', classId: 'cls-1', status: 'approved' },
            { studentId: 'stu-bob-private', classId: 'cls-1', status: 'approved' }
        ],
        attendance: [
            { courseId: 'crs-1', records: { 'stu-alice': 'present', 'stu-bob-private': 'absent' } }
        ],
        tasks: [
            { studentId: 'stu-alice', title: 'Alices Assignment', status: 'Pending' },
            { studentId: 'stu-bob-private', title: 'Secret Bob Assignment', status: 'Pending' }
        ]
    };

    const context = buildCampusAiContext({
        user: studentUser,
        locationPath: '/dashboard',
        dataContext
    });

    assert.ok(!context.includes('stu-bob-private'), 'Must never leak other student ID');
    assert.ok(!context.includes('Secret Bob Assignment'), 'Must never leak other student private assignments');
});

test('4. Faculty Role Context: Summarizes assigned classes and grading responsibilities', () => {
    const teacherUser = {
        id: 'faculty-99',
        name: 'Prof. Ramesh Rao',
        role: 'teacher',
        departmentId: 'CSE'
    };

    const dataContext = {
        classes: [
            { id: 'cls-t1', teacherId: 'faculty-99', name: '6th Sem CSE A', section: 'A' },
            { id: 'cls-other', teacherId: 'other-teacher', name: '4th Sem ECE B', section: 'B' }
        ],
        courses: [
            { id: 'crs-t1', classId: 'cls-t1', teacherId: 'faculty-99', name: 'Cloud Computing' }
        ],
        joinRequests: [
            { classId: 'cls-t1', studentId: 's1', status: 'approved' },
            { classId: 'cls-t1', studentId: 's2', status: 'approved' },
            { classId: 'cls-other', studentId: 's3', status: 'approved' }
        ],
        assessments: [
            { courseId: 'crs-t1', title: 'CIE Test 1', maxMarks: 50 }
        ]
    };

    const context = buildCampusAiContext({
        user: teacherUser,
        locationPath: '/classes',
        dataContext
    });

    assert.ok(context.includes('Prof. Ramesh Rao'), 'Should include faculty name');
    assert.ok(context.includes('6th Sem CSE A'), 'Should include teachers assigned class');
    assert.ok(!context.includes('4th Sem ECE B'), 'Must NOT include other faculty class');
    assert.ok(context.includes('2 enrolled students'), 'Should compute total students in faculty class');
    assert.ok(context.includes('CIE Test 1'), 'Should list pending CIE assessments');
});

test('5. HOD Role Context: Provides department-level governance overview', () => {
    const hodUser = {
        id: 'hod-1',
        name: 'Dr. Manjunath T.K.',
        role: 'hod',
        departmentId: 'CSE'
    };

    const dataContext = {
        classes: [
            { id: 'c1', departmentId: 'CSE', name: 'CSE 6th Sem' },
            { id: 'c2', departmentId: 'CSE', name: 'CSE 4th Sem' }
        ],
        courses: [
            { id: 'cr1', name: 'Algo' },
            { id: 'cr2', name: 'OS' }
        ],
        users: [
            { id: 'u1', role: 'teacher', name: 'Faculty 1', departmentId: 'CSE' },
            { id: 'u2', role: 'teacher', name: 'Faculty 2', departmentId: 'CSE' }
        ]
    };

    const context = buildCampusAiContext({
        user: hodUser,
        locationPath: '/dashboard',
        dataContext
    });

    assert.ok(context.includes('HEAD OF DEPARTMENT (HOD)'), 'Should identify HOD role');
    assert.ok(context.includes('Dr. Manjunath T.K.'), 'Should include HOD name');
    assert.ok(context.includes('2 professors / lecturers'), 'Should count department faculty');
    assert.ok(context.includes('Total Active Class Sections: 2'), 'Should count active class sections');
});

test('6. Missing Data Fallback: Handles undefined or empty parameters gracefully', () => {
    assert.doesNotThrow(() => {
        const fallback = buildCampusAiContext({
            user: null,
            locationPath: undefined,
            dataContext: undefined
        });
        assert.ok(fallback.includes('NEXUS CAMPUS INTELLIGENCE CONTEXT'), 'Should return safe default context');
    });
});

test('7. Contextual Suggestions: Dynamically adapts to active route and role', () => {
    const busSuggestions = getContextualSuggestions({ role: 'student', locationPath: '/bus-tracking' });
    assert.ok(busSuggestions.some(s => s.includes('KSIT-KSSEM shuttle')), 'Bus page must have shuttle query');

    const librarySuggestions = getContextualSuggestions({ role: 'student', locationPath: '/digital-library' });
    assert.ok(librarySuggestions.some(s => s.includes('library operating hours')), 'Library page must have library query');

    const printSuggestions = getContextualSuggestions({ role: 'student', locationPath: '/print-hub' });
    assert.ok(printSuggestions.some(s => s.includes('rates for B&W')), 'Print hub must have rates query');

    const complaintSuggestions = getContextualSuggestions({ role: 'student', locationPath: '/complaints' });
    assert.ok(complaintSuggestions.some(s => s.includes('categories of complaints')), 'Complaints must have category query');

    const teacherSuggestions = getContextualSuggestions({ role: 'teacher', locationPath: '/dashboard' });
    assert.ok(teacherSuggestions.some(s => s.includes('assigned classes')), 'Teacher must have class summary query');

    const hodSuggestions = getContextualSuggestions({ role: 'hod', locationPath: '/dashboard' });
    assert.ok(hodSuggestions.some(s => s.toLowerCase().includes('faculty')), 'HOD must have faculty summary query');
});
