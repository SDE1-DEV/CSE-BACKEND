/**
 * Python Seed Data
 *
 * Defines all 16 sections × their lessons for the Python Programming roadmap.
 * Content is stored in a separate JSON file to avoid TypeScript template-literal
 * escaping issues with markdown backticks and Python f-strings.
 *
 * CONTENT LOADING: If prisma/python-lessons-content.json exists the loader injects
 * full markdown content per lessonSlug. Otherwise lessons are seeded with a
 * placeholder that the Manager CMS can fill in later.
 */

import * as fs from 'fs'
import * as path from 'path'

export interface LessonSeedData {
  sectionTitle: string
  sectionOrder: number
  lessonTitle: string
  lessonSlug: string
  lessonOrder: number
  estimatedMinutes: number
  content: string
}

// ── Try to load rich content map from JSON ────────────────────────────────────
// Format: { [lessonSlug]: "markdown content string" }
function loadContentMap(): Record<string, string> {
  const jsonPath = path.join(__dirname, 'python-lessons-content.json')
  try {
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    }
  } catch {
    // JSON missing or malformed — fall back to placeholder
  }
  return {}
}

function placeholder(lessonTitle: string, sectionTitle: string): string {
  return [
    `# ${lessonTitle}`,
    '',
    `## Introduction`,
    '',
    `Welcome to **${lessonTitle}**! This lesson is part of the *${sectionTitle}* module.`,
    'Full lesson content will be added by the content team via the Manager CMS.',
    '',
    `## Definition`,
    '',
    `${lessonTitle} is an important Python concept that you will master in this section.`,
    '',
    `## Why it exists`,
    '',
    'Understanding this topic is essential for writing clean, efficient Python code.',
    '',
    `## Syntax`,
    '',
    '```python',
    `# Example code for ${lessonTitle}`,
    'print("Hello from Python!")',
    '```',
    '',
    `## Summary`,
    '',
    `You have completed the introduction to **${lessonTitle}**.`,
    'Practice the examples and complete the quiz below.',
  ].join('\n')
}

