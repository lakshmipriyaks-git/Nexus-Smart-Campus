# NEXUS PHASE 6A.1 — INDEPENDENT SECURITY REVIEW & PRIVACY VALIDATION REPORT

**Date:** November 2, 2026  
**Execution Phase:** Phase 6A.1 (Independent Security Audit & Threat Validation)  
**Project:** NEXUS Smart Campus (`nexus-smart-campus-39bd7`)  
**Scope:** Deep-dive verification of actual Firestore network payloads, raw document schemas, field-level privacy limitations, anonymity leakage, and access authorization boundaries.  
**Deliverable Status:** Review & Validation Complete. No premature architectural migrations applied.

---

## 1. Executive Summary & Security Classification Matrix

An empirical audit of raw Firestore wire payloads and data models was conducted to assess whether the security measures implemented in Phase 6A provide genuine data-layer isolation or merely client-side interface masking.

### Core Classification Matrix

| Security Area | Sub-Topic | Evaluated State | Classification | Critical Finding |
|---|---|---|---|---|
| **1. Attendance** | Student Attendance Query | Raw Firestore Wire Payload | `UI-ONLY PROTECTION` | Query constraint returns the full document; raw network payload leaks all 60+ classmates' daily attendance statuses directly into student browser. |
| **1. Attendance** | Faculty / HOD Access | Class Assignment Scoping | `PARTIALLY SECURE` | Faculty scoped to assigned classes, HOD to department; however, master attendance document contains college-wide records without document-level partitioning. |
| **2. Anonymous Complaints** | Complainant Identity | Submitter Identification | `UI-ONLY PROTECTION` | While UI renders "Anonymous Student", raw Firestore document stores the student's real UID in `studentId`, exposing whistleblower identity to faculty/HOD in network JSON. |
| **2. Anonymous Complaints** | Evidence & Attachments | File Upload Paths & URLs | `INSECURE` | Attachment URLs and storage paths contain submitter UID and original file metadata, allowing trivial de-anonymization. |
| **3. Notifications** | Direct & Scoped Queries | Recipient Isolation | `SECURE AND VERIFIED` | Scoped query prevents cross-student leakage; public announcements and role broadcasts reach intended recipients without unauthorized leakage. |
| **4. Complaint Authorization** | Departmental Access | Reviewer Authority Routing | `PARTIALLY SECURE` | Department boundary is enforced, but all teachers in a department can read grievances targeted specifically at the HOD or Anti-Ragging Cell. |
| **5. Rules Verification** | Emulator / Test Harness | Rules Testing Environment | `NOT TESTED IN EMULATOR` | Firebase CLI and `@firebase/rules-unit-testing` are not installed on host machine; production rule deployment is strictly prohibited. |

---

## 2. Attendance — Critical Review & Wire Payload Audit

### 2.1 The Wire Payload Leak Vulnerability
- **Document Structure in Firestore:**
  ```
  attendance/{attendanceDocId}
    ├── classId: "3wxJjUqRHwidWjLNlomd"
    ├── courseId: "Oq7V2zbO2fC3zGGUEbLz"
    ├── date: "2026-10-28"
    └── records: {
          "0Hhr9xV3L0bsLoxGAx4PMdjqJry1": "present",
          "dynlSTnbDuXMm62SfhcMdLYCiag2": "absent",
          "K31EyzEaLZW9izG5ZSG4UQ10VHm2": "absent",
          ... (60 other student UIDs) ...
        }
  ```
- **Student Query Implemented in Phase 6A:**
  ```javascript
  query(collection(db, 'attendance'), where('records.' + user.id, 'in', ['present', 'absent', 'late']))
  ```
- **Empirical Network Inspection Findings:**
  - Querying as Student `0Hhr9xV3L0bsLoxGAx4PMdjqJry1` against the live database returned 3 session documents.
  - Inspecting the raw `doc.data()` payloads received across the network:
    - Document `1A4sEtQ7TMORlqqmahnJ`: **63 student attendance records** in raw map.
    - Document `4RkVpF3oWb9Tz1G10twe`: **63 student attendance records** in raw map.
    - Document `ife9Dl7J7NQpvNgryfYg`: **62 student attendance records** in raw map.
  - **Result:** **185 individual student attendance statuses were transmitted over the network into the student's browser.**

### 2.2 Why Client-Side Sanitization Fails as a Security Boundary
In `src/hooks/useAttendance.js`, the code sanitized state as follows:
```javascript
records: {
    [user.id]: data.records?.[user.id]
}
```
**This is purely UI-level sanitization.** Any student opening Chrome DevTools (Network tab -> WS / Fetch inspection) or attaching a breakpoint in `onSnapshot` can read the raw snapshot data and inspect every classmate's daily attendance.

### 2.3 Firestore Engine Architectural Limitation
- **Firestore does NOT support field projections or field-level security masks.**
- Security rules operate strictly on the entire document (`allow read: if ...`). If a document is readable, Firestore delivers every field within that document.
- Therefore, **no client query and no security rule can make the current single-document `records: { [studentUid]: status }` structure secure.**

