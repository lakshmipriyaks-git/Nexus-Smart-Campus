import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';

// Configure PDF.js worker - use local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_FILE_SIZE = {
    pdf: 10 * 1024 * 1024,  // 10MB
    docx: 5 * 1024 * 1024,  // 5MB
    pptx: 5 * 1024 * 1024,  // 5MB
};

/**
 * Parse PDF file and extract text content
 * @param {File} file - PDF file
 * @returns {Promise<string>} Extracted text
 */
export async function parsePDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `\n--- Page ${i} ---\n${pageText}\n`;
        }

        return fullText.trim();
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF file. Please ensure it\'s a valid PDF.');
    }
}

/**
 * Parse DOCX file and extract text content
 * @param {File} file - DOCX file
 * @returns {Promise<string>} Extracted text
 */
export async function parseDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Error parsing DOCX:', error);
        throw new Error('Failed to parse DOCX file. Please ensure it\'s a valid DOCX document.');
    }
}

/**
 * Parse PPTX file and extract text content
 * Note: This is a simplified parser that extracts text from XML
 * @param {File} file - PPTX file
 * @returns {Promise<string>} Extracted text
 */
export async function parsePPT(file) {
    try {
        // PPTX files are ZIP archives containing XML files
        // We'll use a simple approach: convert to text and extract readable content
        const text = await file.text();

        // Extract text between XML tags (simplified approach)
        const textMatches = text.match(/>([^<]+)</g);
        if (!textMatches) {
            return 'No readable text found in presentation.';
        }

        const extractedText = textMatches
            .map(match => match.replace(/^>|<$/g, '').trim())
            .filter(text => text.length > 2 && !/^[0-9.]+$/.test(text)) // Filter out numbers and short text
            .join(' ');

        return extractedText || 'No readable text found in presentation.';
    } catch (error) {
        console.error('Error parsing PPT:', error);
        throw new Error('Failed to parse PowerPoint file. Please ensure it\'s a valid PPTX file.');
    }
}

/**
 * Main document parser that routes to appropriate parser based on file type
 * @param {File} file - Document file (PDF, DOCX, or PPTX)
 * @returns {Promise<{text: string, metadata: object}>} Extracted text and metadata
 */
export async function parseDocument(file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileType = fileExtension === 'ppt' ? 'pptx' : fileExtension;

    // Validate file size
    if (file.size > MAX_FILE_SIZE[fileType]) {
        const maxSizeMB = MAX_FILE_SIZE[fileType] / (1024 * 1024);
        throw new Error(`File size exceeds the limit of ${maxSizeMB}MB for ${fileType.toUpperCase()} files.`);
    }

    let text = '';

    switch (fileExtension) {
        case 'pdf':
            text = await parsePDF(file);
            break;
        case 'docx':
        case 'doc':
            text = await parseDOCX(file);
            break;
        case 'pptx':
        case 'ppt':
            text = await parsePPT(file);
            break;
        default:
            throw new Error(`Unsupported file type: ${fileExtension}. Please upload a PDF, DOCX, or PPTX file.`);
    }

    return {
        text,
        metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: fileExtension,
            extractedLength: text.length,
        }
    };
}

/**
 * Get supported file extensions as accept attribute value
 * @returns {string} Comma-separated file extensions
 */
export function getSupportedFileTypes() {
    return '.pdf,.doc,.docx,.ppt,.pptx';
}
