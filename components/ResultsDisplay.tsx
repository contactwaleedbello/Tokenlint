'use client';

import React from 'react';
import styles from './ResultsDisplay.module.css';
import { ValidationReport, ValidationIssue } from '../lib/validation/rules';

export interface ResultsDisplayProps {
  report: ValidationReport;
  fileName: string;
  onReset: () => void;
}

export function ResultsDisplay({ report, fileName, onReset }: ResultsDisplayProps) {
  const { errors, warnings, info, totalIssues } = report;

  // Zero-findings state (All Clear)
  if (totalIssues === 0) {
    return (
      <div className={styles.resultsContainer} data-testid="results-all-clear">
        <div className={styles.summaryHeader}>
          <div className={styles.summaryTop}>
            <h2 className={styles.fileTitle}>Validation Summary: {fileName}</h2>
            <button
              type="button"
              className={styles.resetButton}
              onClick={onReset}
              data-testid="validate-another-btn"
            >
              Check another file
            </button>
          </div>
        </div>

        <section className={styles.allClearCard} aria-label="All checks passed">
          <span className={styles.allClearBadge}>VALIDATION PASSED</span>
          <h3 className={styles.allClearTitle}>All Checks Passed Cleanly</h3>
          <p className={styles.allClearDescription}>
            All 20 required roles are present, all On-X/X contrast pairs meet or exceed the 4.5:1 WCAG AA threshold, and all primitive references resolve cleanly with zero unreferenced primitives.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer} data-testid="results-display">
      <div className={styles.summaryHeader}>
        <div className={styles.summaryTop}>
          <h2 className={styles.fileTitle}>Validation Findings: {fileName}</h2>
          <button
            type="button"
            className={styles.resetButton}
            onClick={onReset}
            data-testid="validate-another-btn"
          >
            Check another file
          </button>
        </div>

        <div className={styles.countsRow}>
          <span className={`${styles.badge} ${styles.badgeError}`}>
            {errors.length} {errors.length === 1 ? 'Error' : 'Errors'}
          </span>
          <span className={`${styles.badge} ${styles.badgeWarning}`}>
            {warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}
          </span>
          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            {info.length} Info
          </span>
        </div>
      </div>

      {/* 1. Errors Group (Fixed order per validation.md) */}
      {errors.length > 0 && (
        <section
          className={styles.severityGroup}
          aria-labelledby="errors-group-heading"
          data-testid="errors-group"
        >
          <div className={styles.groupHeader}>
            <div className={styles.groupTitleRow}>
              <h3 id="errors-group-heading" className={styles.groupTitle}>
                Errors
              </h3>
              <span className={styles.badgeCount}>{errors.length}</span>
            </div>
          </div>
          <p className={styles.groupContext}>
            Critical violations: missing required roles or contrast pairs failing the 4.5:1 WCAG AA threshold.
          </p>
          <ul className={styles.issuesList}>
            {errors.map((issue, idx) => (
              <li
                key={`err-${idx}`}
                className={`${styles.issueCard} ${styles.issueCardError}`}
                data-testid={`issue-error-${idx}`}
              >
                <div className={styles.issueHeader}>
                  <span className={`${styles.badge} ${styles.badgeError}`}>Error</span>
                </div>
                <p className={styles.issueMessage}>{issue.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 2. Warnings Group */}
      {warnings.length > 0 && (
        <section
          className={styles.severityGroup}
          aria-labelledby="warnings-group-heading"
          data-testid="warnings-group"
        >
          <div className={styles.groupHeader}>
            <div className={styles.groupTitleRow}>
              <h3 id="warnings-group-heading" className={styles.groupTitle}>
                Warnings
              </h3>
              <span className={styles.badgeCount}>{warnings.length}</span>
            </div>
          </div>
          <p className={styles.groupContext}>
            Reference discrepancies: roles pointing to primitives not found in the file.
          </p>
          <ul className={styles.issuesList}>
            {warnings.map((issue, idx) => (
              <li
                key={`warn-${idx}`}
                className={`${styles.issueCard} ${styles.issueCardWarning}`}
                data-testid={`issue-warning-${idx}`}
              >
                <div className={styles.issueHeader}>
                  <span className={`${styles.badge} ${styles.badgeWarning}`}>Warning</span>
                </div>
                <p className={styles.issueMessage}>{issue.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Info Group */}
      {info.length > 0 && (
        <section
          className={styles.severityGroup}
          aria-labelledby="info-group-heading"
          data-testid="info-group"
        >
          <div className={styles.groupHeader}>
            <div className={styles.groupTitleRow}>
              <h3 id="info-group-heading" className={styles.groupTitle}>
                Informational
              </h3>
              <span className={styles.badgeCount}>{info.length}</span>
            </div>
          </div>
          <p className={styles.groupContext}>
            Non-critical observations: defined primitives that are never referenced by any role.
          </p>
          <ul className={styles.issuesList}>
            {info.map((issue, idx) => (
              <li
                key={`info-${idx}`}
                className={`${styles.issueCard} ${styles.issueCardInfo}`}
                data-testid={`issue-info-${idx}`}
              >
                <div className={styles.issueHeader}>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>Info</span>
                </div>
                <p className={styles.issueMessage}>{issue.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