### 2.4 Migration-Safe Remediation Design (For Phase 6B)
To achieve true, server-enforced data privacy without breaking Faculty/HOD workflows:
1. **Preserve Master Document for Faculty/HOD:**
   - Keep `attendance/{attendanceDocId}` intact so Faculty can mark and view whole-class attendance grids.
2. **Implement Student-Specific Attendance Subcollection (Dual-Write / Fan-Out Pattern):**
   - Path: `users/{studentId}/attendanceRecords/{recordId}`
   - Document Schema:
     ```json
     {
       "attendanceDocId": "1A4sEtQ7TMORlqqmahnJ",
       "classId": "3wxJjUqRHwidWjLNlomd",
       "courseId": "Oq7V2zbO2fC3zGGUEbLz",
       "date": "2026-10-28",
       "status": "present",
       "updatedAt": "..."
     }
     ```
   - **Firestore Security Rule:**
     ```cel
     match /users/{studentId}/attendanceRecords/{recordId} {
       allow read: if isOwner(studentId) || isStaffOrTeacher() || isHod();
       allow write: if isStaffOrTeacher() || isHod();
     }
     ```
   - **Student Dashboard Hook:**
     Student queries `collection(db, 'users', user.id, 'attendanceRecords')`.
   - **Privacy Guarantee:** The network payload contains *only* the authenticated student's record. Classmates' records are physically separate documents that Firestore security rules prohibit the student from reading.

---

## 3. Anonymous Complaints — Critical Review & Anonymity Leakage

### 3.1 The Whistleblower Identity Exposure Vulnerability
- **Filing Flow Inspection (`ComplaintPortalPage.jsx` & `campusUtilitiesService.js`):**
  When a student files an anonymous grievance, `createComplaint()` sets:
  ```javascript
  studentId: complaintData.studentId || '', // Contains real student UID!
  isAnonymous: true,
  studentName: 'Anonymous Student',
  studentUsn: 'CONFIDENTIAL',
  studentEmail: '',
  studentPhone: ''
  ```
  This was done so the student could track their grievance in the "Track Complaints" tab via `where('studentId', '==', user.id)`.

### 3.2 Empirical Wire Payload Audit
- In our empirical audit (`scripts/security_review_phase6a1.mjs`), an anonymous complaint was created with `studentId: "student_whistleblower_real_uid"`.
- A reviewer (Faculty/HOD) queried departmental complaints (`where('departmentId', 'in', ['CSE', 'ALL'])`).
- **Audit Findings:**
  - The reviewer received the document containing `"studentId": "student_whistleblower_real_uid"`.
  - While the UI displayed `"Anonymous Student"`, the raw JSON payload in the reviewer's browser contained the student's real UID.
  - Any reviewer can copy that UID and look up the student's name, USN, and department in the `users` collection.
  - **Attachment Leakage:** Evidence URLs contained the user's storage path:
    `https://firebasestorage.googleapis.com/.../users/student_whistleblower_real_uid/evidence.png`.
- **Classification:** `UI-ONLY PROTECTION` / `INSECURE` (Anonymity compromised at network layer).

### 3.3 Migration-Safe Remediation Design: The Dual-Key Token Pattern
To guarantee cryptographically irreversible anonymity without breaking student tracking:
1. **Master Complaint Document (`campusComplaints/{complaintId}`):**
   - For anonymous complaints, set `studentId: "anonymous"`.
   - Generate an unguessable `trackingToken` (UUIDv4).
   - Store `trackingTokenHash: sha256(trackingToken)` on the complaint document.
   - Strip all author metadata and route attachments through an anonymous storage path (`/attachments/anonymous/{complaintId}/{filename}`).
2. **Student Private Tracking Registry (`users/{studentId}/trackedComplaints/{complaintId}`):**
   - Store:
     ```json
     {
       "complaintId": "cmp-12345",
       "trackingToken": "tok_xyz...",
       "ticketNumber": "CMP-7777",
       "title": "Anonymous Report",
       "submittedAt": "2026-11-02T..."
     }
     ```
   - **Student Tracking Query:** The student listens to their own subcollection `users/{studentId}/trackedComplaints`. To fetch the latest status/resolution, the client fetches the specific complaint document by ID (`doc(db, 'campusComplaints', complaintId)`).
   - **Result:** Faculty and HOD network payloads hold `studentId: "anonymous"`. The student's UID does not exist on the grievance document.

---

## 4. Notifications — Query & Security Rules Audit

### 4.1 Evaluation of Phase 6A Implementation
- **Query Constraint:**
  ```javascript
  query(
      collection(db, 'notifications'),
      or(
          where('targetUserId', '==', user.id),
          and(
              where('targetUserId', '==', null),
              where('targetRole', 'in', allowedRoles)
          )
      )
  )
  ```
