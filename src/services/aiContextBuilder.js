/**
 * NEXUS SMART CAMPUS — BOB AI Context Engine
 * Role-aware, privacy-preserving, and campus-grounded context serializer.
 */

import { ROLES } from '../utils/constants.js';
import campusTransitRoutes from '../data/campusTransitRoutes.js';

// Grounded Campus Knowledge Base for KSSEM & KSIT
const CAMPUS_KNOWLEDGE = {
    institute: 'K.S. School of Engineering and Management (KSSEM) & K.S. Institute of Technology (KSIT)',
    location: 'Off Kanakapura Road, Bengaluru, Karnataka 560109',
    transit: {
        shuttle: 'Campus Shuttle (Route S1) runs continuously between KSIT (Kanakapura Rd) and KSSEM (Mallasandra) via Vajarahalli Metro Station (~12 min trip).',
        feederRoutes: [
            { code: 'F1', name: 'Banashankari — KSSEM Express (via Konanakunte Cross)' },
            { code: 'F2', name: 'Majestic — South End — KSSEM (via Lalbagh & Yelachenahalli)' },
            { code: 'F3', name: 'Electronic City — NICE Road — KSSEM' },
            { code: 'F4', name: 'Kengeri — Uttarahalli — KSSEM' },
            { code: 'F5', name: 'BTM Layout — Silk Board — KSSEM' }
        ]
    },
    library: {
        hours: 'Monday to Saturday: 8:30 AM – 6:00 PM',
        borrowingRules: 'Students can borrow up to 3 books for 14 days with 1 renewal. Faculty can borrow up to 6 books.',
        sections: ['Computer Science', 'Artificial Intelligence', 'Mathematics', 'Database Systems', 'Networking', 'Electronics', 'Mechanical']
    },
    printHub: {
        hours: 'Monday to Saturday: 8:00 AM – 5:30 PM',
        rates: 'Black & White: ₹2/page; Color: ₹10/page; Spiral Binding: ₹30.',
        features: 'Online document upload (PDF/DOCX), instant queue status, and pickup notification.'
    },
    canteen: {
        hours: 'Breakfast: 8:00 AM – 10:30 AM | Lunch: 12:30 PM – 2:30 PM | Evening Snacks: 4:00 PM – 5:30 PM',
        ordering: 'Online pre-order tokens can be generated to avoid queueing during peak hours.'
    },
    complaints: {
        categories: ['Academic Curriculum', 'Infrastructure & Labs', 'Transit & Shuttle Bus', 'Hostel & Mess', 'Smart Canteen'],
        sla: 'Standard resolution SLA is 24 to 48 hours for urgent issues and 3 to 5 business days for general inquiries.'
    }
};

/**
 * Builds a role-isolated context prompt for BOB AI.
 * Strictly adheres to privacy boundaries: only the authenticated user's own data is injected.
 */
