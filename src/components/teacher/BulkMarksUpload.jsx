import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileQuestion, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { parseMarksFile, bulkUpsertMarks, fetchMarksBySubject } from '../../services/marksUploadService';

export default function BulkMarksUpload({ onUploadSuccess }) {
  const [subjectCode, setSubjectCode] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    
    if (validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setSelectedFile(file);
    } else {
      toast.error('Invalid file type. Please upload a .csv or .xlsx file.');
    }
  };

  const handleDownloadTemplate = () => {
    // Generate a simple CSV template string
    const csvContent = "Student ID,Student Name,CIE Marks,SEE Marks\nSTU001,John Doe,45,40\nSTU002,Jane Smith,38,42";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Marks_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = async () => {
    if (!subjectCode.trim()) {
      toast.error('Please enter a Subject Code first.');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Parse File
      const parsedData = await parseMarksFile(selectedFile);
      
      if (parsedData.length === 0) {
        throw new Error('No valid rows found in the file.');
      }

      // 2. Perform Bulk Upsert to Firestore
      const count = await bulkUpsertMarks(subjectCode.toUpperCase(), parsedData);
      
      toast.success(`Successfully uploaded ${count} student records!`);
      
      // 3. Automation: Fetch fresh data and trigger dashboard update
      const freshData = await fetchMarksBySubject(subjectCode.toUpperCase());
      
      // Pass the fresh data up to the parent component to render the CIE-SEE Dashboard
      if (onUploadSuccess) {
        onUploadSuccess(freshData, subjectCode.toUpperCase());
      }
      
      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.message || 'Failed to upload and process marks.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-indigo-600" />
            Bulk Marks Upload
          </h2>
          <p className="text-gray-500 text-sm mt-1">Upload an Excel or CSV file to update student marks instantly.</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-full"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      <div className="space-y-6">
        {/* Subject Code Input */}
        <div>
          <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-1">
            Subject Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subjectCode"
            placeholder="e.g., BCS301"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragActive ? 'border-indigo-500 bg-indigo-50/50' : selectedFile ? 'border-green-300 bg-green-50/30' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            className="hidden" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          />
          
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload</p>
              <button 
                className="mt-4 text-sm font-medium text-red-500 hover:text-red-700" 
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                Remove File
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">Click or drag file to this area to upload</p>
              <p className="text-sm text-gray-500 mt-2">Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.</p>
              <div className="flex gap-2 mt-4 text-xs font-medium text-gray-400">
                <span className="bg-gray-100 px-2 py-1 rounded">.CSV</span>
                <span className="bg-gray-100 px-2 py-1 rounded">.XLSX</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleUploadClick}
            disabled={isUploading || !selectedFile || !subjectCode.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Upload...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Upload & Analyze Marks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
