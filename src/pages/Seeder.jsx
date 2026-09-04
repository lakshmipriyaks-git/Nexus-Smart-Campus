import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    getDocs,
    query,
    where,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ROLES } from '../utils/constants';

const Seeder = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const TEACHER_EMAIL = 'pasha.g@school.com';
    const PASSWORD = 'password123';
    const CLASS_NAME = 'Pasha G Class';
    const COURSES = ['Mathematics', 'Science', 'History', 'English', 'Art'];
    const STUDENT_COUNT = 20;

    const seedData = async () => {
        setLoading(true);
        setLogs([]);
        addLog('Starting seeding process...');

        try {
            // 1. Create/Login Teacher
            let teacherUser;
            try {
                addLog(`Attempting to create teacher: ${TEACHER_EMAIL}`);
                const userCredential = await createUserWithEmailAndPassword(auth, TEACHER_EMAIL, PASSWORD);
                teacherUser = userCredential.user;
                await updateProfile(teacherUser, { displayName: 'Pasha G' });
                await setDoc(doc(db, 'users', teacherUser.uid), {
                    name: 'Pasha G',
                    email: TEACHER_EMAIL,
                    role: ROLES.TEACHER,
                    createdAt: new Date().toISOString()
                });
                addLog('Teacher account created.');
            } catch (error) {
                if (error.code === 'auth/email-already-in-use') {
                    addLog('Teacher email exists. Logging in...');
                    const userCredential = await signInWithEmailAndPassword(auth, TEACHER_EMAIL, PASSWORD);
                    teacherUser = userCredential.user;
                } else {
                    throw error;
                }
            }

            // 2. Create Class
            addLog('Checking for existing Class...');
            const classQuery = query(collection(db, 'classes'), where('name', '==', CLASS_NAME));
            const classSnapshot = await getDocs(classQuery);

            let classId;
            if (!classSnapshot.empty) {
                classId = classSnapshot.docs[0].id;
                addLog(`Found existing class: ${classId}`);
            } else {
                addLog('Creating Class...');
                const classRef = await addDoc(collection(db, 'classes'), {
                    name: CLASS_NAME,
                    section: 'A',
                    subject: 'General',
                    teacherId: teacherUser.uid,
                    teacherName: 'Pasha G',
                    createdAt: serverTimestamp()
                });
                classId = classRef.id;
                addLog(`Class created with ID: ${classId}`);
            }

            // 3. Create Courses
            addLog('Creating/Checking Courses...');
            const courseIds = [];
            for (const courseName of COURSES) {
                const courseQuery = query(
                    collection(db, 'courses'),
                    where('classId', '==', classId),
                    where('name', '==', courseName)
                );
                const courseSnapshot = await getDocs(courseQuery);

                if (!courseSnapshot.empty) {
                    courseIds.push({ id: courseSnapshot.docs[0].id, name: courseName });
                } else {
                    const courseRef = await addDoc(collection(db, 'courses'), {
                        name: courseName,
                        code: courseName.substring(0, 3).toUpperCase() + '101',
                        classId: classId,
                        className: CLASS_NAME,
                        teacherId: teacherUser.uid,
                        teacherName: 'Pasha G',
                        createdAt: serverTimestamp()
                    });
                    courseIds.push({ id: courseRef.id, name: courseName });
                }
            }
            addLog(`Processed ${courseIds.length} courses.`);

            // 4. Create Assessments (for grades)
            addLog('Creating/Checking Assessments...');
            const assessmentIds = [];
            for (const course of courseIds) {
                const assessmentQuery = query(
                    collection(db, 'assessments'),
                    where('courseId', '==', course.id),
                    where('title', '==', `${course.name} Midterm`)
                );
                const assessmentSnapshot = await getDocs(assessmentQuery);

                if (!assessmentSnapshot.empty) {
                    assessmentIds.push({ id: assessmentSnapshot.docs[0].id, courseId: course.id });
                } else {
                    const assessmentRef = await addDoc(collection(db, 'assessments'), {
                        title: `${course.name} Midterm`,
                        courseId: course.id,
                        courseName: course.name,
                        classId: classId,
                        totalMarks: 100,
                        date: new Date().toISOString().split('T')[0],
                        createdAt: serverTimestamp()
                    });
                    assessmentIds.push({ id: assessmentRef.id, courseId: course.id });
                }
            }

            // 5. Create Students and Join Requests
            const studentIds = [];

            // We need to sign out teacher to create students
            await signOut(auth);

            for (let i = 1; i <= STUDENT_COUNT; i++) {
                const studentEmail = `student${i}@school.com`;
                const studentName = `Student ${i}`;

                addLog(`Processing ${studentName} (${studentEmail})...`);

                let studentUid;
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, PASSWORD);
                    studentUid = userCredential.user.uid;
                    await updateProfile(userCredential.user, { displayName: studentName });
                    await setDoc(doc(db, 'users', studentUid), {
                        name: studentName,
                        email: studentEmail,
                        role: ROLES.STUDENT,
                        createdAt: new Date().toISOString()
                    });
                } catch (error) {
                    if (error.code === 'auth/email-already-in-use') {
                        const userCredential = await signInWithEmailAndPassword(auth, studentEmail, PASSWORD);
                        studentUid = userCredential.user.uid;
                    } else {
                        console.error(error);
                        continue;
                    }
                }

                // Create Join Request
                await addDoc(collection(db, 'joinRequests'), {
                    classId: classId,
                    studentId: studentUid,
                    studentName: studentName,
                    status: 'pending',
                    date: new Date().toISOString().split('T')[0],
                    createdAt: serverTimestamp()
                });

                studentIds.push({ uid: studentUid, name: studentName });
                await signOut(auth); // Sign out to prepare for next or teacher login
            }

            // 6. Teacher Accepts Requests and Adds Data
            addLog('Logging back in as Teacher to process requests and data...');
            await signInWithEmailAndPassword(auth, TEACHER_EMAIL, PASSWORD);

            // Accept all requests
            const requestsQuery = query(collection(db, 'joinRequests'), where('classId', '==', classId));
            const requestsSnapshot = await getDocs(requestsQuery);
            const batch = writeBatch(db);

            requestsSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { status: 'approved', updatedAt: serverTimestamp() });
            });
            await batch.commit();
            addLog('All join requests approved.');

            // 7. Add Grades and Attendance
            addLog('Generating Grades and Attendance...');

            for (const student of studentIds) {
                // Grades
                for (const assessment of assessmentIds) {
                    const marks = Math.floor(Math.random() * (100 - 60 + 1)) + 60; // Random 60-100
                    const percentage = marks;
                    let grade = 'F';
                    if (percentage >= 90) grade = 'A+';
                    else if (percentage >= 80) grade = 'A';
                    else if (percentage >= 70) grade = 'B+';
                    else if (percentage >= 60) grade = 'B';
                    else if (percentage >= 50) grade = 'C';

                    await addDoc(collection(db, 'grades'), {
                        assessmentId: assessment.id,
                        courseId: assessment.courseId,
                        studentId: student.uid,
                        studentName: student.name,
                        marksScored: marks,
                        maxMarks: 100,
                        percentage: percentage,
                        grade: grade,
                        createdAt: serverTimestamp()
                    });
                }

                // Attendance (Last 5 days)
                for (const course of courseIds) {
                    const today = new Date();
                    for (let d = 0; d < 5; d++) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - d);
                        const dateStr = date.toISOString().split('T')[0];

                        // We need to check if an attendance record exists for this class/course/date
                        // Since this is a seeder, we might create duplicate docs if we run multiple times,
                        // but for a fresh run it's fine. To be safe, we'll just add a new doc for simplicity
                        // or try to find one. 
                        // Actually, the DataContext structure implies one doc per class/course/date with a map of students.
                        // Let's do it properly: fetch or create the doc.

                        // Optimization: Just create one doc per day per course and update it.
                        // But since we are looping student by student, it's inefficient.
                        // Better: Loop by Course -> Day -> Student.
                    }
                }
            }

            // Optimized Attendance Generation
            for (const course of courseIds) {
                const today = new Date();
                for (let d = 0; d < 5; d++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - d);
                    const dateStr = date.toISOString().split('T')[0];

                    const records = {};
                    studentIds.forEach(s => {
                        records[s.uid] = Math.random() > 0.1 ? 'present' : 'absent'; // 90% attendance
                    });

                    await addDoc(collection(db, 'attendance'), {
                        classId: classId,
                        courseId: course.id,
                        date: dateStr,
                        records: records,
                        createdAt: serverTimestamp()
                    });
                }
            }

            addLog('Seeding Complete! You can now log in as pasha.g@school.com (password123)');

        } catch (error) {
            console.error(error);
            addLog(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Database Seeder</h1>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-yellow-700">
                    Warning: This will create 21 user accounts and populate the database with test data.
                    Ensure you are not overwriting critical production data.
                </p>
            </div>

            <button
                onClick={seedData}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg text-white font-semibold ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
            >
                {loading ? 'Seeding...' : 'Start Seeding'}
            </button>

            <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                    <p className="text-gray-500">Logs will appear here...</p>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>
        </div>
    );
};

export default Seeder;
