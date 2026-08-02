# CSE Platform — Problem Dataset

## Structure

```
datasets/
├── topics.json          — Problem categories/topics
├── companies.json       — Companies with metadata
├── tags.json            — Problem tags
└── problems/
    ├── arrays.json
    ├── strings.json
    ├── linked-list.json
    ├── trees.json
    ├── graphs.json
    ├── dynamic-programming.json
    ├── binary-search.json
    ├── stack.json
    ├── sliding-window.json
    ├── two-pointers.json
    ├── heap.json
    ├── backtracking.json
    ├── bit-manipulation.json
    └── math.json
```

## Problem Format

Each problem in a topic JSON file follows this schema:

```json
{
  "title": "Problem Title",
  "slug": "problem-slug",
  "difficulty": "EASY | MEDIUM | HARD",
  "topic": "category-slug",
  "statement": "Full problem statement (markdown supported)",
  "constraints": "Constraint list",
  "examples": [
    { "input": "...", "output": "...", "explanation": "optional" }
  ],
  "hints": ["hint 1", "hint 2"],
  "tags": ["Tag1", "Tag2"],
  "companies": ["Company1", "Company2"],
  "visibleTests": [
    { "input": "stdin format", "output": "expected stdout" }
  ],
  "hiddenTests": [
    { "input": "...", "output": "..." }
  ],
  "timeLimit": 2000,
  "memoryLimit": 256,
  "xp": 20,
  "estimatedTime": 30,
  "license": "ORIGINAL",
  "starterCode": {
    "python": "...",
    "javascript": "...",
    "java": "...",
    "cpp": "..."
  }
}
```

## Importing Problems

Use the dataset import script to bulk-import all problems:

```bash
# Import all problems from all topic files
npm run import:dataset

# Or import a single topic file
npx ts-node scripts/import-dataset.ts --file datasets/problems/arrays.json

# Or use the HTTP API (requires Manager/Admin auth)
POST /api/dataset-import/upload   # Upload JSON file
POST /api/dataset-import/json     # Import from JSON body
```

## Requirements per Problem

- Minimum 2 visible test cases
- Minimum 8 hidden test cases  
- At least one starter code template
- Non-empty title, statement, difficulty, topic
- Valid constraints and examples

## Test Case Format

Input/output format must match how programs read from stdin/stdout.
Each program reads input via stdin and writes output to stdout.
The judge compares trimmed stdout with expected output.
