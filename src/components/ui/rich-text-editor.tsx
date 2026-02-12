import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  label?: string;
  errorMessage?: string;
  required?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  error,
  disabled,
  readOnly,
  id,
  label,
  errorMessage,
  required,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // Konfigurasi toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
  ];

  const handleChange = (content: string) => {
    if (onChange) {
      onChange(content);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={cn(
        "border rounded-md overflow-hidden",
        error ? "border-red-300" : "border-input",
        disabled && "opacity-50 cursor-not-allowed"
      )}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly || disabled}
          className={cn(
            "rich-text-editor",
            "[&_.ql-container]:border-0",
            "[&_.ql-toolbar]:border-b",
            "[&_.ql-toolbar]:border-b-gray-200",
            "[&_.ql-editor]:min-h-[120px]",
            "[&_.ql-editor]:max-h-[300px]",
            "[&_.ql-editor]:overflow-y-auto",
            error && "[&_.ql-container]:border-red-300",
            disabled && "pointer-events-none"
          )}
        />
      </div>
      
      {errorMessage && error && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};

export default RichTextEditor;