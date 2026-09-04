import * as XLSX from 'xlsx';

/**
 * Parses an Excel file for bulk grade entry based on the VTU Result Analysis format.
 * Expects multi-row headers.
 * 
 * @param {File} file The uploaded Excel file
 * @param {Array} enrolledStudents The list of enrolled students to match against
 * @param {string} courseName The name of the current course (used for matching the column)
 * @returns {Promise<{ assessments: Array, grades: Array, unmappedStudents: Array, invalidGrades: Array }>}
 */
export const parseExcelForGrades = (file, enrolledStudents, courseName) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Read as 2D array to handle merged cells and multi-row headers
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                
                if (rows.length < 3) {
                    throw new Error("The uploaded Excel sheet does not match the expected format.");
                }

                // 1. Find the header row containing "USN" and "NAME"
                let nameRowIdx = -1;
                let usnColIdx = -1;
                let nameColIdx = -1;

                for (let r = 0; r < Math.min(rows.length, 10); r++) {
                    for (let c = 0; c < rows[r].length; c++) {
                        const cellVal = String(rows[r][c]).toUpperCase().trim();
                        if (cellVal === 'NAME') {
                            nameRowIdx = r;
                            nameColIdx = c;
                        } else if (cellVal === 'USN') {
                            usnColIdx = c;
                        }
                    }
                    if (nameRowIdx !== -1) break;
                }

                if (nameRowIdx === -1 || usnColIdx === -1) {
                    throw new Error("Could not find 'USN' and 'NAME' columns. Please check the format.");
                }

                // 2. Identify the subject columns for the CURRENT course.
                // In merged cells, XLSX usually puts the value in the top-left cell of the merge and empty strings elsewhere.
                // We'll search the 'nameRowIdx' for a subject name that matches our courseName.
                // If courseName is not found, we'll try to find any subject to import, but it's safer to ask the user.
                
                // For a robust bulk entry regardless of course name, let's extract ALL subjects we find in the row
                // and present them as assessments. But wait, `GradeEntry` maps to ONE course.
                // If it maps to one course, we should create assessments for just that course.
                // Let's create an assessment called "IA" and an assessment called "EXT" based on the matched subject, or if not found, let the user map it?
                // Actually, the user says "bulk data entry system in my college format... automatically categorize and create assesments like IA or External Exam".
                // If the user uploads the massive sheet, they probably want to extract the IA and EXT marks for their specific course (e.g. courseName).
                
                let courseColStartIdx = -1;
                let courseColEndIdx = -1;

                // Let's try to find a column in nameRowIdx whose name roughly matches courseName
                const normalizedCourseName = courseName ? courseName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                
                for (let c = nameColIdx + 1; c < rows[nameRowIdx].length; c++) {
                    const headerVal = String(rows[nameRowIdx][c]).toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (headerVal && normalizedCourseName && (headerVal.includes(normalizedCourseName) || normalizedCourseName.includes(headerVal))) {
                        courseColStartIdx = c;
                        break;
                    }
                }

                // If no exact match, we just grab the first subject block after NAME because maybe they uploaded just their subject's sheet
                if (courseColStartIdx === -1) {
                    for (let c = nameColIdx + 1; c < rows[nameRowIdx].length; c++) {
                        const cellVal = String(rows[nameRowIdx][c]).trim();
                        if (cellVal && cellVal !== 'P/F' && cellVal !== 'TOTAL' && cellVal !== '%' && cellVal !== 'CLASS' && cellVal !== 'fail subject' && cellVal !== 'SGPA' && cellVal !== 'CGPA') {
                            courseColStartIdx = c;
                            break;
                        }
                    }
                }

                if (courseColStartIdx === -1) {
                    throw new Error("Could not identify the course columns in the sheet.");
                }

                // The subject block usually has IA, EXT, T, P/F. We read row nameRowIdx + 2 for these.
                // And nameRowIdx + 1 might have the subject code.
                const metaRowIdx = nameRowIdx + 2; 
                
                // Prepare assessments for this block
                const assessmentsToCreate = [];
                const assessmentCols = []; // { colIdx, type, maxMarks }

                for (let c = courseColStartIdx; c < courseColStartIdx + 4; c++) { // read up to 4 cols (IA, EXT, T, P/F)
                    if (c >= rows[metaRowIdx].length) break;
                    
                    const colType = String(rows[metaRowIdx][c]).toUpperCase().trim();
                    
                    if (colType === 'IA') {
                        assessmentsToCreate.push({
                            originalColumn: `col_${c}`,
                            name: 'Internal Assessment',
                            type: 'internal',
                            maxMarks: 50 // Typical VTU max for IA
                        });
                        assessmentCols.push({ colIdx: c, id: `col_${c}` });
                    } else if (colType === 'EXT') {
                        assessmentsToCreate.push({
                            originalColumn: `col_${c}`,
                            name: 'External Exam',
                            type: 'external',
                            maxMarks: 100 // Typical VTU max for EXT
                        });
                        assessmentCols.push({ colIdx: c, id: `col_${c}` });
                    }
                }

                if (assessmentsToCreate.length === 0) {
                    throw new Error("Could not find 'IA' or 'EXT' columns for the subject. Ensure the sheet has three header rows like the format.");
                }

                const gradesToEnter = [];
                const unmappedStudents = [];
                const invalidGrades = [];

                // 3. Parse student rows
                const dataStartRow = nameRowIdx + 3; // First student usually starts 3 rows below the main header

                for (let r = dataStartRow; r < rows.length; r++) {
                    const rowStudentName = rows[r][nameColIdx];
                    const rowUSN = rows[r][usnColIdx];
                    
                    if (!rowStudentName && !rowUSN) continue; // Skip empty rows

                    // Find matching student
                    let matchedStudent = null;
                    if (rowUSN) {
                        matchedStudent = enrolledStudents.find(s => 
                            s.studentName.toLowerCase().includes(String(rowUSN).toLowerCase()) ||
                            String(rowUSN).toLowerCase().includes(s.studentName.toLowerCase())
                        );
                    }
                    if (!matchedStudent && rowStudentName) {
                        matchedStudent = enrolledStudents.find(s => 
                            s.studentName.toLowerCase() === String(rowStudentName).toLowerCase() ||
                            s.studentName.toLowerCase().includes(String(rowStudentName).toLowerCase()) ||
                            String(rowStudentName).toLowerCase().includes(s.studentName.toLowerCase())
                        );
                    }

                    if (!matchedStudent) {
                        unmappedStudents.push({ rowNumber: r + 1, name: rowStudentName || rowUSN });
                        continue;
                    }

                    // Map grades
                    assessmentCols.forEach(mappedCol => {
                        const marks = rows[r][mappedCol.colIdx];
                        
                        // Ignore empty, 'A' (Absent), 'NE' (Not Eligible) etc. Or maybe parse them as 0 later?
                        if (marks === undefined || marks === null || String(marks).trim() === '') return;

                        let numMarks = Number(marks);
                        
                        // Handle 'A' or 'NE' as 0 marks for now
                        if (String(marks).toUpperCase().trim() === 'A' || String(marks).toUpperCase().trim() === 'NE') {
                            numMarks = 0;
                        }

                        const assessmentMeta = assessmentsToCreate.find(a => a.originalColumn === mappedCol.id);

                        if (isNaN(numMarks) || numMarks < 0 || numMarks > assessmentMeta.maxMarks) {
                            invalidGrades.push({
                                studentName: rowStudentName || rowUSN,
                                assessmentName: assessmentMeta.name,
                                marksScored: marks,
                                maxMarks: assessmentMeta.maxMarks
                            });
                        } else {
                            gradesToEnter.push({
                                studentId: matchedStudent.studentId,
                                studentName: matchedStudent.studentName,
                                originalColumn: mappedCol.id,
                                marksScored: numMarks
                            });
                        }
                    });
                }

                resolve({
                    assessments: assessmentsToCreate,
                    grades: gradesToEnter,
                    unmappedStudents,
                    invalidGrades
                });

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};