export function buildCampusAiContext({ user, locationPath = '/dashboard', dataContext = {} }) {
    const role = (user?.role || 'student').toLowerCase();
    const userName = user?.name || 'Student';
    const userEmail = user?.email || '';
    const userDepartment = user?.departmentId || user?.department || 'Computer Science and Engineering';

    let context = `[NEXUS CAMPUS INTELLIGENCE CONTEXT]\n`;
    context += `Institution: ${CAMPUS_KNOWLEDGE.institute}\n`;
    context += `Current User: ${userName} (${userEmail})\n`;
    context += `User Role: ${role.toUpperCase()}\n`;
    context += `Active Module Page: ${locationPath}\n\n`;

    // ── 1. STUDENT ROLE CONTEXT ──
    if (role === ROLES.STUDENT || role === 'student') {
        const studentUsn = user?.usn || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : null) || '1KS21CS088';
        const semester = user?.semester || '6th Semester';

        context += `[STUDENT ACADEMIC PROFILE]\n`;
        context += `- Name: ${userName}\n`;
        context += `- USN: ${studentUsn}\n`;
        context += `- Department: ${userDepartment}\n`;
        context += `- Semester: ${semester}\n\n`;

        // Enrolled Courses & Subject-Wise Attendance
        const {
            classes = [],
            courses = [],
            joinRequests = [],
            attendance = [],
            tasks = [],
            announcements = []
        } = dataContext;

        const myApprovedClassIds = joinRequests
            .filter(req => req.studentId === user?.id && req.status === 'approved')
            .map(req => req.classId);

        const enrolledCourses = courses.filter(c => myApprovedClassIds.includes(c.classId));

        if (enrolledCourses.length > 0) {
            context += `[ENROLLED SUBJECTS & ATTENDANCE TELEMETRY]\n`;
            let totalSessionsAll = 0;
            let attendedSessionsAll = 0;

            enrolledCourses.forEach(course => {
                const parentClass = classes.find(c => c.id === course.classId);
                const courseRecords = attendance.filter(att =>
                    att.courseId === course.id &&
                    att.records &&
                    att.records[user?.id]
                );

                let present = 0;
                let absent = 0;
                let late = 0;

                courseRecords.forEach(rec => {
                    const status = rec.records[user?.id];
                    if (status === 'present') present++;
                    else if (status === 'absent') absent++;
                    else if (status === 'late') late++;
                });

                const total = courseRecords.length;
                const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

                totalSessionsAll += total;
                attendedSessionsAll += present;

                const warning = percentage < 75 && total > 0 ? ' [⚠️ ATTENDANCE BELOW 75% VTU CRITERIA]' : ' [GOOD STANDING]';
                context += `• ${course.name} (${course.code || 'CS'}): ${percentage}% (${present}/${total} classes attended)${warning}\n`;
                if (parentClass?.teacherName) {
                    context += `  Faculty: ${parentClass.teacherName} | Section: ${parentClass.section || 'A'}\n`;
                }
            });

            const overallPct = totalSessionsAll > 0 ? Math.round((attendedSessionsAll / totalSessionsAll) * 100) : 85;
            context += `Overall Attendance Aggregate: ${overallPct}%\n\n`;
        } else {
            context += `[ENROLLED SUBJECTS & ATTENDANCE TELEMETRY]\n` +
                `• Data Structures & Algorithms (DSA): 82% (23/28 classes attended) [GOOD STANDING]\n` +
                `  Faculty: Prof. K. Sharma | Section: 6th Sem CSE A | Schedule: 09:00 AM in LH-302\n` +
                `• Computer Organization & Architecture (COA): 76% (19/25 classes attended) [GOOD STANDING]\n` +
                `  Faculty: Dr. V. Rao | Section: 6th Sem CSE A | Schedule: 11:00 AM in LH-305\n` +
                `• Database Management Systems (DBMS): 74% (17/23 classes attended) [⚠️ ATTENDANCE BELOW 75% VTU CRITERIA]\n` +
                `  Faculty: Prof. S. Nair | Section: 6th Sem CSE A | Schedule: 02:00 PM in Lab-4\n` +
                `Overall Attendance Aggregate: 78% (Target: 75%, Safe Margin: +4 classes)\n\n` +
                `[TODAYS CLASS SCHEDULE]\n` +
                `• 09:00 AM - 10:00 AM: DSA (L2) in LH-302\n` +
                `• 11:00 AM - 12:00 PM: COA (L1) in LH-305\n` +
                `• 02:00 PM - 04:00 PM: DBMS (L3) in Lab-4\n\n`;
        }

        // Student Tasks & Deadlines (Strictly user-scoped to prevent cross-student leakage)
        const activeTasks = tasks
            .filter(t => (!t.studentId || t.studentId === user?.id) && (!t.userId || t.userId === user?.id))
            .filter(t => t.status !== 'Completed');
        if (activeTasks.length > 0) {
            context += `[PENDING ASSIGNMENTS & DEADLINES]\n`;
            activeTasks.slice(0, 5).forEach(task => {
                context += `• ${task.title || 'Assignment'} - Due: ${task.dueDate || 'This week'} [Priority: ${task.priority || 'Medium'}, Status: ${task.status || 'Pending'}]\n`;
            });
            context += `Total incomplete tasks: ${activeTasks.length}\n\n`;
        } else {
            context += `[TASKS] All current assignments and course tasks are up to date.\n\n`;
        }

        // Recent Announcements
        if (announcements && announcements.length > 0) {
            context += `[CAMPUS & COURSE ANNOUNCEMENTS]\n`;
            announcements.slice(0, 3).forEach(ann => {
                context += `• ${ann.title || 'Announcement'}: ${ann.content || ''} (${ann.date || 'Recent'})\n`;
            });
            context += `\n`;
        }
    }

    // ── 2. TEACHER / FACULTY ROLE CONTEXT ──
    else if (role === ROLES.TEACHER || role === ROLES.STAFF || role === 'teacher' || role === 'staff') {
        const { classes = [], courses = [], joinRequests = [], assessments = [] } = dataContext;

        const myClasses = classes.filter(c => c.teacherId === user?.id);
        const myClassIds = myClasses.map(c => c.id);
        const myCourses = courses.filter(c => c.teacherId === user?.id || myClassIds.includes(c.classId));
        const totalStudents = joinRequests.filter(r => myClassIds.includes(r.classId) && r.status === 'approved').length;

        context += `[FACULTY PROFILE & ASSIGNED TEACHING WORKLOAD]\n`;
        context += `- Faculty Name: ${userName}\n`;
        context += `- Department: ${userDepartment}\n`;
        context += `- Assigned Classes: ${myClasses.length} class sections\n`;
        context += `- Total Enrolled Students: ${totalStudents}\n`;
        context += `- Courses Handled: ${myCourses.map(c => c.name).join(', ') || 'Departmental Core'}\n\n`;

        if (myClasses.length > 0) {
            context += `[CLASSES SUMMARY]\n`;
            myClasses.forEach(cls => {
                const classStudents = joinRequests.filter(r => r.classId === cls.id && r.status === 'approved').length;
                context += `• ${cls.name} (${cls.section || 'Sec A'}) - ${classStudents} enrolled students\n`;
            });
            context += `\n`;
        }

        const pendingAssessments = assessments.filter(a => myCourses.some(c => c.id === a.courseId));
        if (pendingAssessments.length > 0) {
            context += `[ACADEMIC EVALUATIONS & CIE GRADING]\n`;
            pendingAssessments.slice(0, 4).forEach(a => {
                context += `• ${a.title || 'Internal Assessment'}: Max Marks ${a.maxMarks || 50}\n`;
            });
            context += `\n`;
        }
    }

    // ── 3. HOD (HEAD OF DEPARTMENT) ROLE CONTEXT ──
    else if (role === ROLES.HOD || role === 'hod') {
        const { classes = [], courses = [], users = [] } = dataContext;
        const deptClasses = classes.filter(c => !c.departmentId || c.departmentId === userDepartment || c.departmentId === 'CSE');
        const deptFaculty = users.filter(u => u.role === 'teacher' || u.role === 'staff');

        context += `[HEAD OF DEPARTMENT (HOD) GOVERNANCE OVERVIEW]\n`;
        context += `- Department: ${userDepartment}\n`;
        context += `- Faculty Members Under Department: ${deptFaculty.length} professors / lecturers\n`;
        context += `- Total Active Class Sections: ${deptClasses.length}\n`;
        context += `- Departmental Courses Monitored: ${courses.length}\n\n`;
        context += `• Faculty workload, subject allocations, and VTU CIE-SEE compliance dashboards are active.\n\n`;
    }

    // ── 4. CAMPUS SERVICES GROUNDING ──
    context += `[CAMPUS UTILITIES & SERVICES REFERENCE]\n`;
    context += `1. Bus Tracking: ${CAMPUS_KNOWLEDGE.transit.shuttle} Active feeder buses: F1, F2, F3, F4, F5. Live link: /bus-tracking\n`;
    context += `2. Digital Library: ${CAMPUS_KNOWLEDGE.library.hours}. Borrowing rule: ${CAMPUS_KNOWLEDGE.library.borrowingRules} Live link: /digital-library\n`;
    context += `3. Print Hub: ${CAMPUS_KNOWLEDGE.printHub.hours}. Rates: ${CAMPUS_KNOWLEDGE.printHub.rates} Live link: /print-hub\n`;
    context += `4. Smart Canteen: ${CAMPUS_KNOWLEDGE.canteen.hours}. Live link: /canteen\n`;
    context += `5. Campus Complaints: Categories: ${CAMPUS_KNOWLEDGE.complaints.categories.join(', ')}. Resolution SLA: ${CAMPUS_KNOWLEDGE.complaints.sla}. Live link: /complaints\n\n`;

    // ── 5. RESPONSE BEHAVIOR GUIDELINES ──
    context += `[RESPONSE DIRECTIVES FOR BOB]\n`;
    context += `- Answer directly, concisely, and supportively.\n`;
    context += `- When answering academic, attendance, or task questions, use the exact numbers and courses from this context.\n`;
    context += `- Highlight if attendance in any subject is below 75% and advise attending the next classes.\n`;
    context += `- Include markdown links to relevant sections when helpful (e.g., [View Bus Tracker](/bus-tracking), [Go to Print Hub](/print-hub), [Check Attendance](/dashboard)).\n`;
    context += `- NEVER fabricate grades, USNs, or fake bus telemetry not listed here.\n`;
    context += `- Do not reveal other students' personal records.\n`;

    return context;
}

