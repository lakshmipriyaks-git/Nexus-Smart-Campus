import { collection, doc, writeBatch, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase'; // Ensure your db configuration is correctly exported from here
import * as xlsx from 'xlsx';
import Papa from 'papaparse';

/**
 * Validates the raw data array from CSV/Excel to ensure required columns exist.
 * @param {Array<Object>} data 
 * @returns {Array<Object>} Filtered and mapped clean data
 */
const validateAndCleanData = (data) => {
  const cleanData = [];
  
  for (const row of data) {
    // Normalize keys to lowercase and remove whitespace for easier matching
    const rowKeys = Object.keys(row);
    const normalizedRow = {};
    
    rowKeys.forEach(key => {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalizedRow[cleanKey] = row[key];
    });

    // Check for required columns
    const studentId = normalizedRow['student_id'] || normalizedRow['id'] || normalizedRow['usn'];
    const name = normalizedRow['student_name'] || normalizedRow['name'];
    const cieMarks = Number(normalizedRow['cie_marks'] || normalizedRow['cie']);
    const seeMarks = Number(normalizedRow['see_marks'] || normalizedRow['see']);

    // Skip empty rows or those completely missing ID
    if (!studentId) continue;

    cleanData.push({
      student_id: String(studentId).trim(),
      name: name ? String(name).trim() : 'Unknown',
      cie_marks: isNaN(cieMarks) ? 0 : cieMarks,
      see_marks: isNaN(seeMarks) ? 0 : seeMarks,
    });
  }

  return cleanData;
};

/**
 * Parses an uploaded File (Excel or CSV) into an array of objects.
 * @param {File} file 
 * @returns {Promise<Array>} Resolves to validated data
 */
export const parseMarksFile = (file) => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length && !results.data.length) {
            reject(new Error("Failed to parse CSV file."));
          } else {
            resolve(validateAndCleanData(results.data));
          }
        },
        error: (err) => reject(err)
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = xlsx.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // Convert sheet to JSON array
          const rawJsonData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
          resolve(validateAndCleanData(rawJsonData));
        } catch (err) {
          reject(new Error("Failed to read Excel file. Please ensure it is not corrupted."));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file format. Please upload .csv or .xlsx"));
    }
  });
};

/**
 * Performs a bulk Upsert on Firestore for the student marks.
 * Updates if {student_id + subject_code} exists, otherwise Inserts.
 * @param {string} subjectCode 
 * @param {Array<Object>} parsedData 
 * @returns {Promise<number>} Number of records processed
 */
export const bulkUpsertMarks = async (subjectCode, parsedData) => {
  if (!parsedData || parsedData.length === 0) return 0;
  if (!subjectCode) throw new Error("Subject Code is required.");

  let batch = writeBatch(db);
  let batchCount = 0;
  const BATCH_LIMIT = 500; // Firestore limit per batch

  const marksCollectionRef = collection(db, 'student_marks');

  for (const student of parsedData) {
    // We create a deterministic document ID combining subject code and student ID
    // so we can easily upsert without querying first!
    const docId = `${subjectCode}_${student.student_id}`.replace(/\s+/g, '-').toUpperCase();
    const docRef = doc(marksCollectionRef, docId);

    batch.set(docRef, {
      ...student,
      subject_code: subjectCode,
      updatedAt: serverTimestamp()
    }, { merge: true }); // merge: true turns this into an UPSERT operation

    batchCount++;

    // Commit batch if we hit limit
    if (batchCount % BATCH_LIMIT === 0) {
      await batch.commit();
      batch = writeBatch(db); // start a new batch
    }
  }

  // Commit remaining
  if (batchCount % BATCH_LIMIT !== 0) {
    await batch.commit();
  }

  return batchCount;
};

/**
 * Fetches all marks for a given subject code
 * @param {string} subjectCode 
 * @returns {Promise<Array>} Array of StudentMarks objects
 */
export const fetchMarksBySubject = async (subjectCode) => {
  const q = query(collection(db, 'student_marks'), where("subject_code", "==", subjectCode));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
