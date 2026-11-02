import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Mail,
    Copy,
    Check,
    Users,
    Shield,
    BookOpen,
    CalendarCheck,
    Award,
    Search,
    Sparkles,
    UploadCloud,
    Compass,
    Library,
    Send,
    LifeBuoy,
    ClipboardList,
    BarChart3,
    GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function HelpPage() {
    const { user, getDomainUser } = useAuth();
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('all');

    const SUPPORT_EMAIL = 'recharladeleep@gmail.com';

    // Determine the active role for the current portal
    const eduhubUser = (getDomainUser && getDomainUser('eduhub')) || user;
    const rawRole = (eduhubUser?.role || user?.role || 'student').toLowerCase();

    const isHod = rawRole === ROLES.HOD || rawRole === 'hod';
    const isStaff = rawRole === ROLES.TEACHER || rawRole === ROLES.STAFF || rawRole === 'teacher' || rawRole === 'staff';
    const isAdmin = rawRole === ROLES.ADMIN || rawRole === 'admin';
    const isStudent = !isHod && !isStaff && !isAdmin;

    // Portal role: 'student' | 'teacher' | 'hod' | 'admin'
    const portalRole = isHod ? 'hod' : (isStaff ? 'teacher' : (isStudent ? 'student' : 'admin'));

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(SUPPORT_EMAIL);
        setCopied(true);
        toast.success('Email copied to clipboard: ' + SUPPORT_EMAIL);
        setTimeout(() => setCopied(false), 2500);
    };

    // ── ALL GUIDES DATA (ROLE SPECIFIC) ──
    const allGuides = [
        // ── STUDENT PORTAL GUIDES ──
        {
            id: 'student-join-class',
            role: 'student',
            topic: 'classes',
            category: 'Class Enrollment',
            title: 'How to Join a Class & Access Course Materials',
            icon: BookOpen,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
            steps: [
                'Log in as a Student and go to your **Dashboard**.',
                'Click on the **Join Class** tab in the dashboard.',
                'Browse available classes in your department or use the search bar to find your course or faculty.',
                'Click **Join Class**; your request will be submitted to the course teacher.',
                'Once the teacher approves your request, the class will automatically appear in **My Classes**, unlocking all study materials, announcements, and assignments.'
            ]
        },
        {
            id: 'student-resources',
            role: 'student',
            topic: 'resources',
            category: 'Study Resources',
            title: 'How to Download & View Course Study Resources',
            icon: UploadCloud,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
            steps: [
                'Go to **Dashboard > My Classes** and click on your enrolled class.',
                'Select any subject or course inside the class.',
                'Under the **Resources** section, view all files uploaded by your teacher (PDFs, PPTs, Word documents, and Google Drive links).',
                'Click the **Download** or **Open Link** button next to any resource to view or save it directly to your device.'
            ]
        },
        {
            id: 'student-grades',
            role: 'student',
            topic: 'grades',
            category: 'Grades & Scores',
            title: 'How to Check Your Test Scores & Performance Trends',
            icon: Award,
            color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40',
            steps: [
                'Navigate to the **Grades** tab on your Student Dashboard.',
                'Select your subject/course from the **Select Course** dropdown.',
                'Your selection is automatically remembered, so switching tabs will never reset your course.',
                'View your **Overall Grade & Average Percentage**, performance trend graphs, and itemized marks for each Internal or External assessment.'
            ]
        },
        {
            id: 'student-attendance',
            role: 'student',
            topic: 'attendance',
            category: 'Attendance Tracking',
            title: 'How to Track Live Attendance by Subject (VTU Criteria)',
            icon: CalendarCheck,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
            steps: [
                'Click on the **Attendance** tab on your Student Dashboard.',
                'Review your **Overall Attendance Percentage** and VTU eligibility badge (≥75% required).',
                'Inspect the **Subject Breakdown Cards** to see attended vs. missed classes for each subject.',
                'Click any subject card or use the subject dropdown to filter the **Detailed History Log** showing dates and Present/Absent/Late status recorded by your faculty in real time.'
            ]
        },
        {
            id: 'student-tasks',
            role: 'student',
            topic: 'tasks',
            category: 'Tasks & Deadlines',
            title: 'How to View Tasks, Assignments & Track Deadlines',
            icon: ClipboardList,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
            steps: [
                'Navigate to **Tasks** from the sidebar navigation menu.',
                'View all pending assignments, lab submissions, and study reminders categorized by priority.',
                'Check off completed tasks to monitor your daily academic preparation.',
                'Stay updated with toast alerts whenever your faculty assigns new homework or tests.'
            ]
        },

        // ── STAFF / TEACHER PORTAL GUIDES ──
        {
            id: 'teacher-approval',
            role: 'teacher',
            topic: 'approval',
            category: 'HOD Verification',
            title: 'New Staff Registration & HOD Approval Requirement',
            icon: Shield,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
            steps: [
                'When you sign up as **Staff / Faculty**, your profile is placed in a **Pending** status by default.',
                'A real-time notification is automatically sent to your Head of Department (HOD) for verification.',
                'While pending, an alert banner will notify you that class creation is locked until approved.',
                'Once your HOD approves your profile from the Faculty Approval Queue, your account becomes active immediately, enabling all teaching tools.'
            ]
        },
        {
            id: 'teacher-create-class',
            role: 'teacher',
            topic: 'classes',
            category: 'Classes & Courses',
            title: 'How to Create Classes, Courses, and Approve Students',
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
            steps: [
                'Navigate to **Classes** from your sidebar navigation.',
                'Click **+ Create Class**, enter the class name (e.g. "Data Structures") and section (e.g. "A"). Your department is automatically tagged.',
                'Click into your class to add courses/subjects and assign faculty in-charge.',
                'Under the **Students / Join Requests** tab, review incoming join requests and click **Approve** to enroll students.',
                'HOD is automatically notified whenever you create a class!'
            ]
        },
        {
            id: 'teacher-upload-resources',
            role: 'teacher',
            topic: 'resources',
            category: 'Resource Uploads',
            title: 'How to Upload Course Resources & Post Announcements',
            icon: UploadCloud,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
            steps: [
                'Go to **Dashboard > Course Content** and select your course.',
                'Under Resources, choose between **Upload File** or **External Link / Drive**.',
                'In **Upload File**, drag and drop your document (PDF, Word, PPT, Excel, Images up to 50MB) or browse your files.',
                'Title is automatically filled from your file name; select the category tag and click **Upload Resource File**.',
                'Use the **Post Announcement** form on the right to broadcast notices to enrolled students.'
            ]
        },
        {
            id: 'teacher-mark-attendance',
            role: 'teacher',
            topic: 'attendance',
            category: 'Daily Attendance',
            title: 'How to Record Daily Attendance for Students',
            icon: CalendarCheck,
            color: 'text-green-600 bg-green-50 dark:bg-green-950/40',
            steps: [
                'Go to **Dashboard > Attendance**.',
                'Select your **Class**, **Course**, and **Date**.',
                'All approved students enrolled in the class are listed with Present, Absent, and Late toggles.',
                'Mark the status for each student and click **Save Attendance**.',
                'Students immediately receive a real-time notification and their attendance overview updates instantly!'
            ]
        },
        {
            id: 'teacher-preferences',
            role: 'teacher',
            topic: 'preferences',
            category: 'Subject Allocation',
            title: 'Submitting Subject Preferences to HOD',
            icon: ClipboardList,
            color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40',
            steps: [
                'When your HOD creates an active preference form, open **Subject Preferences** from your notifications or dashboard.',
                'Review the list of department courses available for the upcoming semester.',
                'Select your 1st, 2nd, and 3rd teaching preferences along with your domain specialization.',
                'Submit before the deadline so your HOD can review and allocate your classes accordingly.'
            ]
        },
        {
            id: 'teacher-analytics',
            role: 'teacher',
            topic: 'classes',
            category: 'Performance Analytics',
            title: 'Viewing Class Performance Analytics & Student Progress',
            icon: BarChart3,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
            steps: [
                'Click on **Analytics** in the sidebar navigation.',
                'Inspect the class-wide grade distributions, exam averages, and attendance trends.',
                'Identify students falling below the 75% VTU attendance threshold for early academic alerts.',
                'Review test statistics to identify topics requiring additional classroom review.'
            ]
        },

        // ── HOD PORTAL GUIDES ──
        {
            id: 'hod-switch-dept',
            role: 'hod',
            topic: 'department',
            category: 'Department Control',
            title: 'Department Switching & Isolated Management',
            icon: Compass,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
            steps: [
                'As an HOD, your dashboard shows faculty, students, classes, and activities strictly isolated to your department.',
                'To inspect another department, use the **Switch Dept** dropdown in your header (CSE, AIDS, ECE, MECH, CIVIL, MBA).',
                'All stats, student rosters, and faculty approval queues immediately update for that department.'
            ]
        },
        {
            id: 'hod-approve-staff',
            role: 'hod',
            topic: 'approval',
            category: 'Faculty Approvals',
            title: 'How to Approve or Reject Pending Staff Registrations',
            icon: Shield,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
            steps: [
                'On the HOD Dashboard, locate the **Pending Approvals** card or the **Teacher Approval Queue**.',
                'You can also click the **Pending Approvals** stat card to go straight to `/teachers?tab=pending`.',
                'Review the staff member\'s name, email, department, and registration timestamp.',
                'Click **Approve** to activate the faculty member, or **Reject** to decline the registration.'
            ]
        },
        {
            id: 'hod-classes-students',
            role: 'hod',
            topic: 'classes',
            category: 'Classes & Rosters',
            title: 'Viewing Department Classes & Enrolled Student Rosters',
            icon: Library,
            color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40',
            steps: [
                'Click the **Classes** tab in the sidebar or click the **Classes** card on the HOD Dashboard.',
                'You can view all classes created by faculty in your department.',
                'Click **View All Students (N)** on any class card to open the interactive student modal listing all enrolled learners, emails, and join dates.',
                'Inspect the **Department Activity Feed** for a live audit log of class creations, student join requests, and faculty approvals.'
            ]
        },
        {
            id: 'hod-create-preference-form',
            role: 'hod',
            topic: 'allocation',
            category: 'Subject Allocation',
            title: 'Creating Faculty Subject Preference Forms',
            icon: ClipboardList,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
            steps: [
                'Navigate to **Subject Allocations** in the sidebar navigation.',
                'Click **Create Preference Form** to launch the setup modal.',
                'Specify the academic semester, deadline date, and eligible subjects for your department.',
                'Publish the form to automatically notify all department faculty members to submit their teaching preferences.'
            ]
        },
        {
            id: 'hod-subject-allocations',
            role: 'hod',
            topic: 'allocation',
            category: 'Subject Allocation',
            title: 'Reviewing Faculty Preferences & Finalizing Allocations',
            icon: Users,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
            steps: [
                'Go to **Subject Allocations** from the HOD menu.',
                'View the consolidated matrix of submitted faculty preferences, priority choices, and domain specializations.',
                'Assign primary and secondary faculty to each department course.',
                'Finalize allocations to assign classes and notify teachers of their approved teaching schedules.'
            ]
        },
        {
            id: 'hod-activity-analytics',
            role: 'hod',
            topic: 'analytics',
            category: 'Audit & Analytics',
            title: 'Department Real-Time Activity Feed & Academic Analytics',
            icon: BarChart3,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
            steps: [
                'On your HOD Dashboard, monitor the **Live Activity Feed** streaming department events.',
                'Track when faculty create classes, upload resources, or mark attendance in real time.',
                'Monitor student enrollment approvals across all department sections.',
                'Click **Analytics** in the sidebar for consolidated department attendance averages and performance insights.'
            ]
        }
    ];

    // Filter guides strictly by portal role (unless admin, who can inspect any)
    const portalGuides = allGuides.filter(guide => {
        if (isAdmin) return true;
        if (portalRole === 'hod') return guide.role === 'hod';
        if (portalRole === 'teacher') return guide.role === 'teacher';
        return guide.role === 'student';
    });

    // Topic configurations per portal role
    const studentTopics = [
        { id: 'all', label: 'All Student Guides' },
        { id: 'classes', label: '📖 Join Classes' },
        { id: 'resources', label: '☁️ Resources' },
        { id: 'grades', label: '🏆 Grades & Scores' },
        { id: 'attendance', label: '📅 Live Attendance' },
        { id: 'tasks', label: '📝 Tasks & Assignments' },
    ];

    const staffTopics = [
        { id: 'all', label: 'All Staff Guides' },
        { id: 'approval', label: '🛡️ HOD Approval' },
        { id: 'classes', label: '👥 Classes & Students' },
        { id: 'resources', label: '☁️ Upload Files' },
        { id: 'attendance', label: '📅 Mark Attendance' },
        { id: 'preferences', label: '📋 Subject Preferences' },
    ];

    const hodTopics = [
        { id: 'all', label: 'All HOD Guides' },
        { id: 'department', label: '🏛️ Department Control' },
        { id: 'approval', label: '🛡️ Staff Approvals' },
        { id: 'classes', label: '📚 Classes & Rosters' },
        { id: 'allocation', label: '📋 Subject Allocations' },
        { id: 'analytics', label: '📊 Analytics & Logs' },
    ];

    const adminTopics = [
        { id: 'all', label: 'All Guides' },
        { id: 'student', label: '🎓 Students' },
        { id: 'teacher', label: '👨‍🏫 Teachers & Staff' },
        { id: 'hod', label: '🏛️ HOD Portal' },
    ];

    const currentTopics = portalRole === 'hod'
        ? hodTopics
        : (portalRole === 'teacher' ? staffTopics : (isAdmin ? adminTopics : studentTopics));

    // Portal header titles
    const portalHeaders = {
        student: {
            badge: '🎓 Student Portal Manual',
            title: 'How to Access Everything in Student Portal',
            subtitle: 'Complete guide for enrolling in classes, accessing study materials, tracking grades, and monitoring attendance.'
        },
        teacher: {
            badge: '👨‍🏫 Faculty & Staff Manual',
            title: 'How to Access Everything in Staff Portal',
            subtitle: 'Complete guide for class creation, student approvals, resource uploads, attendance recording, and subject preferences.'
        },
        hod: {
            badge: '🏛️ HOD Management Manual',
            title: 'How to Access Everything in HOD Portal',
            subtitle: 'Complete guide for department oversight, approving faculty registrations, class roster monitoring, and subject allocations.'
        },
        admin: {
            badge: '🌐 Master Campus Guide',
            title: 'How to Access Everything in EduHub',
            subtitle: 'Complete administrative manual across all academic roles and management workflows.'
        }
    };

    const currentHeader = portalHeaders[portalRole] || portalHeaders.student;

    // Filter by topic and search query
    const filteredGuides = portalGuides.filter(guide => {
        if (isAdmin) {
            if (selectedTopic !== 'all' && guide.role !== selectedTopic) return false;
        } else {
            if (selectedTopic !== 'all' && guide.topic !== selectedTopic) return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = guide.title.toLowerCase().includes(q);
            const matchCategory = guide.category.toLowerCase().includes(q);
            const matchSteps = guide.steps.some(step => step.toLowerCase().includes(q));
            return matchTitle || matchCategory || matchSteps;
        }
        return true;
    });

    return (
        <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
            {/* Top Support Banner & Contact Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-7 sm:p-9 rounded-3xl shadow-xl border border-indigo-700/50">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-200 border border-white/20 flex items-center gap-1.5">
                                <LifeBuoy className="w-3.5 h-3.5 text-indigo-300" />
                                24/7 EduHub Support Center
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                            Need Help or Facing Issues?
                        </h1>
                        <p className="text-indigo-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                            If any issues contact <span className="font-bold underline text-white">{SUPPORT_EMAIL}</span> for immediate assistance in EduHub:
                        </p>

                        {/* Contact Pill with Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-mono text-xs sm:text-sm shadow-inner">
                                <Mail className="w-4 h-4 text-indigo-300 flex-shrink-0" />
                                <span className="font-bold select-all">{SUPPORT_EMAIL}</span>
                            </div>

                            <button
                                onClick={handleCopyEmail}
                                className="px-4 py-2.5 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
                                {copied ? 'Email Copied!' : 'Copy Email'}
                            </button>

                            <a
                                href={`mailto:${SUPPORT_EMAIL}?subject=EduHub%20Support%20Request%20-%20${encodeURIComponent(user?.name || 'User')}`}
                                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 border border-indigo-400/40"
                            >
                                <Send className="w-4 h-4" />
                                Email Directly
                            </a>
                        </div>
                    </div>

                    {/* Quick Indicator */}
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-left lg:w-72 flex-shrink-0">
                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-200">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            {currentHeader.badge}
                        </div>
                        <p className="text-xs text-indigo-100/80 leading-relaxed">
                            Tailored step-by-step guides for your active role: <strong className="text-white capitalize">{user?.role || portalRole}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Portal Guide Header & Filter Tabs */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {portalRole.toUpperCase()} PORTAL
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mt-1">
                            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            {currentHeader.title}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {currentHeader.subtitle}
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search your portal guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>
                </div>

                {/* Topic Filter Tabs (strictly role-specific) */}
                <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
                    {currentTopics.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTopic(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                selectedTopic === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Guides Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredGuides.map(guide => (
                    <Card
                        key={guide.id}
                        className="rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                    >
                        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-2xl flex-shrink-0 ${guide.color}`}>
                                    <guide.icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                        {guide.category}
                                    </span>
                                    <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                        {guide.title}
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            <ol className="space-y-2.5">
                                {guide.steps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center mt-0.5">
                                            {idx + 1}
                                        </span>
                                        <div dangerouslySetInnerHTML={{
                                            __html: step.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-gray-100 font-bold">$1</strong>')
                                        }} />
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                ))}

                {filteredGuides.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">No matching guides found</p>
                        <p className="text-xs text-gray-400 mt-1">Try another search keyword or select "All Guides".</p>
                    </div>
                )}
            </div>
        </div>
    );
}
