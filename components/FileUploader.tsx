'use client';

import React, { useState, useRef } from 'react';
import styles from './FileUploader.module.css';
import { parseTokensFile, ParsedTokensData } from '../lib/validation/parser';

export interface FileUploaderProps {
  onTokensParsed?: (data: ParsedTokensData, fileName: string) => void;
}

export function FileUploader({ onTokensParsed }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<'invalid-json' | 'schema-mismatch' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setUploadedFileName(file.name);
    setErrorMessage(null);
    setErrorState(null);

    // Read purely in-memory (never transmitted, never persisted)
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        setErrorState('invalid-json');
        setErrorMessage('Could not read the file contents as text.');
        return;
      }

      const result = parseTokensFile(content);

      if (!result.success) {
        setErrorState(result.state);
        setErrorMessage(result.error);
        return;
      }

      // Successful parse
      if (onTokensParsed) {
        onTokensParsed(result.data, file.name);
      }
    };

    reader.onerror = () => {
      setErrorState('invalid-json');
      setErrorMessage('A file reading error occurred. Please try again.');
    };

    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className={styles.fileInput}
        onChange={onFileInputChange}
        data-testid="tokenlint-file-input"
      />

      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        aria-label="Upload design tokens JSON file"
        data-testid="tokenlint-dropzone"
      >
        <div className={styles.iconContainer}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <h2 className={styles.heading}>Upload your design tokens file</h2>
        <p className={styles.instruction}>
          Drag and drop a <code>design-tokens.json</code> file here, or click to browse
        </p>

        <button
          type="button"
          className={styles.button}
          onClick={(e) => {
            e.stopPropagation();
            triggerFileInput();
          }}
        >
          Choose File
        </button>
      </div>

      {uploadedFileName && (
        <span className={styles.fileName}>
          Selected file: {uploadedFileName}
        </span>
      )}

      {errorMessage && (
        <div
          className={styles.errorBanner}
          role="alert"
          data-testid="error-banner"
          data-error-state={errorState}
        >
          <div className={styles.errorHeader}>
            <span className={styles.errorTag}>
              {errorState === 'invalid-json' ? 'JSON Syntax Error' : 'Schema Error'}
            </span>
            <h3 className={styles.errorTitle}>
              {errorState === 'invalid-json' ? 'Invalid JSON File' : 'Schema Format Mismatch'}
            </h3>
          </div>
          <p className={styles.errorDescription}>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