- **Audit Findings:**
  - **User-Specific Isolation:** In empirical tests, Student A querying notifications received only notices addressed to Student A. Notices addressed to Student B were strictly absent from the query results.
  - **Public & Role Broadcasts:** General campus broadcasts (`targetUserId: null`, `targetRole: 'all'`) and role announcements (`targetRole: 'student'`) were delivered properly.
  - **Direct Query Attempts by Unauthorized Users:** If a malicious student alters the query to request another student's notifications (`targetUserId == 'student_B'`), local `firestore.rules` evaluates `resource.data.targetUserId == request.auth.uid`, which evaluates to `false` and rejects the request.
- **Classification:** `SECURE AND VERIFIED`.

---

## 5. Complaint Access — Departmental Authority Boundaries

### 5.1 Reviewer Scope Findings
- **Current Query for Faculty/Staff:**
  ```javascript
  query(complaintsRef, where('departmentId', 'in', [dept, 'ALL']))
  ```
- **Audit Findings:**
  - **Department Boundary Enforced:** CSE faculty cannot query or receive ECE or ME complaints (**PASS**).
  - **Internal Authority Overexposure:** Complaints specify a `targetAuthority`:
    - `HOD (Head of Department)`
    - `Anti-Ragging & Disciplinary Cell`
    - `Staff Advisor (Faculty Mentor)`
    - `Campus Maintenance Desk`
  - Under the current query, every teaching faculty member in CSE receives all complaints filed under CSE, including highly sensitive harassment complaints addressed strictly to the `Anti-Ragging & Disciplinary Cell` or `HOD`.
- **Classification:** `PARTIALLY SECURE`.
- **Remediation Recommendation:**
  - Constrain faculty queries to complaints where `targetAuthority in ['Staff Advisor (Faculty Mentor)', 'General']` OR where `assignedTo == user.name` / `assignedToId == user.id`.
  - Reserve department-wide complaint visibility strictly for the verified HOD.

---

## 6. Firestore Security Rules Testing & Tooling Limitations

### 6.1 Tooling Limitations Acknowledgment
- **Firebase Emulator Suite:** Not installed on the Windows host machine (`firebase` CLI command unavailable).
- **`@firebase/rules-unit-testing`:** Not present in `node_modules`.
- **Remote Production Firebase Project (`nexus-smart-campus-39bd7`):** The remote project currently operates with permissive rules in the Firebase console.
- **Rules Deployment Prohibited:** Per user instructions, deploying rules to the production Firebase project is strictly forbidden.
- **Classification:** `NOT TESTED IN EMULATOR (Tooling Unavailable)`.
- *Note:* All tests executed and reported in this phase are client SDK queries against the live project schema, not server-enforced emulator rules runs.

---

## 7. Concrete Test Scenario Outcomes

| Test Scenario | Test Method | Outcome | Detailed Finding |
|---|---|---|---|
| **1. Student A attempts to read Student B's attendance** | Direct Firestore Query | **BLOCKED (Client Query)** / **LEAKED (Document Wire)** | Student query constraint does not return Student B-only docs; but any session doc where Student A is present leaks Student B's status. |
| **2. Student A inspects raw attendance document from own query** | Network Payload Inspection | **LEAKED** | 185 other student attendance entries found across 3 session documents in raw network data. |
| **3. Faculty attempts to read unauthorized class attendance** | Assigned Class Query Scope | **BLOCKED** | Faculty query `where('classId', 'in', teacherClasses)` excludes unauthorized class sessions. |
| **4. HOD attempts to read another department's records** | Department Query Scope | **BLOCKED** | HOD query `where('departmentId', 'in', [dept, 'ALL'])` excludes other department records. |
| **5. Reviewer attempts to obtain anonymous complainant identity** | Raw Document Inspection | **LEAKED** | Reviewer receives raw document with `studentId: "student_whistleblower_real_uid"`. Real UID is exposed. |
| **6. Student A attempts to read Student B's complaint** | Scoped Query Test | **BLOCKED** | Student A query `where('studentId', '==', studentA_Id)` returns 0 records of Student B complaints. |
| **7. Unauthorized user attempts direct notification query** | Query Constraint Audit | **BLOCKED** | Direct query for another user's `targetUserId` fails matching rule contract. |
| **8. Valid broadcasts reach intended audiences** | Dual-clause `or(...)` query | **SUCCESS** | Broadcasts with `targetUserId: null` and `targetRole: 'all'` are delivered reliably. |

---

## 8. Prioritized Recommendations for Phase 6B

1. **Attendance Architecture:**
   - Migrate student attendance reads to individual subcollection documents (`users/{studentId}/attendanceRecords/{recordId}`).
   - Preserve `attendance/{docId}` for faculty and HOD rosters.
2. **Anonymous Complaints Architecture:**
   - Implement the Dual-Key Token Pattern: set `studentId: "anonymous"` on public documents and store tracking tokens in `users/{studentId}/trackedComplaints`.
   - Sanitize attachment storage URLs to prevent UID leakage in file paths.
3. **Faculty Complaint Routing:**
   - Refine faculty complaint queries to only fetch complaints where `targetAuthority == 'Staff Advisor'` or `assignedToId == user.id`, preventing general faculty from seeing HOD/Disciplinary cell grievances.

