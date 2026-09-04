import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css'; // For custom styling

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Write something...',
    maxLength,
    disabled = false,
    className = ''
}) {
    // Toolbar configuration
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
        ]
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'link'
    ];

    // Get plain text length for character count
    const getPlainText = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleChange = (content, delta, source, editor) => {
        if (maxLength) {
            const text = editor.getText();
            if (text.length > maxLength) {
                return; // Prevent change if over limit
            }
        }
        onChange(content);
    };

    const currentLength = value ? getPlainText(value).length : 0;

    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                value={value}
                onChange={handleChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={disabled}
                theme="snow"
            />
            {maxLength && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {currentLength} / {maxLength} characters
                </div>
            )}
        </div>
    );
}