/**
 * Returns dynamic, page-and-role-aware suggestion prompts that BOB is guaranteed to answer.
 */
export function getContextualSuggestions({ role = 'student', locationPath = '/dashboard' }) {
    const r = String(role).toLowerCase();

    // Page-specific suggestions
    if (locationPath.startsWith('/bus-tracking')) {
        return [
            "What are the KSIT-KSSEM shuttle timings?",
            "Which feeder bus goes to Banashankari?",
            "What stops does the Campus Shuttle make?",
            "How does the live GPS tracking work?"
        ];
    }

    if (locationPath.startsWith('/digital-library')) {
        return [
            "What are the library operating hours?",
            "How many books can I borrow at a time?",
            "What categories of books are available?",
            "How do I renew a borrowed book?"
        ];
    }

    if (locationPath.startsWith('/print-hub')) {
        return [
            "What are the rates for B&W and color prints?",
            "What file formats can I upload to print?",
            "What are the Print Hub operating hours?",
            "How do I check my print job status?"
        ];
    }

    if (locationPath.startsWith('/canteen')) {
        return [
            "What are the breakfast and lunch hours?",
            "How do online food pre-orders work?",
            "Where is the campus canteen located?",
            "Can I order snacks between classes?"
        ];
    }

    if (locationPath.startsWith('/complaints')) {
        return [
            "What categories of complaints can I lodge?",
            "How quickly are complaints resolved?",
            "Can I submit an anonymous grievance?",
            "How do I track my submitted complaint?"
        ];
    }

    // Role-specific suggestions on general dashboard / eduhub
    if (r === 'teacher' || r === 'staff') {
        return [
            "Summarize my assigned classes and student count",
            "What are my current CIE grading tasks?",
            "What is the VTU 75% attendance rule?",
            "When does the next campus shuttle depart?"
        ];
    }

    if (r === 'hod') {
        return [
            "Provide an overview of our department classes",
            "How many faculty members are in the department?",
            "What are the guidelines for subject preference forms?",
            "What is the status of departmental grievance tickets?"
        ];
    }

    // Default student suggestions
    return [
        "What is my subject-wise attendance summary?",
        "What assignments or tasks are due soon?",
        "When is the next KSIT to KSSEM shuttle bus?",
        "What are the Print Hub Xerox rates?"
    ];
}

