'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { FileUploader } from '../components/FileUploader';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { ParsedTokensData } from '../lib/validation/parser';
import { validateTokens, ValidationReport } from '../lib/validation/rules';

export default function HomePage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleTokensParsed = (data: ParsedTokensData, name: string) => {
    const valReport = validateTokens(data);
    setReport(valReport);
    setActiveFileName(name);
  };

  const handleReset = () => {
    setReport(null);
    setActiveFileName(null);
  };

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <span className={styles.brand}>Tokenlint</span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          data-testid="theme-toggle-btn"
        >
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Tokenlint</h1>
        <p className={styles.subtitle}>
          Verify design tokens against W3C structure, required roles, and accessibility rules client-side.
        </p>
      </header>

      {!report ? (
        <FileUploader onTokensParsed={handleTokensParsed} />
      ) : (
        <ResultsDisplay
          report={report}
          fileName={activeFileName || 'design-tokens.json'}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