/**
 * Generates a template Excel file mimicking the VTU college format exactly.
 */
export const downloadGradeTemplate = () => {
    // Generate the multi-row header structure
    const ws_data = [
        ["", "", "", "K S SCHOOL OF ENGINEERING & MANAGEMENT"],
        ["", "", "", "DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE"],
        ["BRANCH/SEM/SEC: AI&DS III 'A'", "", "", "THIRD SEMESTER RESULT ANALYSIS (ODD SEMESTER 2025-2026)", "", "", "", "", "CLASS TEACHER: Mrs. Shilpa S"],
        ["SL NO", "USN", "NAME", "Math", "", "", "", "DDCO", "", "", "", "OS", "", "", "", "P/F", "TOTAL", "%", "CLASS", "fail subject", "SGPA", "CGPA"],
        ["", "", "", "BCS301", "", "", "", "BCS302", "", "", "", "BCS303", "", "", ""],
        ["", "", "", "IA", "EXT", "T", "P/F", "IA", "EXT", "T", "P/F", "IA", "EXT", "T", "P/F"]
    ];

    // Some dummy row data matching the format in the picture
    ws_data.push(["1", "1KG24AD001", "AAKRUTHI PRASAD HERIMATH", 50, 36, 86, "P", 49, 33, 82, "P", 46, 34, 80, "P", "P", 697, 77.45, "FCD", 0, 8.68, ""]);
    ws_data.push(["2", "1KG24AD002", "ABHISHEK BHAT", 48, 38, 86, "P", 47, 29, 76, "P", 48, 32, 80, "P", "P", 690, 76.67, "FCD", 0, 8.5, ""]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Merge cells for headers
    if (!ws['!merges']) ws['!merges'] = [];
    
    // Merge Math, DDCO, OS in Row 4
    ws['!merges'].push({ s: { r: 3, c: 3 }, e: { r: 3, c: 6 } }); // Math
    ws['!merges'].push({ s: { r: 3, c: 7 }, e: { r: 3, c: 10 } }); // DDCO
    ws['!merges'].push({ s: { r: 3, c: 11 }, e: { r: 3, c: 14 } }); // OS

    // Merge Subject Codes in Row 5
    ws['!merges'].push({ s: { r: 4, c: 3 }, e: { r: 4, c: 6 } }); // BCS301
    ws['!merges'].push({ s: { r: 4, c: 7 }, e: { r: 4, c: 10 } }); // BCS302
    ws['!merges'].push({ s: { r: 4, c: 11 }, e: { r: 4, c: 14 } }); // BCS303

    // Merge USN, NAME vertically (Rows 4, 5, 6)
    ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 5, c: 0 } }); // SL NO
    ws['!merges'].push({ s: { r: 3, c: 1 }, e: { r: 5, c: 1 } }); // USN
    ws['!merges'].push({ s: { r: 3, c: 2 }, e: { r: 5, c: 2 } }); // NAME

    // Merge remaining columns vertically
    for (let col = 15; col <= 21; col++) {
        ws['!merges'].push({ s: { r: 3, c: col }, e: { r: 5, c: col } });
    }

    // Set column widths to match visually
    ws['!cols'] = [
        { wch: 6 },  // SL NO
        { wch: 15 }, // USN
        { wch: 25 }, // NAME
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, // Math block
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, // DDCO block
        { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, // OS block
        { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 8 } // P/F, TOTAL, %, CLASS, fail subject, SGPA, CGPA
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Result Analysis");
    
    XLSX.writeFile(wb, "vtu_result_analysis_template.xlsx");
};