const PYTHON_LESSONS_COMPACT: Omit<LessonSeedData, 'content'>[] = [
  // ── Section 1: Introduction ──────────────────────────────────────────────────
  { sectionTitle: 'Introduction', sectionOrder: 0, lessonTitle: 'About Python & This Roadmap', lessonSlug: 'python-about', lessonOrder: 0, estimatedMinutes: 35 },
  { sectionTitle: 'Introduction', sectionOrder: 0, lessonTitle: 'Python History & Features', lessonSlug: 'python-history-features', lessonOrder: 1, estimatedMinutes: 20 },
  { sectionTitle: 'Introduction', sectionOrder: 0, lessonTitle: 'Installing Python & VS Code', lessonSlug: 'python-install-vscode', lessonOrder: 2, estimatedMinutes: 20 },
  { sectionTitle: 'Introduction', sectionOrder: 0, lessonTitle: 'Running Your First Program', lessonSlug: 'python-first-program', lessonOrder: 3, estimatedMinutes: 15 },
  { sectionTitle: 'Introduction', sectionOrder: 0, lessonTitle: 'Comments and Keywords', lessonSlug: 'python-comments-keywords', lessonOrder: 4, estimatedMinutes: 15 },

  // ── Section 2: Programming Basics ───────────────────────────────────────────
  { sectionTitle: 'Programming Basics', sectionOrder: 1, lessonTitle: 'How Programming Works', lessonSlug: 'python-programming-basics', lessonOrder: 0, estimatedMinutes: 25 },
  { sectionTitle: 'Programming Basics', sectionOrder: 1, lessonTitle: 'Statements and Expressions', lessonSlug: 'python-statements-expressions', lessonOrder: 1, estimatedMinutes: 20 },
  { sectionTitle: 'Programming Basics', sectionOrder: 1, lessonTitle: 'Identifiers and Naming Rules', lessonSlug: 'python-identifiers-naming', lessonOrder: 2, estimatedMinutes: 15 },

  // ── Section 3: Variables & Data Types ───────────────────────────────────────
  { sectionTitle: 'Variables & Data Types', sectionOrder: 2, lessonTitle: 'Python Variables & Data Types', lessonSlug: 'python-variables-data-types', lessonOrder: 0, estimatedMinutes: 40 },
  { sectionTitle: 'Variables & Data Types', sectionOrder: 2, lessonTitle: 'Type Conversion & Casting', lessonSlug: 'python-type-conversion', lessonOrder: 1, estimatedMinutes: 25 },
  { sectionTitle: 'Variables & Data Types', sectionOrder: 2, lessonTitle: 'Numbers in Python', lessonSlug: 'python-numbers', lessonOrder: 2, estimatedMinutes: 20 },
  { sectionTitle: 'Variables & Data Types', sectionOrder: 2, lessonTitle: 'Booleans and None', lessonSlug: 'python-booleans-none', lessonOrder: 3, estimatedMinutes: 20 },

  // ── Section 4: Operators ─────────────────────────────────────────────────────
  { sectionTitle: 'Operators', sectionOrder: 3, lessonTitle: 'Python Operators Deep Dive', lessonSlug: 'python-operators', lessonOrder: 0, estimatedMinutes: 35 },
  { sectionTitle: 'Operators', sectionOrder: 3, lessonTitle: 'Comparison & Logical Operators', lessonSlug: 'python-comparison-logical-ops', lessonOrder: 1, estimatedMinutes: 25 },
  { sectionTitle: 'Operators', sectionOrder: 3, lessonTitle: 'Bitwise & Assignment Operators', lessonSlug: 'python-bitwise-assignment-ops', lessonOrder: 2, estimatedMinutes: 25 },

  // ── Section 5: Input & Output ─────────────────────────────────────────────────
  { sectionTitle: 'Input & Output', sectionOrder: 4, lessonTitle: 'Input / Output and Formatted Printing', lessonSlug: 'python-io', lessonOrder: 0, estimatedMinutes: 30 },
  { sectionTitle: 'Input & Output', sectionOrder: 4, lessonTitle: 'F-Strings and String Formatting', lessonSlug: 'python-fstrings-formatting', lessonOrder: 1, estimatedMinutes: 25 },

  // ── Section 6: Conditional Statements ───────────────────────────────────────
  { sectionTitle: 'Conditional Statements', sectionOrder: 5, lessonTitle: 'Conditionals and Decision Making', lessonSlug: 'python-conditionals', lessonOrder: 0, estimatedMinutes: 30 },
  { sectionTitle: 'Conditional Statements', sectionOrder: 5, lessonTitle: 'Nested If and Match-Case', lessonSlug: 'python-nested-if-match', lessonOrder: 1, estimatedMinutes: 25 },

  // ── Section 7: Loops ─────────────────────────────────────────────────────────
  { sectionTitle: 'Loops', sectionOrder: 6, lessonTitle: 'Loops and Iteration Patterns', lessonSlug: 'python-loops', lessonOrder: 0, estimatedMinutes: 40 },
  { sectionTitle: 'Loops', sectionOrder: 6, lessonTitle: 'Break, Continue and Pass', lessonSlug: 'python-break-continue-pass', lessonOrder: 1, estimatedMinutes: 20 },
  { sectionTitle: 'Loops', sectionOrder: 6, lessonTitle: 'List Comprehensions', lessonSlug: 'python-list-comprehensions', lessonOrder: 2, estimatedMinutes: 25 },

  // ── Section 8: Functions ──────────────────────────────────────────────────────
  { sectionTitle: 'Functions', sectionOrder: 7, lessonTitle: 'Defining and Using Functions', lessonSlug: 'python-functions-basics', lessonOrder: 0, estimatedMinutes: 40 },
  { sectionTitle: 'Functions', sectionOrder: 7, lessonTitle: 'Arguments, Parameters and Defaults', lessonSlug: 'python-function-args', lessonOrder: 1, estimatedMinutes: 30 },
  { sectionTitle: 'Functions', sectionOrder: 7, lessonTitle: 'Lambda Functions', lessonSlug: 'python-lambda', lessonOrder: 2, estimatedMinutes: 20 },
  { sectionTitle: 'Functions', sectionOrder: 7, lessonTitle: 'Recursion', lessonSlug: 'python-recursion', lessonOrder: 3, estimatedMinutes: 30 },
  { sectionTitle: 'Functions', sectionOrder: 7, lessonTitle: 'Scope: Local, Global, Nonlocal', lessonSlug: 'python-scope', lessonOrder: 4, estimatedMinutes: 25 },

  // ── Section 9: Collections ────────────────────────────────────────────────────
  { sectionTitle: 'Collections (List, Tuple, Set, Dict)', sectionOrder: 8, lessonTitle: 'Lists and Tuples Deep Dive', lessonSlug: 'python-lists-tuples', lessonOrder: 0, estimatedMinutes: 45 },
  { sectionTitle: 'Collections (List, Tuple, Set, Dict)', sectionOrder: 8, lessonTitle: 'Dictionaries and Sets', lessonSlug: 'python-dicts-sets', lessonOrder: 1, estimatedMinutes: 45 },
  { sectionTitle: 'Collections (List, Tuple, Set, Dict)', sectionOrder: 8, lessonTitle: 'Collection Methods and Operations', lessonSlug: 'python-collection-methods', lessonOrder: 2, estimatedMinutes: 30 },

  // ── Section 10: Strings ───────────────────────────────────────────────────────
  { sectionTitle: 'Strings', sectionOrder: 9, lessonTitle: 'String Manipulation and Formatting', lessonSlug: 'python-strings', lessonOrder: 0, estimatedMinutes: 35 },
  { sectionTitle: 'Strings', sectionOrder: 9, lessonTitle: 'String Methods Reference', lessonSlug: 'python-string-methods', lessonOrder: 1, estimatedMinutes: 30 },
  { sectionTitle: 'Strings', sectionOrder: 9, lessonTitle: 'Regular Expressions Basics', lessonSlug: 'python-regex-basics', lessonOrder: 2, estimatedMinutes: 35 },

  // ── Section 11: File Handling ─────────────────────────────────────────────────
  { sectionTitle: 'File Handling', sectionOrder: 10, lessonTitle: 'Working with Files and Text I/O', lessonSlug: 'python-file-handling', lessonOrder: 0, estimatedMinutes: 40 },
  { sectionTitle: 'File Handling', sectionOrder: 10, lessonTitle: 'CSV and JSON File Processing', lessonSlug: 'python-csv-json', lessonOrder: 1, estimatedMinutes: 35 },
  { sectionTitle: 'File Handling', sectionOrder: 10, lessonTitle: 'Working with Paths (pathlib)', lessonSlug: 'python-pathlib', lessonOrder: 2, estimatedMinutes: 25 },

  // ── Section 12: Modules & Packages ───────────────────────────────────────────
  { sectionTitle: 'Modules & Packages', sectionOrder: 11, lessonTitle: 'Modules, Packages and the Import System', lessonSlug: 'python-modules-packages', lessonOrder: 0, estimatedMinutes: 30 },
  { sectionTitle: 'Modules & Packages', sectionOrder: 11, lessonTitle: 'Python Standard Library Tour', lessonSlug: 'python-stdlib-tour', lessonOrder: 1, estimatedMinutes: 40 },
  { sectionTitle: 'Modules & Packages', sectionOrder: 11, lessonTitle: 'PIP and Virtual Environments', lessonSlug: 'python-pip-venv', lessonOrder: 2, estimatedMinutes: 25 },

  // ── Section 13: Object Oriented Programming ──────────────────────────────────
  { sectionTitle: 'Object Oriented Programming', sectionOrder: 12, lessonTitle: 'Classes and OOP Basics', lessonSlug: 'python-oop-basics', lessonOrder: 0, estimatedMinutes: 45 },
  { sectionTitle: 'Object Oriented Programming', sectionOrder: 12, lessonTitle: 'Inheritance, Polymorphism and Dunder Methods', lessonSlug: 'python-oop-advanced', lessonOrder: 1, estimatedMinutes: 40 },
  { sectionTitle: 'Object Oriented Programming', sectionOrder: 12, lessonTitle: 'Encapsulation and Abstraction', lessonSlug: 'python-encapsulation-abstraction', lessonOrder: 2, estimatedMinutes: 35 },

  // ── Section 14: Exception Handling ───────────────────────────────────────────
  { sectionTitle: 'Exception Handling', sectionOrder: 13, lessonTitle: 'Errors, Exceptions and Context Managers', lessonSlug: 'python-exceptions', lessonOrder: 0, estimatedMinutes: 30 },
  { sectionTitle: 'Exception Handling', sectionOrder: 13, lessonTitle: 'Custom Exceptions and Best Practices', lessonSlug: 'python-custom-exceptions', lessonOrder: 1, estimatedMinutes: 25 },

  // ── Section 15: Advanced Python Concepts ─────────────────────────────────────
  { sectionTitle: 'Advanced Python Concepts', sectionOrder: 14, lessonTitle: 'Iterators, Generators and Comprehensions', lessonSlug: 'python-advanced-iter', lessonOrder: 0, estimatedMinutes: 40 },
  { sectionTitle: 'Advanced Python Concepts', sectionOrder: 14, lessonTitle: 'Decorators, Lambdas and Context Managers', lessonSlug: 'python-decorators-lambdas-cm', lessonOrder: 1, estimatedMinutes: 45 },
  { sectionTitle: 'Advanced Python Concepts', sectionOrder: 14, lessonTitle: 'Concurrency: Threading and Async', lessonSlug: 'python-concurrency', lessonOrder: 2, estimatedMinutes: 40 },

  // ── Section 16: Python Projects ───────────────────────────────────────────────
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Project #1 – Interactive CLI Todo App', lessonSlug: 'python-project-todo-cli', lessonOrder: 0, estimatedMinutes: 45 },
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Project #2 – Number Guessing Game', lessonSlug: 'python-project-guessing-game', lessonOrder: 1, estimatedMinutes: 40 },
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Project #3 – Password Generator', lessonSlug: 'python-project-password-gen', lessonOrder: 2, estimatedMinutes: 40 },
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Project #4 – Expense Tracker CSV', lessonSlug: 'python-project-expense-tracker', lessonOrder: 3, estimatedMinutes: 50 },
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Project #5 – Weather CLI App', lessonSlug: 'python-project-weather-cli', lessonOrder: 4, estimatedMinutes: 50 },
  { sectionTitle: 'Python Projects', sectionOrder: 15, lessonTitle: 'Python Interview Preparation', lessonSlug: 'python-interview-prep', lessonOrder: 5, estimatedMinutes: 60 },
]

export function getLessons(): LessonSeedData[] {
  const contentMap = loadContentMap()
  return PYTHON_LESSONS_COMPACT.map((l) => ({
    ...l,
    content: contentMap[l.lessonSlug] ?? placeholder(l.lessonTitle, l.sectionTitle),
  }))
}
