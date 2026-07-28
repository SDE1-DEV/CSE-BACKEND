export interface LessonSeedData {
  sectionTitle: string
  sectionOrder: number
  lessonTitle: string
  lessonSlug: string
  lessonOrder: number
  estimatedMinutes: number
  content: string
}

const PYTHON_LESSONS: LessonSeedData[] = [
  {
    sectionTitle: 'Introduction',
    sectionOrder: 0,
    lessonTitle: 'About Python & This Roadmap',
    lessonSlug: 'python-about',
    lessonOrder: 0,
    estimatedMinutes: 35,
    content: `# About Python & This Roadmap

## Introduction

Welcome to the complete Python Programming roadmap! This lesson serves as your starting point — explaining what Python is, where it came from, what you can build with it, and how to get the most out of this learning journey.

## What is Python

Python is a **high-level, interpreted, general-purpose programming language** known for its clean, readable syntax and versatility. It was designed with an emphasis on code readability, using significant indentation (whitespace) instead of curly braces to define code blocks.

Python is often called a "batteries included" language because its standard library is extraordinarily rich — you can accomplish complex tasks without installing external packages.

## History

- **Conceived**: 1989 by **Guido van Rossum** at Centrum Wiskunde & Informatica (CWI) in the Netherlands
- **First released**: February 20, 1991 (Python 0.9.0)
- **Python 2.0**: October 16, 2000 — introduced list comprehensions, garbage collection
- **Python 3.0**: December 3, 2008 — major backward-incompatible redesign
- **Python 2 End-of-Life**: January 1, 2020 — only Python 3 is maintained today
- **Current**: Python 3.x — actively developed with annual feature releases

The name "Python" comes from the British comedy series *Monty Python's Flying Circus*, not the snake.

## Applications

Python is used across virtually every industry:

| Domain | Examples |
|---|---|
| **Web Development** | Django, Flask, FastAPI backends |
| **Data Science / ML** | Pandas, NumPy, TensorFlow, PyTorch, scikit-learn |
| **Automation & Scripting** | DevOps pipelines, file processing, web scraping |
| **Scientific Computing** | SciPy, Matplotlib, AstroPy, BioPython |
| **Desktop GUIs** | PyQt, Tkinter, Kivy |
| **Game Development** | Pygame, Godot (GDScript is Python-like) |
| **Cybersecurity** | Pen-testing scripts, analysis tools |
| **Finance** | Algorithmic trading, risk analysis |
| **IoT / Embedded** | MicroPython, CircuitPython |
| **Education** | Most universities teach intro CS in Python |

## Advantages

1. **Beginner-friendly**: Syntax reads like English. Low barrier to entry.
2. **Huge ecosystem**: 400,000+ packages on PyPI. Solutions exist for nearly every problem.
3. **Cross-platform**: Same code runs on Windows, macOS, Linux, and more.
4. **Strong community**: Stack Overflow answers, tutorials, conferences, open-source contributors.
5. **Fast development**: Write less code. Prototype and iterate quickly.
6. **Enterprise adoption**: Used at Google, Meta, Netflix, Dropbox, Spotify, NASA, Reddit, and more.
7. **Multi-paradigm**: Supports procedural, object-oriented, and functional styles.

## Career Opportunities

- **Junior Python Developer** — Entry-level backend or automation roles (₹3–7 LPA in India / $70k–110k USA)
- **Data Analyst** — Pandas + SQL + BI dashboards
- **Machine Learning Engineer** — PyTorch/TensorFlow + model deployment
- **Backend Engineer** — Django/FastAPI + databases + microservices
- **DevOps Engineer** — Automation, CI/CD, infrastructure as code
- **QA Automation Engineer** — pytest, Selenium, test frameworks
- **Research Scientist** — Academia or industrial R&D
- **Freelance / Consultant** — Build custom tools and data pipelines

## Prerequisites

- **No prior programming experience required**. This roadmap starts from zero.
- A computer (Windows, macOS, or Linux) with internet access.
- Curiosity and patience — concepts build on each other.
- ~6–10 hours per week recommended to complete the full roadmap in ~3 months.

## How to Use This Roadmap

1. Go **section by section, lesson by lesson** — don't skip.
2. **Type every code example yourself**. Reading ≠ doing.
3. Solve the **Practice Questions** before checking answers.
4. Take the **Quiz** at the end of each lesson.
5. Build the **Projects** at the end — they cement everything.
6. Use the **Bookmarks** feature to save lessons you want to revisit.
7. Write private **Notes** on lessons to store your own insights and snippets.

---

## Real World Example

Netflix uses Python extensively:
- Backend services powering recommendation algorithms
- Media encoding pipelines
- Chaos engineering (simulating failures to test resilience)
- Security automation and vulnerability scanning

Dropbox wrote their desktop client backend largely in Python. Python handles the file synchronization logic for 700+ million users.

## Code Example

\`\`\`python
# Your very first Python program — the classic "Hello, World!"
print("Hello, Python!")
print("Welcome to your learning journey 🚀")

name = "Future Python Dev"
age = 21
print(f"I am {name}, and I'll master Python in {age * 2} days of practice!")
\`\`\`

**Output:**
\`\`\`
Hello, Python!
Welcome to your learning journey 🚀
I am Future Python Dev, and I'll master Python in 42 days of practice!
\`\`\`

## Best Practices

- Install Python 3.10 or newer (never Python 2).
- Use a code editor: VS Code (free) or PyCharm Community (free) are excellent choices.
- Create a dedicated folder for all your Python practice code.
- Save each program with a descriptive filename like \`01_hello.py\`.
- Run code often — test small pieces before building larger programs.
- Read error messages carefully. Python errors are descriptive and tell you the line number.
- Comment your code early on. Over-comment until good style becomes instinct.

## Common Mistakes

- **Installing Python 2 by mistake**. Always verify with \`python --version\` or \`python3 --version\`.
- **Skipping the basics** to "get to the cool AI stuff" — fundamentals compound.
- **Copy-pasting code without typing it**. Muscle memory matters.
- **Not running examples**. If a lesson has 3 examples, run all 3.
- **Giving up after the first error**. Bugs are normal — they *are* the learning process.
- **Comparing yourself to others**. Everyone learns at a different pace.

## Summary

Python is a beginner-friendly, versatile, and in-demand language used by every major tech company. This roadmap will take you from "I've never coded" through variables, functions, OOP, file handling, advanced concepts, and real projects. By the end, you'll have the skills to build real applications and confidently apply for Python developer roles. Enjoy the ride!

---
### Practice Questions

1. **Q**: Who created Python, and in what year was the first version released?
   **A**: Guido van Rossum created Python, with the first public release (0.9.0) in February 1991.

2. **Q**: What does "batteries included" mean in the context of Python?
   **A**: It refers to Python's large and comprehensive standard library, which provides modules for many common tasks (file I/O, networking, math, regex, etc.) without needing external packages.

3. **Q**: Name three industries or domains where Python is heavily used.
   **A**: Any three of: Web Development, Data Science/Machine Learning, Automation/Scripting, Scientific Computing, Desktop GUIs, Game Development, Cybersecurity, Finance, IoT/Embedded, Education.

4. **Q**: When did Python 2 reach End-of-Life, and what should you use instead?
   **A**: Python 2 reached EOL on January 1, 2020. All new code should use Python 3 (preferably 3.10+).

5. **Q**: What is the name of the official Python package repository with 400k+ packages?
   **A**: PyPI (Python Package Index), accessed via the \`pip\` command.

6. **Q**: What syntax feature makes Python famous for readability compared to languages like C++ or JavaScript?
   **A**: Significant indentation (whitespace) to delimit code blocks, instead of curly braces \`{}\`.

---
### Quiz (MCQ)

1. **Python was created by:**
   A) James Gosling
   B) Guido van Rossum
   C) Dennis Ritchie
   D) Bjarne Stroustrup
   **Correct: B**

2. **Which of these is NOT a typical Python use case?**
   A) Web backend APIs
   B) Machine learning
   C) Operating system kernel development
   D) Data analysis
   **Correct: C**

3. **Python's name was inspired by:**
   A) The snake species
   B) Monty Python's Flying Circus
   C) The Greek mythological deity
   D) Python Software Foundation acronym
   **Correct: B**

4. **What is the current major supported version series as of this roadmap?**
   A) Python 1
   B) Python 2
   C) Python 3
   D) Python 4
   **Correct: C**

5. **The standard command to install packages from PyPI is:**
   A) \`npm install\`
   B) \`pip install\`
   C) \`gem install\`
   D) \`apt get\`
   **Correct: B**

6. **"Hello World" in Python is written as:**
   A) \`console.log("Hello World")\`
   B) \`echo "Hello World"\`
   C) \`print("Hello World")\`
   D) \`System.out.println("Hello World")\`
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Programming Basics',
    sectionOrder: 1,
    lessonTitle: 'How Programming Works',
    lessonSlug: 'python-programming-basics',
    lessonOrder: 0,
    estimatedMinutes: 25,
    content: `# How Programming Works

## Introduction

Before writing more Python, it helps to understand *what* a program actually *is* and *how* a computer runs it. This lesson covers the fundamental ideas shared by all programming languages: code → interpreter/machine → execution.

## Definition

**Programming** is the act of writing a precise sequence of instructions (a *program*) that a computer can execute to perform a specific task.

A **Python program** is a plain-text file (ending in \`.py\`) containing statements written according to Python's syntax rules. When you "run" it, the Python interpreter reads each line top-to-bottom, translates it to CPU instructions, and executes them.

## Why it exists

Computers only understand machine code — sequences of binary 0s and 1s specific to a CPU architecture. Writing machine code directly is humanly impossible for real applications. Programming languages (like Python) provide an abstraction layer:

- Humans write **readable, expressive code**.
- The **interpreter / compiler** translates it to machine code automatically.

This is the fundamental productivity multiplier of software engineering.

## How it works

The flow for running a Python script:

1. **Source code** (\`hello.py\`) is written in plain text.
2. **CPython (the standard interpreter)** parses the code into an **Abstract Syntax Tree (AST)**.
3. AST is compiled into **bytecode** (\`__pycache__/\`), a platform-agnostic intermediate representation.
4. The **Python Virtual Machine (PVM)** executes bytecode line by line.
5. The operating system and CPU perform the actual computations (math, memory, I/O).

This interpretation step is why Python is slower than compiled languages (C/C++/Rust) for tight loops — and why Python typically *calls into C extensions* (NumPy, TensorFlow) when performance matters.

## Syntax

Python code is executed **top-to-bottom, one statement at a time**. A *statement* is roughly "one line that does something."

\`\`\`python
# This is a comment. Python ignores lines starting with #.
# Comments are for humans reading your code later.

x = 5          # Assignment statement
y = x + 3      # Expression + assignment
print(y)       # Function call (outputs to console)
\`\`\`

Key syntax rules:
- **Statements are separated by newlines**, not semicolons (though \`;\` is allowed for two statements on one line).
- **Indentation is significant**: code blocks (loops, conditionals, functions) use 4 spaces by convention.
- **Case-sensitive**: \`Variable\` ≠ \`variable\`.
- **Identifiers** (variable/function names) must start with a letter or \`_\`, then letters/digits/underscores.

## Real World Example

Imagine a "Payroll" program:

1. It reads employee hours from a CSV file.
2. It multiplies hours × hourly rate to compute gross pay.
3. It subtracts taxes and deductions.
4. It writes pay stubs to a PDF.
5. It logs everything to a database.

Each of these steps is implemented as Python statements. The interpreter runs them in order. If any step fails (file not found, bad data), the program raises an error — unless the developer wrote exception handling (covered later).

## Code Example

\`\`\`python
# Example 1: A tiny "calculator" program — sequential execution
print("=== Simple Calculator ===")
a = 10
b = 3
print(f"{a} + {b} = {a + b}")
print(f"{a} - {b} = {a - b}")
print(f"{a} * {b} = {a * b}")
print(f"{a} / {b} = {a / b:.2f}")
\`\`\`

**Output:**
\`\`\`
=== Simple Calculator ===
10 + 3 = 13
10 - 3 = 7
10 * 3 = 30
10 / 3 = 3.33
\`\`\`

\`\`\`python
# Example 2: Demonstrating execution order
step = 1
print(f"Step {step}: Program starts here")
step += 1
print(f"Step {step}: Second line runs")
step += 1
print(f"Step {step}: Third line runs")
step += 1
print(f"Step {step}: Done")
\`\`\`

**Output:**
\`\`\`
Step 1: Program starts here
Step 2: Second line runs
Step 3: Third line runs
Step 4: Done
\`\`\`

\`\`\`python
# Example 3: Comments are completely ignored by the interpreter
# print("This won't run — it's inside a comment")
print("But this WILL run")  # and this trailing comment is also ignored
\`\`\`

**Output:**
\`\`\`
But this WILL run
\`\`\`

## Best Practices

- End every \`.py\` file with a **single blank newline** (POSIX convention).
- Write **comments that explain *why*, not *what***. The code already shows *what*.
- Keep lines under ~88 characters (PEP 8 recommendation). Use a linter/formatter.
- Organize longer programs with **blank lines** between logical "paragraphs" of code.
- Give files **snake_case lowercase names** (\`payroll_calc.py\`, not \`PayrollCalc.py\`).
- Save often. Use Git or any backup system — losing code is painful.
- Read the official **PEP 8 — Style Guide for Python Code** at some point (don't memorize day 1).

## Common Mistakes

- **Forgetting indentation inside blocks** or using a mix of tabs and spaces. Python 3 disallows mixing.
- **Capitalizing keywords or built-ins** (\`Print()\` instead of \`print()\`).
- **Missing parentheses on function calls**: \`print\` returns the function object; \`print()\` actually calls it.
- **Running the wrong file** or a file saved in the wrong folder — double-check your terminal's working directory.
- **Infinite loops** early on — Ctrl+C (or Cmd+C) will stop a stuck Python process.
- **Ignoring errors**. Read them: "SyntaxError: invalid syntax" with a \`^\` caret pointing to the issue.

## Summary

A program is a sequence of human-readable instructions. The Python interpreter converts your \`.py\` file through AST → bytecode → PVM execution. Python reads code top-to-bottom. Clean style, comments, and understanding the execution model will save you hours of debugging. These basics apply to every language you'll ever learn.

---
### Practice Questions

1. **Q**: What does Python produce as an intermediate representation before running bytecode?
   **A**: An Abstract Syntax Tree (AST), which is then compiled to bytecode run by the Python Virtual Machine (PVM).

2. **Q**: Why don't programmers write directly in machine code?
   **A**: Machine code is architecture-specific binary (0s and 1s). It's extraordinarily tedious, error-prone, and unmaintainable for any real application.

3. **Q**: How does Python delimit code blocks, unlike C++ or Java?
   **A**: Python uses significant indentation (typically 4 spaces). Curly braces are not used for blocks.

4. **Q**: What command stops a running Python program from the terminal?
   **A**: Ctrl+C (or Cmd+C on macOS) sends a SIGINT signal that terminates the process.

5. **Q**: What is the conventional file extension for Python source files?
   **A**: \`.py\`. Compiled bytecode lives in \`.pyc\` files under \`__pycache__/\`.

---
### Quiz (MCQ)

1. **Python execution order is:**
   A) Bottom to top
   B) Top to bottom
   C) Random order
   D) Parallel across all CPU cores
   **Correct: B**

2. **Which is the correct way to write a comment in Python?**
   A) \`// comment\`
   B) \`/* comment */\`
   C) \`# comment\`
   D) \`-- comment\`
   **Correct: C**

3. **The intermediate format CPython compiles to is called:**
   A) Assembly
   B) Bytecode
   C) LLVM IR
   D) Machine code
   **Correct: B**

4. **Which file extension is standard for Python source code?**
   A) \`.java\`
   B) \`.py\`
   C) \`.cpp\`
   D) \`.js\`
   **Correct: B**

5. **PEP 8 recommends how many spaces per indentation level?**
   A) 2
   B) 4
   C) 6
   D) 8
   **Correct: B**

6. **Python 3 will error if you:**
   A) Use spaces for indentation
   B) Mix tabs and spaces for indentation
   C) End a file with a blank line
   D) Write comments longer than 80 chars
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Variables & Data Types',
    sectionOrder: 2,
    lessonTitle: 'Python Variables & Data Types',
    lessonSlug: 'python-variables-data-types',
    lessonOrder: 0,
    estimatedMinutes: 40,
    content: `# Variables & Data Types in Python

## Introduction

Variables are how programs store and manipulate information. Python gives you several built-in data types for different kinds of values: text, whole numbers, decimals, true/false flags, and special "empty" values. Together these form the building blocks of every Python program.

## Definition

A **variable** is a named reference to a value stored in the computer's memory. You assign a value to a variable with the \`=\` operator:

\`\`\`python
age = 21
\`\`\`

Python is **dynamically typed**: you do not declare the type upfront. The interpreter infers it at runtime, and the same variable can be reassigned to values of different types.

Python's core built-in data types:

| Category | Type | Example | Notes |
|---|---|---|---|
| Numeric | \`int\` | \`42\`, \`-7\` | Unlimited precision integers |
| Numeric | \`float\` | \`3.14\`, \`1e5\` | 64-bit IEEE double-precision |
| Numeric | \`complex\` | \`3 + 4j\` | Imaginary numbers |
| Text | \`str\` | \`"hello"\`, \`'world'\` | Unicode strings, immutable |
| Boolean | \`bool\` | \`True\`, \`False\` | Subclass of \`int\` (1/0) |
| Empty | \`NoneType\` | \`None\` | Represents "no value" |

## Why it exists

Programs model the real world. Different operations require different representations:
- You need **integers** for counts, IDs, array indexes.
- You need **floats** for measurements, money (though use \`Decimal\` for production finance!).
- You need **strings** for names, text content, messages.
- You need **booleans** for conditional logic.
- You need **None** when a variable legitimately has no value yet.

Without a type system, Python couldn't decide which operations are valid (adding two numbers works; adding a number and a string doesn't).

## How it works

When you write \`age = 21\`:

1. Python creates an **integer object** with value \`21\` somewhere in memory.
2. It creates (or re-assigns) the **name** \`age\` in the current scope.
3. That name points to the integer object.

Because everything in Python is an object, you may see \`id(age)\` change when you re-assign or mutate values. Mutable types (lists, dicts, sets) can be changed in place. Immutable types (int, str, bool, tuple) create new objects on every change.

**Multiple assignment, swapping, and unpacking** make Python famously concise:
\`\`\`python
a, b = 1, 2           # assign two at once
a, b = b, a           # swap values — no temp variable needed!
x = y = z = 0         # all three point to the same 0
\`\`\`

## Syntax

\`\`\`python
# ── Integers ─────────────────────────────────────
age = 30
population = 8_000_000_000   # underscores improve readability
big_int = 2 ** 100           # arbitrary precision — no overflow!

# ── Floats ───────────────────────────────────────
pi = 3.14159
avogadro = 6.022e23          # 6.022 × 10²³ scientific notation

# ── Strings ──────────────────────────────────────
single = 'apostrophes work'
double = "so do quotes — pick one and be consistent"
multi = """Triple quotes
span multiple
lines"""

# ── Booleans ─────────────────────────────────────
is_active = True
is_banned = False

# ── None ─────────────────────────────────────────
no_value_yet = None

# ── Inspecting types ─────────────────────────────
print(type(age))        # <class 'int'>
print(type(pi))         # <class 'float'>
print(type(is_active))  # <class 'bool'>

# ── Explicit type conversion (casting) ───────────
num_str = "42"
num_int = int(num_str)      # 42
num_float = float(num_str)  # 42.0
back_to_str = str(num_int)  # "42"
truthy = bool(1)            # True
falsy = bool(0)             # False
\`\`\`

## Real World Example

A user profile in a web app might be represented with variables:
\`\`\`python
username = "alice_dev"
age = 26
height_m = 1.68
is_verified = True
bio = None   # user hasn't written a bio yet
balance_cents = 12500  # integers for money avoid float rounding errors
\`\`\`

Storing money as integer cents (e.g., 12500 = $125.00) is a best practice because \`float\` addition like \`0.1 + 0.2\` produces floating-point rounding artifacts (\`0.30000000000000004\`).

## Code Example

\`\`\`python
# Example 1: Basic variable usage and dynamic typing
name = "Ada Lovelace"
birth_year = 1815
is_genius = True

print(f"{name} was born in {birth_year}.")
print(f"Genius level: {is_genius}")
print(f"name is a {type(name).__name__}")
print(f"birth_year is a {type(birth_year).__name__}")
print(f"is_genius is a {type(is_genius).__name__}")
\`\`\`

**Output:**
\`\`\`
Ada Lovelace was born in 1815.
Genius level: True
name is a str
birth_year is a int
is_genius is a bool
\`\`\`

\`\`\`python
# Example 2: Type conversion and arithmetic
price_str = "29.99"
tax_rate = 0.08

price = float(price_str)
total = price * (1 + tax_rate)
print(f"Total: ${total:.2f}")

# Numeric coercion: int / bool are compatible in math
items_ordered = 3
discounted = True
final_count = items_ordered - discounted  # True == 1 in numeric context
print(f"Items after discount rule: {final_count}")
\`\`\`

**Output:**
\`\`\`
Total: $32.39
Items after discount rule: 2
\`\`\`

\`\`\`python
# Example 3: None and boolean evaluation
user_preference = None
print("Preference set?" , user_preference is not None)  # False

# Falsy values in Python: 0, 0.0, "", [], {}, (), set(), None, False
# Everything else is truthy
print(bool(""), bool(0), bool(None))    # False False False
print(bool("hi"), bool(42), bool([1]))  # True  True  True
\`\`\`

**Output:**
\`\`\`
Preference set? False
False False False
True True True
\`\`\`

## Best Practices

- Use **descriptive, lowercase snake_case names**: \`user_age\`, not \`UAge\` or \`u\`.
- **Never use \`l\` (lowercase L) or \`O\` (uppercase O)** as single-char variable names — they look like \`1\` and \`0\`.
- Avoid **shadowing built-ins**: don't name a variable \`list\`, \`str\`, \`print\`, \`type\`, \`min\`, \`max\`, etc.
- Use **\`is\` for \`None\` checks** (\`x is None\` or \`x is not None\`), not equality.
- Represent **money as integers in cents** or use the standard library's \`decimal.Decimal\`.
- For complex structured data, use **data classes, typed dictionaries, or Pydantic models** instead of a jumble of loose variables.
- Keep variable **scope as small as possible**. Don't create globals unless necessary.

## Common Mistakes

- **\`=\` vs \`==\`**: assignment (\`=\`) vs equality comparison (\`==\`). This is the #1 early bug.
- **Integer division confusion**: in Python 3, \`7 / 2\` returns the \`float\` \`3.5\`. Use \`7 // 2\` (floor division) for an \`int\`.
- **Off-by-one float errors** with money. Prefer integer cents or \`Decimal\`.
- **Confusing \`str()\` with \`repr()\`**: \`str()\` is for humans; \`repr()\` is for debugging/parsing ambiguity.
- **Mutable default arguments**: \`def f(x=[]): ...\` shares one list across all calls — use \`None\` as default and initialize inside.
- **Re-assigning a variable and then being surprised old references didn't update**. Remember: variables are *names*, not *boxes*.

## Summary

Variables are named references to values. Python has a rich, dynamically-typed type system: integers, floats, strings, booleans, and None are the atomic types. You can inspect types with \`type()\` and convert between them with \`int()\`, \`float()\`, \`str()\`, \`bool()\`. Good naming and type discipline produce readable, maintainable code. These fundamentals underpin every lesson ahead.

---
### Practice Questions

1. **Q**: What will \`type(5.0)\` return?
   **A**: \`<class 'float'>\` — the type of floating-point numbers.

2. **Q**: What is the difference between \`=\` and \`==\`?
   **A**: \`=\` is the assignment operator (stores a value in a variable). \`==\` is the equality comparison operator (returns True/False if two values are equal).

3. **Q**: In Python 3, what is the result of \`10 / 3\` and what type is it?
   **A**: \`3.3333333333333335\` of type \`float\`. Use integer division \`10 // 3\` to get \`3\` as an \`int\`.

4. **Q**: List at least five values that are considered "falsy" in Python.
   **A**: \`False\`, \`None\`, \`0\`, \`0.0\`, \`0j\`, \`""\` (empty string), \`[]\`, \`()\`, \`{}\`, \`set()\`, and objects with custom \`__bool__\` returning False.

5. **Q**: Why should financial amounts generally NOT be stored as \`float\`?
   **A**: Binary floats cannot exactly represent most decimal fractions (e.g., \`0.1 + 0.2 ≠ 0.3\`), causing cumulative rounding errors. Use integer cents or \`decimal.Decimal\` instead.

6. **Q**: How do you check if a variable \`x\` is \`None\` correctly?
   **A**: With the identity operator: \`if x is None:\`. Avoid \`if x == None:\` which can be fooled by objects with overloaded equality.

---
### Quiz (MCQ)

1. **Which assigns the value 5 to variable \`x\`?**
   A) \`x == 5\`
   B) \`x = 5\`
   C) \`5 = x\`
   D) \`x <- 5\`
   **Correct: B**

2. **Result of \`7 // 2\` in Python 3 is:**
   A) 3.5
   B) 3
   C) 4
   D) 2
   **Correct: B**

3. **Which is falsy in Python?**
   A) \`1\`
   B) \`"0"\`
   C) \`[]\`
   D) \`[0]\`
   **Correct: C**

4. **Correct way to check \`x\` is \`None\`:**
   A) \`x == None\`
   B) \`x = None\`
   C) \`x is None\`
   D) \`None is x not\`
   **Correct: C**

5. **Which variable name follows PEP 8 conventions?**
   A) \`userAge\`
   B) \`UserAge\`
   C) \`user_age\`
   D) \`user-age\`
   **Correct: C**

6. **\`str(42) + str(8)\` produces:**
   A) \`50\`
   B) \`"50"\`
   C) \`"428"\`
   D) Error
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Operators',
    sectionOrder: 3,
    lessonOrder: 0,
    title: 'Python Operators Deep Dive',
    slug: 'python-operators',
    estimatedMinutes: 35,
    content: `## Introduction

Operators are special symbols that tell the interpreter to perform computations on values (operands). Python supports a rich operator vocabulary — from basic arithmetic to bitwise tricks — and knowing exactly how each one behaves and interacts with different types is essential for writing correct, concise code.

## Definition

An **operator** is a lexical token that performs an operation on one, two, or three operands and yields a value, assigns a value, or compares values. Operators are built into the language itself.

## Why It Exists

Without operators we would be stuck calling long-winded functions like \`add(3, multiply(4, 5))\` for even the simplest math. Operators provide familiar, compact syntax for the most common computations programmers need every day — arithmetic, text concatenation, logic, comparison, bit manipulation, membership testing, and identity checks.

## How It Works

The Python interpreter parses expressions according to a fixed **operator precedence** table (highest first: parentheses → exponentiation → unary → multiply/divide/floor/mod → add/subtract → bit shifts → bitwise AND/XOR/OR → comparisons → boolean \`not\` → \`and\` → \`or\` → conditional/assignment). When operators have the same precedence they are evaluated left-to-right, *except* exponentiation which is right-to-left. Comparison operators can be **chained** (\`a < b <= c\`) — a major Python convenience.

## Syntax

\`\`\`python
# Arithmetic
x, y = 10, 3
print(x + y, x - y, x * y, x / y, x // y, x % y, x ** y)
#       13    7     30    3.333 3      1      1000

# Assignment shortcuts
a = 5
a += 2; a -= 1; a *= 3; a /= 4
print(a)  # 4.5

# Comparison
print(1 < 2 <= 3, 1.0 == 1, 5 is not None, 'Py' in 'Python')
# True True True True

# Boolean: short-circuit
print(True and 'reached' or 'skipped')  # reached

# Walrus (Python 3.8+) – assignment inside an expression
while (n := int(input('n: '))) != 0:
    print(f'doubled: {n * 2}')
\`\`\`

## Real World Example

Shipping cost calculators combine many operators. A discount is computed from boolean conditions, a total from arithmetic, and a free-shipping flag from a chained comparison:

\`\`\`python
CART_SUBTOTAL = 180
IS_MEMBER = True
SHIPPING_ZONE = 'IN'
tax_rate = 0.18 if SHIPPING_ZONE == 'IN' else 0

discount = 0.15 if (CART_SUBTOTAL >= 100 and IS_MEMBER) else 0.0
discounted = CART_SUBTOTAL * (1 - discount)
shipping = 0 if discounted >= 200 else 10
total = discounted * (1 + tax_rate) + shipping
print(f'Pay: Rs. {total:.2f}, shipping: {shipping}')  # Pay: Rs. 182.04, shipping: 10
\`\`\`

## Code Examples

### Example 1 – Chained comparisons vs explicit \`and\`

\`\`\`python
age = 22
# Idiomatic Python
if 18 <= age < 65:
    print('Adult ticket')
# Equivalent verbose form
if age >= 18 and age < 65:
    print('Adult ticket (verbose)')
# Adult ticket
# Adult ticket (verbose)
\`\`\`

### Example 2 – Boolean short-circuiting and defaults

\`\`\`python
def greet(name=None):
    greeting = name or 'stranger'       # "or" returns first truthy value
    print(f'Hello, {greeting}')

greet('Ada')    # Hello, Ada
greet()         # Hello, stranger

def head(xs):
    return xs and xs[0]                 # None-safe "pluck first element"

print(head([10, 20]))  # 10
print(head(None))      # None
\`\`\`

### Example 3 – Bitwise operators for permission flags

\`\`\`python
READ, WRITE, EXECUTE = 1, 2, 4
perms = READ | WRITE                    # 3 – combine with OR
print(bin(perms))                       # 0b11
print(bool(perms & EXECUTE))            # False – test with AND
perms |= EXECUTE                        # grant EXECUTE
print(perms == READ | WRITE | EXECUTE)  # True
perms &= ~WRITE                         # revoke WRITE
print(perms == READ | EXECUTE)          # True
\`\`\`

## Best Practices

- **Use parentheses to make precedence explicit** in non-obvious expressions. The reader should not have to consult a PEMDAS cheat-sheet.
- **Chain comparisons** (\`0 <= x < 10\`) instead of combining two with \`and\` — it's shorter and avoids evaluating the middle operand twice.
- **Prefer \`is\` / \`is not\` for singleton comparisons** (e.g., \`None\`, \`True\`, \`False\`). Use \`==\` for comparing *values*.
- **Use augmented assignment** (\`+=, *=, //=\`, etc.) — it's concise and, for mutable types in place, may avoid a redundant allocation.
- **Treat \`and\` / \`or\` as short-circuit control flow**, not just boolean operators. \`config.get('key') or default\` is idiomatic, but remember *all* falsy values trigger the default.
- **Be aware that \`+\` is overloaded**: numbers add, sequences concatenate. Mixing types raises \`TypeError\` — convert explicitly first.

## Common Mistakes

- **Using a single \`=\` inside a condition** (\`if x = 5:\` is a \`SyntaxError\`). Use \`==\` — or the walrus \`:=\` if you actually need assignment.
- **Confusing \`is\` with \`==\`**. \`'a' is 'a'\` may be True (interning) but is never the right check for value equality.
- **Integer division with negative numbers**: \`-7 // 3 = -3\` (floor, not truncate toward zero). Newcomers often expect \`-2\`.
- **Modulo surprises with negatives**: Python's \`%\` always has the same *sign* as the divisor, so \`-7 % 3\` is \`2\`, not \`-1\`.
- **Boolean operators don't return booleans when used with arbitrary types**. \`0 or 5\` returns \`5\`, \`5 and 0\` returns \`0\`. Code that assumes \`bool\` output will break.
- **Modifying a list with \`+= \` vs \`= list + ...\`**: \`+= \` mutates in place; \`= ... + ...\` re-binds. If another name aliases the list the behavior differs wildly.

## Summary

Python's operators span arithmetic, assignment, comparison, boolean logic, bit manipulation, identity, and membership. They are evaluated according to strict precedence rules that you should know — and when in doubt, parenthesize. Chain comparisons for readability. Use \`is\` for singletons like \`None\` and \`==\` for values. Remember that \`and\` / \`or\` short-circuit and return the decisive operand rather than a strict \`bool\`. A firm grasp of these tiny symbols eliminates a whole class of everyday bugs.

---
### Practice Questions

1. **Q**: What does \`3 ** 2 * 2\` evaluate to?
   **A**: 18 — exponentiation is higher precedence than multiplication: \`(3**2) * 2 = 9 * 2 = 18\`.

2. **Q**: Evaluate \`5 & 3\` (bitwise AND) in binary.
   **A**: \`0b101 & 0b011 = 0b001\` which equals \`1\`.

3. **Q**: What is the result of \`-11 // 2\`?
   **A**: \`-6\`. Floor division always rounds down (toward -∞), not toward zero.

4. **Q**: When should you use \`is None\` instead of \`== None\`?
   **A**: Always. \`is\` checks object identity and cannot be overloaded, so it is the correct, unambiguous check for the singleton \`None\`.

5. **Q**: Why does \`[] or 'default'\` return \`'default'\`?
   **A**: Because the empty list is falsy and \`or\` short-circuits on the first truthy value. When the left operand is falsy, it returns the right operand.

6. **Q**: What does the walrus operator \`:=\` do?
   **A**: It assigns a value to a variable **as part of a larger expression**, e.g., \`while (line := f.readline()):\` — removes the need for a separate priming read.

---
### Quiz (MCQ)

1. **Result of \`8 // 3\` is:**
   A) 2.666
   B) 2
   C) 3
   D) \`SyntaxError\`
   **Correct: B**

2. **Which check is the *correct* way to test if \`x\` is the singleton \`None\`?**
   A) \`x == None\`
   B) \`x = None\`
   C) \`x is None\`
   D) \`not x\`
   **Correct: C**

3. **\`True and False or True\` evaluates to:**
   A) True
   B) False
   C) None
   D) Error
   **Correct: A** (same as \`(True and False) or True\`)

4. **Which operator performs integer division rounding toward -∞?**
   A) \`/\`
   B) \`//\`
   C) \`%\`
   D) \`\\\\\`
   **Correct: B**

5. **Python comparison chaining means \`1 < 2 < 3\` is equivalent to:**
   A) \`(1 < 2) < 3\`
   B) \`1 < (2 < 3)\`
   C) \`1 < 2 and 2 < 3\`
   D) \`1 < 2 or 2 < 3\`
   **Correct: C**

6. **\`0 or 7 or 'x'\` returns:**
   A) 0
   B) 7
   C) \`'x'\`
   D) True
   **Correct: B** (short-circuits on the first truthy value)
`,
  },
  {
    sectionTitle: 'Input & Output',
    sectionOrder: 4,
    lessonOrder: 0,
    title: 'Input / Output and Formatted Printing',
    slug: 'python-io',
    estimatedMinutes: 30,
    content: `## Introduction

Every useful program communicates with the outside world. Python's standard I/O model — reading from stdin with \`input()\`, writing to stdout with \`print()\`, and formatting strings with f-strings — is deliberately simple. Mastering these few tools lets you build interactive scripts, data pipelines, and clean reporting output.

## Definition

**I/O (Input / Output)** refers to the flow of data between a program and its environment: the console, files, the network, or another program. In the narrow console sense, \`input(prompt)\` reads a line from standard input as a string, and \`print(value, ...)\` writes text to standard output.

## Why It Exists

Human-friendly I/O is the whole point of scripting languages. You need prompts so users know what to type, formatted output so results are readable, and string interpolation so code like \`print(f"User {name} scored {score}%")\` stays readable instead of being littered with \`+ ' ' +\` concatenation.

## How It Works

\`input()\` blocks until the user presses Enter, strips the trailing newline, and **always returns a string** — even if the user typed a number. To get numeric input you must \`int()\` or \`float()\` the result, and handle \`ValueError\` for malformed entries.

\`print()\` stringifies each positional argument with \`str()\`, joins them using the \`sep=' '\` keyword argument, then appends \`end='\\n'\`. You can redirect \`file=\` to any object with a \`write()\` method (files, \`sys.stderr\`, \`io.StringIO\`), and disable buffering with \`flush=True\`.

String formatting has three options (newest first, most recommended first): **f-strings** (\`f\"...{expr:...format}\"\`), \`str.format()\`, and the legacy \`%\` printf-style operator.

## Syntax

\`\`\`python
name = input('What is your name? ')
age = int(input('How old are you? '))
height = float(input('Height (m)? '))

# f-string — idiomatic since Python 3.6
print(f'{name} is {age} years old, height {height:.2f}m')
# Alignments
for label, val in [('AAPL', 172.4), ('MSFT', 410.12), ('GOOGL', 138.9)]:
    print(f'{label:6s} ${val:>8.2f}')
# AAPL   $  172.40
# MSFT   $  410.12
# GOOGL  $  138.90
\`\`\`

## Real World Example

A password-strength prompt that keeps looping until the user supplies something valid:

\`\`\`python
while True:
    pwd = input('Create a strong password (min 8 chars, 1 digit): ')
    if len(pwd) < 8 or not any(c.isdigit() for c in pwd):
        print('❌ Too weak, try again.')
        continue
    confirm = input('Re-type to confirm: ')
    if confirm != pwd:
        print('❌ Passwords do not match, starting over.')
        continue
    print('✅ Password saved!')
    break
\`\`\`

## Code Examples

### Example 1 – Conversion failure handling

\`\`\`python
def read_int(prompt):
    while True:
        raw = input(prompt)
        try:
            return int(raw)
        except ValueError:
            print(f'  \"{raw}\" is not an integer. Please retry.')

n = read_int('Enter an integer: ')
print(f'Double of {n} is {2 * n}.')
# Enter an integer: five
#   "five" is not an integer. Please retry.
# Enter an integer: 21
# Double of 21 is 42.
\`\`\`

### Example 2 – Custom \`sep\`, \`end\` and printing to stderr

\`\`\`python
import sys
print('a', 'b', 'c', sep=' → ', end=' ⏎\\n')           # a → b → c ⏎
print('ERROR: disk full', file=sys.stderr, flush=True)  # (printed on stderr)
\`\`\`

### Example 3 – Reading multiple comma-separated values in one line

\`\`\`python
raw = input('Enter name, age, score separated by commas: ')
parts = [s.strip() for s in raw.split(',')]
name, age, score = parts[0], int(parts[1]), float(parts[2])
print(f'Loaded: name={name!r}, age={age}, score={score:.1f}')
# Enter name, age, score separated by commas: Bob, 19, 88.5
# Loaded: name='Bob', age=19, score=88.5
\`\`\`

## Best Practices

- **Default to f-strings.** They are fastest, clearest, and evaluated at the call site with full access to local variables.
- **Strip + validate every input immediately.** Wrap numeric conversion in a \`try/except ValueError\` and provide a retry loop.
- **Use the exclamation-mark converters** (\`{x!r}\` → \`repr()\`, \`{x!s}\` → \`str()\`) when you want to see the exact representation.
- **Prefer \`sep=' '/end=''\` parameters** to string concatenation inside \`print\` — \`print(a, b, c)\` is cleaner than \`print(str(a)+' '+str(b)+' '+str(c))\`.
- **Keep user prompts explicit**. "Enter age: " is much better than a bare \`input()\` that leaves the user wondering what to type.
- **Avoid suppressing all exceptions around \`input()\`**. Let \`KeyboardInterrupt\` bubble up, or explicitly catch only \`ValueError\`.

## Common Mistakes

- **Forgetting that \`input()\` always returns a string.** \`age = input()\` then \`age + 5\` throws \`TypeError: can only concatenate str (not \"int\") to str\`. Convert first.
- **Missing the colon in f-string format specs** — \`f\"{value .2f}\"\` is invalid; the correct syntax is \`f\"{value:.2f}\"\`.
- **Using \`print()\` instead of \`logging\` for long-running services**. Use the \`logging\` module for anything beyond tiny scripts — it gives levels, files, timestamps.
- **Writing \`if age >= 18:\` directly on raw \`input()\` results** — the comparison \`str >= int\` will raise \`TypeError\` in Python 3.
- **Over-reliance on chained \`.split()\` without validating length**: if the user provides fewer fields than expected, unpacking crashes with \`ValueError: not enough values to unpack\`.
- **Leaving \`flush=True\` on every print in production** — it defeats I/O buffering and tanks throughput on bulk writes.

## Summary

\`input(prompt)\` reads a line from the console as a string; \`print(values, sep, end, file, flush)\` writes text to stdout (or elsewhere). **Always** cast numeric inputs explicitly with \`int()\` / \`float()\` and wrap in \`try/except ValueError\`. Use f-strings for interpolation — they are the fastest and most readable option, supporting alignment, precision, and the \`!r/!s/!a\` converters. A handful of small, disciplined I/O habits make your programs far more robust and pleasant to use.

---
### Practice Questions

1. **Q**: What value does \`input()\` return if the user types \`42\` and presses Enter?
   **A**: The *string* \`\"42\"\` — always a string. You must call \`int()\` on it to get the integer.

2. **Q**: How would you print \`a\` and \`b\` on the same line, separated by \` | \`?
   **A**: \`print(a, b, sep=' | ')\`.

3. **Q**: In an f-string, how do you format \`price=19.991\` as the string \`\"$19.99\"\`?
   **A**: \`f\"${price:.2f}\"\` (the colon starts the format spec and \`.2f\` gives 2 decimals).

4. **Q**: Why would a programmer add \`flush=True\` to a print call inside a progress counter loop?
   **A**: Because stdout is typically line-buffered. If you're printing \`'.'\` without a newline to show progress, nothing appears on-screen until the buffer fills — \`flush=True\` forces immediate output.

5. **Q**: Give a safe idiom for reading a comma-separated list of integers from a single input line.
   **A**:
   \`\`\`python
   nums = [int(x) for x in input('Numbers: ').split(',')]
   # plus try/except ValueError for robustness.
   \`\`\`

6. **Q**: What is the difference between \`{x}\` and \`{x!r}\` inside an f-string?
   **A**: \`{x}\` calls \`str(x)\` (user-facing string), \`{x!r}\` calls \`repr(x)\` (developer-facing debug string with quotes, escaping, etc.).

---
### Quiz (MCQ)

1. **\`input()\` always returns:**
   A) An integer
   B) A string
   C) A float
   D) Whatever type the user typed
   **Correct: B**

2. **Which prints \`Hello, World!\` without a trailing newline?**
   A) \`print('Hello, World!', '')\`
   B) \`print('Hello, World!', end='')\`
   C) \`print('Hello, World!', nonewline=True)\`
   D) \`print('Hello, World!', sep='')\`
   **Correct: B**

3. **\`f'{\"hi\":>8s}' produces:**
   A) \`\"hi      \"\`
   B) \`\"      hi\"\`
   C) \`\"########hi\"\`
   D) Syntax error
   **Correct: B** (>\` means right-align within width 8)

4. **How do you catch invalid integer input cleanly?**
   A) Check \`type(x) == int\`
   B) \`try: int(x) except TypeError\`
   C) \`try: int(x) except ValueError\`
   D) Use \`isinstance(x, int)\`
   **Correct: C**

5. **\`print('a', 'b', 'c', sep='-')\` prints:**
   A) \`a b c\`
   B) \`a-b-c\`
   C) \`abc\`
   D) \`a,b,c\`
   **Correct: B**

6. **Which f-string prints \`Pi ≈ 3.142\` (3 decimals) for \`pi = 3.14159\`?**
   A) \`f'Pi ≈ {pi}'\`
   B) \`f'Pi ≈ {pi:3f}'\`
   C) \`f'Pi ≈ {pi:.3f}'\`
   D) \`f'Pi ≈ {pi:3}'\`
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Conditional Statements',
    sectionOrder: 5,
    lessonOrder: 0,
    title: 'Conditionals and Decision Making',
    slug: 'python-conditionals',
    estimatedMinutes: 30,
    content: `## Introduction

Life is full of choices, and so is code. Conditionals let a program run different code paths based on whether a boolean expression evaluates to \`True\` or \`False\`. Python's \`if / elif / else\` syntax is minimal and readable — but decisions get tricky when you combine many conditions, use truthiness, or nest blocks.

## Definition

A **conditional statement** is a control-flow construct that alters execution based on the truth value of one or more boolean expressions. In Python: \`if EXPRESSION: BLOCK elif EXPRESSION: BLOCK else: BLOCK\`.

## Why It Exists

Without conditionals every program would be a straight line of instructions. Decision-making is what elevates a calculator into a game, a report generator into a recommendation engine, and a static page into a full application. All branches of logic — validation, feature flags, grading, error recovery — ultimately reduce to \`if\`.

## How It Works

The interpreter evaluates the \`if\` expression in **boolean context**. If truthy, its block runs and \`elif\` / \`else\` are skipped. Otherwise, each \`elif\` is tried in order; the first truthy one wins, and its block runs. If none match, the \`else\` block runs (when present).

Blocks are defined by indentation (4 spaces per PEP 8, never tabs). There is no \`end\` keyword — dedent signals you've left the block.

Python 3.10 adds **pattern matching** with \`match/case\` for more sophisticated branching on values, shapes, and types. For simple "A or B" expressions use the **ternary conditional**: \`X if COND else Y\`.

## Syntax

\`\`\`python
score = 82
if score >= 90:
    grade = 'A'
elif score >= 80:
    grade = 'B'
elif score >= 70:
    grade = 'C'
elif score >= 60:
    grade = 'D'
else:
    grade = 'F'
print(grade)  # B

# Ternary expression (expression, not a statement!)
level = 'adult' if age >= 18 else 'minor'

# Match / case (Python 3.10+)
match command.split():
    case ['quit']:         quit_app()
    case ['go', dir]:      move(dir)
    case ['get', *rest]:   fetch(rest)
    case _:                print('Unknown command')
\`\`\`

## Real World Example

Discount engine that applies the best single offer, no double-dipping:

\`\`\`python
cart_total = 320
is_student, is_coupon10, is_bulk = True, False, True

if is_bulk and cart_total >= 300:          # most specific first
    discount = 0.20
elif is_student:
    discount = 0.15
elif is_coupon10:
    discount = 0.10
else:
    discount = 0.0

final = round(cart_total * (1 - discount), 2)
print(f'Pay ${final} after {int(discount*100)}% discount')
# Pay $256.0 after 20% discount
\`\`\`

## Code Examples

### Example 1 – Allowed vs forbidden truth values

\`\`\`python
value = 0

if value:                         # 0 is falsy
    print('truthy branch')
elif value is not None:           # BUT it's not None either
    print('falsy-but-not-None branch')  # ← runs
else:
    print('None branch')

# Output: falsy-but-not-None branch
\`\`\`

### Example 2 – Nested conditionals vs guard clauses

\`\`\`python
# Nested (harder to read)
def can_drive(age, has_license, sober):
    if age >= 18:
        if has_license:
            if sober:
                return True
            else: return False
        else: return False
    else: return False

# Guard clauses (flat, preferred)
def can_drive2(age, has_license, sober):
    if age < 18:        return False
    if not has_license: return False
    if not sober:       return False
    return True
\`\`\`

### Example 3 – Dictionary dispatch instead of long \`if/elif\`

\`\`\`python
def add(a, b): return a + b
def sub(a, b): return a - b
def mul(a, b): return a * b
OPS = {'+': add, '-': sub, '*': mul}

op, x, y = '*', 6, 7
if op in OPS:
    print(OPS[op](x, y))        # 42
else:
    print('Unknown operator')
\`\`\`

## Best Practices

- **Order \`elif\` from most-specific to most-general.** A catch-all at the top would mask the specialized cases.
- **Replace deep nesting with guard clauses**. \`if not pre: return\` at the top of a function beats nested pyramids.
- **Use a truthy check (\`if user:\`) only when you accept *all* falsy values as "empty".** If \`0\` or \`\"\"\` are valid values, test explicitly: \`if user is None:\` or \`if x == ''\`.
- **Avoid redundant \`== True\`**. \`if authenticated:\` is always better than \`if authenticated == True:\`.
- **Prefer dictionaries / match-case** when you branch on 5+ literal values — the dispatch table is cleaner and faster.
- **Keep ternary expressions tiny**. If the subexpressions are long, fall back to a full \`if/else\` — clarity beats one-liners.

## Common Mistakes

- **Using assignment \`=\` instead of comparison \`==\`** inside a condition causes \`SyntaxError\`. Walrus \`:=\` is the only legal assignment operator inside \`if\`.
- **Dangling \`else\` confusion** in nested conditionals. In Python indentation removes ambiguity, but you should still use guard clauses to avoid deep nesting in the first place.
- **Mistyping \`elif\` as \`else if\`** — Python does not have C-style \`else if\` as one token; use \`elif\`.
- **Writing \`if x == 'A' or 'B':\`**. Due to operator precedence this parses as \`(x == 'A') or ('B')\` which is *always* truthy. The correct form is \`if x == 'A' or x == 'B'\` or \`if x in {'A', 'B'}\`.
- **Checking \`if len(xs) > 0:\`** when the idiomatic test is simply \`if xs:\` (or the reverse \`if not xs:\`).
- **Overlapping ranges** in \`elif\` chains because you used \`>\` where you meant \`>=\` — e.g., both branches fire, or neither fires for a boundary value.

## Summary

Conditionals change which code runs based on truth. Python's \`if / elif / else\` is indentation-based, simple, and powerful. Remember that boolean context treats many values as falsy (\`0\`, \`None\`, \`\"\"\`, empty collections) — test explicitly if those are valid inputs. Flatten deeply nested logic with early-return guard clauses. For multi-way dispatch on concrete values, consider a dictionary lookup or a \`match/case\` statement instead of long \`elif\` ladders. Clear branching is one of the clearest signals of clean code.

---
### Practice Questions

1. **Q**: Rewrite \`if x != None:\` the Pythonic way when \`None\` is the only invalid state.
   **A**: \`if x is not None:\` — use identity check against the singleton.

2. **Q**: Write a one-liner that sets \`parity\` to \`\"even\"\` or \`\"odd\"\` based on \`n\`.
   **A**: \`parity = 'even' if n % 2 == 0 else 'odd'\`.

3. **Q**: What bug does \`if choice == 'y' or 'Y':\` contain?
   **A**: Due to precedence, \`'Y'\` on its own is always truthy, so the \`if\` *always* runs. Fix: \`if choice in {'y','Y'}:\`.

4. **Q**: Should you test an empty list with \`if len(items) == 0:\`?
   **A**: You *can*, but idiomatic Python is \`if not items:\` — it's shorter and generalizes to any container.

5. **Q**: When does an \`else\` block attached to \`if/elif\` run?
   **A**: Only if *none* of the preceding \`if\` or \`elif\` conditions was truthy.

6. **Q**: How do guard clauses improve on nested \`if\` statements?
   **A**: They eliminate indentation levels by returning early from the function on failing preconditions. The reader sees requirements top-to-bottom as flat checks instead of a nested pyramid.

---
### Quiz (MCQ)

1. **Which keyword starts the *second* branch in a multi-condition chain?**
   A) \`else if\`
   B) \`elif\`
   C) \`elseif\`
   D) \`elsif\`
   **Correct: B**

2. **\`if grade >= 50: print('PASS') else: print('FAIL')\` for \`grade=50\` prints:**
   A) PASS
   B) FAIL
   C) Neither
   D) Error
   **Correct: A**

3. **Which is the PEP 8 preferred indentation?**
   A) 2 spaces
   B) A single tab
   C) 4 spaces
   D) 8 spaces
   **Correct: C**

4. **Ternary expression for \`sign = 1 if x >= 0 else -1\` — if \`x = 0\`:**
   A) -1
   B) 1
   C) 0
   D) Throws
   **Correct: B**

5. **\`if '': print('a') elif []: print('b') else: print('c')\` prints:**
   A) a
   B) b
   C) c
   D) Error
   **Correct: C** (empty string and empty list are both falsy)

6. **Good alternative to a very long \`if/elif/elif\` over literal strings:**
   A) A \`for\` loop
   B) A dict mapping keys to callables
   C) A \`while\` loop
   D) Recursion
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Loops',
    sectionOrder: 6,
    lessonOrder: 0,
    title: 'Loops and Iteration Patterns',
    slug: 'python-loops',
    estimatedMinutes: 40,
    content: `## Introduction

Humans repeat. Computers *automate* repetition. Python's two loop constructs — \`for\` (iterating over collections) and \`while\` (looping while a condition holds) — paired with \`break\`, \`continue\`, iteration helpers like \`enumerate\`, and the mighty list-comprehension, give you every tool you need to process data en masse.

## Definition

A **loop** is a control structure that repeats a block of code:
- **\`for VAR in ITERABLE\`** binds \`VAR\` to each successive value produced by the iterable and runs the body once per item.
- **\`while CONDITION\`** re-evaluates the condition before each iteration; when truthy the body runs, otherwise control exits the loop.

## Why It Exists

Most of what we call "programming" is just transforming lists, rows, streams, and datasets. Without loops you'd write line after line of near-identical code, and there would be no way to handle an input whose size you don't know until runtime. Loops turn "do this N times" into a single, short recipe.

## How It Works

Python's \`for\` loop is really a **for-each** loop — it always consumes an **iterable** (something implementing \`__iter__\`). Under the hood \`for x in it:\` calls \`iter(it)\` to get an iterator, then repeatedly calls \`next(iterator)\` until \`StopIteration\` is raised.

A \`while\` loop simply checks its condition before each iteration. If the condition never becomes falsy, you get an **infinite loop** (press Ctrl+C to break).

Within either loop:
- **\`break\`** immediately exits the *innermost* loop.
- **\`continue\`** skips the rest of this iteration and goes back to the top.
- **\`else:\` attached to a loop** runs only if the loop exited normally — NOT via \`break\`. This is a Python idiosyncrasy great for "found it?" searches.

## Syntax

\`\`\`python
# for with enumerate and range
for idx, fruit in enumerate(['apple', 'banana', 'cherry'], start=1):
    print(f'{idx}. {fruit}')

# Classic C-style "i from 0 to 4" is done with range()
for i in range(5):
    print(i, end=' ')               # 0 1 2 3 4

# while with break/else
guesses_left, secret = 3, 42
while guesses_left > 0:
    g = int(input('Guess: '))
    if g == secret:
        print('You win!'); break
    guesses_left -= 1
else:
    print(f'Out of guesses! Secret was {secret}')
\`\`\`

## Real World Example

The classic "find an item with a sentinel" — looking through users for a specific email, and doing something only if it's NOT found:

\`\`\`python
users = [{'name': 'Ada', 'email': 'ada@ex.com'}, {'name': 'Linus', 'email': 'linus@ex.com'}]
target = 'grace@ex.com'
for user in users:
    if user['email'] == target:
        print(f'Found: {user["name"]}')
        break
else:
    # Runs ONLY if no break
    print(f'No user with email {target} — creating record...')
    users.append({'name': target.split('@')[0].title(), 'email': target})
\`\`\`

## Code Examples

### Example 1 – \`zip\`, \`enumerate\`, \`range\`, \`reversed\`, \`sorted\`

\`\`\`python
names = ['r', 'g', 'b']; values = [0x22, 0x99, 0xdd]
for name, v in zip(names, values):                    # parallel iteration
    print(f'{name} = 0x{v:02X}', end=' | ')            # r = 0x22 | g = 0x99 | b = 0xDD
print()
for i, v in enumerate(['a', 'b', 'c']):                # index + value
    print(i, v)                                        # 0 a / 1 b / 2 c
\`\`\`

### Example 2 – Iterating over dicts (keys / values / items)

\`\`\`python
scores = {'Alice': 92, 'Bob': 78, 'Carol': 96}
for name in scores:                       # default = keys
    print(name, end=' ')
print()
for s in scores.values():                 # values only
    print(s, end=' ')
print()
for name, score in scores.items():        # both
    print(f'{name:6s}: {score}')
# Alice : 92
# Bob   : 78
# Carol : 96
\`\`\`

### Example 3 – Comprehensions replacing \`for + append\`

\`\`\`python
nums = list(range(10))

# Squares of evens — three forms
squares = [n*n for n in nums if n % 2 == 0]         # list comp
square_map = {n: n*n for n in nums if n % 2 == 0}   # dict comp
unique_mods = {n % 3 for n in nums}                 # set comp

print(squares)      # [0, 4, 16, 36, 64]
print(square_map)   # {0:0, 2:4, 4:16, 6:36, 8:64}
print(unique_mods)  # {0, 1, 2}
\`\`\`

## Best Practices

- **Prefer \`for x in collection:\`** over indexing. If you also need an index, reach for \`enumerate(collection)\`.
- **Use \`range(N)\`** for pure "do something N times" loops; use \`range(a, b, step)\` for numeric progressions.
- **Use \`zip(a, b)\` for parallel iteration** over two sequences of the same length. For unequal lengths add \`itertools.zip_longest\`.
- **Reach for comprehensions** whenever you are building a new list/dict/set from an iterable with a simple transformation/filter.
- **Put the break-out condition at the TOP of a \`while\` loop**, and make the loop body decrease some quantity toward termination.
- **Reserve \`loop-else\`** for "search without finding" patterns; in other cases it confuses readers. Add a comment when you do use it.

## Common Mistakes

- **Modifying a list while iterating over it.** Removing items shifts indices and skips elements. Iterate over a copy (\`for x in xs[:]:\`) or build a new list.
- **Confusing \`range(5)\` inclusion**: \`range(5)\` yields \`0,1,2,3,4\` — five elements, stopping **before** 5.
- **Off-by-one errors with \`range(1, 10)\`** when you really wanted 10 included → use \`range(1, 11)\`.
- **Using a C-style \`for i = 0; i < n; i++\`** — there is no such syntax in Python. Use \`range\` or \`enumerate\`.
- **Forgetting \`continue\` skips the rest of the block**. Cleanup logic placed after the \`continue\` won't run for skipped iterations.
- **Expecting \`else:\` on a loop to always run**. It runs only if the loop completed without \`break\`. Most programmers never learn this and misread the code.

## Summary

Use \`for item in iterable\` for processing collections; pair it with \`enumerate\`, \`zip\`, \`range\`, \`reversed\`, and \`sorted\` to avoid manual indexing. Use \`while cond:\` for scenarios where the termination condition isn't tied to a fixed collection but to changing state. Comprehensions (\`[...]\`, \`{k:v ...}\`, \`{...}\`) replace the tedious pattern of \`result = []\` + \`for\` + \`append\`. Know \`break\` and \`continue\`, and remember that a loop's \`else\` clause fires only when no \`break\` occurred. Iteration is where Python really shines — idiomatic looping reads like plain English.

---
### Practice Questions

1. **Q**: What does \`for i, c in enumerate('ABC'):\` bind \`i\` and \`c\` to on each iteration?
   **A**: \`0, 'A'\` then \`1, 'B'\` then \`2, 'C'\` (starts at 0 by default).

2. **Q**: Name two ways to avoid the "modify-list-while-iterating" bug.
   **A**: (1) Iterate over a copy: \`for x in xs[:]:\`. (2) Build a second list with results rather than mutating in place.

3. **Q**: When does a \`for ... else:\` block's \`else\` body execute?
   **A**: ONLY if the loop ended because the iterable was exhausted — never if it was exited via \`break\`.

4. **Q**: Write a list comprehension that produces the uppercase of each word in \`words\` that is longer than 3 characters.
   **A**: \`[w.upper() for w in words if len(w) > 3]\`.

5. **Q**: How do you iterate through keys and values of a dict in one loop?
   **A**: \`for key, value in dictionary.items():\`.

6. **Q**: What's wrong with \`for i in range(len(xs)): print(xs[i])\`?
   **A**: It works, but it's "un-Pythonic" and less readable than the direct \`for x in xs:\` (or \`for i, x in enumerate(xs):\` if an index is truly needed).

---
### Quiz (MCQ)

1. **How many times does \`for _ in range(3, 7):\` iterate?**
   A) 3
   B) 4
   C) 7
   D) 5
   **Correct: B** (3, 4, 5, 6)

2. **Which helper gives (index, value) pairs?**
   A) \`items()\`
   B) \`zip()\`
   C) \`enumerate()\`
   D) \`count()\`
   **Correct: C**

3. **\`continue\` inside a loop:**
   A) Exits the program
   B) Exits the innermost loop
   C) Skips the rest of the current iteration
   D) Restarts the loop from iteration 0
   **Correct: C**

4. **\`break\` exits:**
   A) All loops
   B) Only the innermost enclosing loop / switch
   C) The function
   D) Nothing — it's a placeholder
   **Correct: B**

5. **\`{c for c in 'mississippi'}\` returns:**
   A) A list of letters
   B) A set of unique letters \`{'m','i','s','p'}\`
   C) A dict mapping letters to counts
   D) A string
   **Correct: B**

6. **Default iteration of a dict with \`for k in d:\` yields:**
   A) Values only
   B) Keys only
   C) Tuples of (key, value)
   D) Random contents
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Functions',
    sectionOrder: 7,
    lessonOrder: 0,
    title: 'Defining and Using Functions',
    slug: 'python-functions-basics',
    estimatedMinutes: 40,
    content: `## Introduction

Functions are the most basic unit of reusable logic in Python. A function wraps a sequence of statements under a single name, accepts inputs, and returns a result. Well-designed functions are the cornerstone of readable, testable, and maintainable code.

## Definition

A **function** is a named block of code that (optionally) accepts **parameters** as input and (optionally) **returns** a value. Functions are defined with the \`def\` keyword, and called by appending \`(...)\` to their name. A **return value** is sent back to the caller via the \`return\` keyword; if no \`return\` statement runs, the function implicitly returns \`None\`.

## Why It Exists

Without functions, you would copy-and-paste the same logic everywhere you needed it — leading to buggy, inconsistent code. Functions give you:
1. **DRY (Don't Repeat Yourself):** define logic once, reuse often.
2. **Abstraction:** callers only need to know *what*, not *how*.
3. **Testability:** small pure functions are trivial to unit-test.
4. **Decomposition:** break a big problem into small, named pieces.

## How It Works

When Python executes a function call like \`f(1, 2, k=3)\`:
1. Each positional argument is bound to the corresponding parameter by position.
2. Each keyword argument (\`k=3\`) is bound to the named parameter.
3. Default parameter values are substituted for any missing arguments.
4. A new local **namespace / frame** is created just for this call.
5. The body runs until a \`return\` is hit or the block ends.
6. Control jumps back to the caller with the return value, and the local frame is discarded.

Functions are **first-class objects**: you can assign them to variables, store them in lists, pass them as arguments, and return them from other functions.

## Syntax

\`\`\`python
# Basic definition
def greet(name, greeting='Hello'):        # greeting has a DEFAULT value
    """Return a friendly greeting string.  ← docstring"""
    return f'{greeting}, {name}!'

print(greet('Ada'))                        # Hello, Ada!
print(greet('Linus', 'Top of the morning'))# Top of the morning, Linus!
print(greet(greeting='Hi', name='Grace'))  # keyword args – order doesn't matter

# Variable-length positional + keyword
def show(*args, **kwargs):
    print('positional tuple :', args)
    print('keyword dict     :', kwargs)

show(1, 2, 3, x=10, y=20)
# positional tuple : (1, 2, 3)
# keyword dict     : {'x': 10, 'y': 20}
\`\`\`

## Real World Example

An e-commerce checkout helper that applies a tax percentage and a tiered shipping fee:

\`\`\`python
def order_total(subtotal: float, tax_rate: float = 0.18, country: str = 'IN') -> float:
    """Return final order total including tax and shipping."""
    if subtotal <= 0:
        raise ValueError('Subtotal must be positive')
    shipping = 0 if subtotal >= 2000 else (50 if country == 'IN' else 300)
    return round(subtotal * (1 + tax_rate) + shipping, 2)

print(order_total(1500))                       # Rs. 1500 * 1.18 + 50 = 1820.0
print(order_total(1500, country='US'))         # 1500 * 1.18 + 300 = 2070.0
print(order_total(5000))                       # >= 2000 → free shipping: 5900.0
\`\`\`

## Code Examples

### Example 1 – Multiple return values (tuples) and unpacking

\`\`\`python
def min_max_avg(numbers):
    if not numbers:
        return None, None, None
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

lo, hi, avg = min_max_avg([10, 20, 30, 40, 50])
print(f'[{lo} … {hi}], avg = {avg}')
# [10 … 50], avg = 30.0
\`\`\`

### Example 2 – Function as first-class object (callback)

\`\`\`python
def loud(text): return text.upper() + '!!'
def quiet(text): return text.lower() + '…'

def greet(say, style):
    return style(say('hello friend'))        # style is a *function*

print(greet(str.title, loud))     # HELLO FRIEND!!
print(greet(str.capitalize, quiet))# Hello friend…
\`\`\`

### Example 3 – Type hints (Python 3.5+) for readability

\`\`\`python
from typing import List

def filter_adults(users: List[dict]) -> List[dict]:
    return [u for u in users if u.get('age', 0) >= 18]

people = [{'name': 'A', 'age': 17}, {'name': 'B', 'age': 22}, {'name': 'C', 'age': 30}]
print(filter_adults(people))
# [{'name': 'B', 'age': 22}, {'name': 'C', 'age': 30}]
\`\`\`

## Best Practices

- **Write a docstring** for every public function. Google-style, NumPy-style, or reStructuredText — be consistent.
- **Keep functions small & single-purpose.** If the description needs "and …", split it.
- **Prefer pure functions** (same input → same output, no side effects) whenever possible. They are predictable and easy to test.
- **Use type hints on non-trivial signatures.** They serve as documentation and unlock editor tooling + mypy static analysis.
- **Use explicit parameter names for boolean flags.** \`send_email(force=True)\` is infinitely clearer than \`send_email(True)\`.
- **Validate inputs at the top of a function with guard clauses** and raise descriptive exceptions. Don't let garbage values flow through the body.

## Common Mistakes

- **Mutable default arguments**: \`def f(x=[]):\` shares the SAME list across every call. Use \`None\` as default and create a new collection inside the function (\`x = x or []\`) when needed.
- **Forgetting that functions without \`return\` yield \`None\`**. Using the result in an expression silently propagates \`NoneType\` errors downstream.
- **Too many positional parameters**. A signature with >4 positional args is error-prone at the call site. Wrap them in a dataclass, TypedDict, or keyword-only arguments.
- **Shadowing builtins**. Naming a function \`list\`, \`dict\`, \`min\`, \`max\`, \`id\`, or \`type\` breaks everything later.
- **Using side effects in the default argument expression** (e.g., \`def f(t=time.time()):\`). The default is evaluated **once at definition-time**, not per-call.
- **Modifying mutable arguments "in place" and also returning them**. Pick one — mutating + returning creates confusing aliasing bugs.

## Summary

Functions encapsulate logic behind a name. Parameters are bound positionally or by keyword, defaults are assigned to missing arguments, and \`return\` sends a value back (implicit \`None\` otherwise). Functions are first-class objects you can pass around. Write docstrings, add type hints, keep bodies small and side-effect-free, and avoid the mutable-default footgun. The ability to split a big program into crisp, well-named functions is the single most impactful skill for writing maintainable Python.

---
### Practice Questions

1. **Q**: What is a "pure" function?
   **A**: A function whose return value depends *only* on its inputs, and which causes no observable side effects (no file I/O, no mutation of globals or arguments, no randomness). \`add(a,b)\` is pure; \`print(x)\` is not.

2. **Q**: What is wrong with \`def push(item, stack=[]): stack.append(item); return stack\`?
   **A**: The mutable default \`stack=[]\` is created once when \`def\` executes. Successive calls share the same list, causing cross-call state leaks. Default to \`None\` and create \`stack = stack or []\` inside.

3. **Q**: In Python, how do you return *multiple* values from a function?
   **A**: Return a tuple (explicit or implied): \`return a, b, c\`. Callers unpack with \`x, y, z = f()\`.

4. **Q**: What is the difference between a positional argument and a keyword argument?
   **A**: Positional arguments match parameters by order. Keyword arguments use the form \`name=value\` and match by name, so order is irrelevant.

5. **Q**: What is a docstring, and where does it live?
   **A**: A string literal placed as the very first statement inside a function (or class, or module). It is accessible at runtime via \`function.__doc__\` and the \`help()\` builtin.

6. **Q**: Explain first-class functions in one sentence.
   **A**: Functions in Python are ordinary values — you can assign them to variables, store them in containers, pass them as arguments, and return them from other functions.

---
### Quiz (MCQ)

1. **Which keyword begins a function definition?**
   A) \`function\`
   B) \`def\`
   C) \`fn\`
   D) \`func\`
   **Correct: B**

2. **A function that runs off the end without a \`return\` returns:**
   A) 0
   B) Empty string
   C) \`None\`
   D) Raises a runtime error
   **Correct: C**

3. **Correct Python call with keyword arguments:**
   A) \`f(x=1, 2)\`
   B) \`f(x=1, y=2)\`
   C) \`f(1=x, 2=y)\`
   D) \`f(:x 1, :y 2)\`
   **Correct: B** (keyword args must follow positional args, and cannot repeat)

4. **Mutable default \`def f(x=[])\` creates the list:**
   A) On every call
   B) Once, when \`def\` is executed
   C) When \`f()\` is first called
   D) Never — defaults are only syntax
   **Correct: B**

5. **\`return a, b\` returns:**
   A) Two separate values (C-style out-params)
   B) A list \`[a,b]\`
   C) A tuple \`(a,b)\`
   D) A dict \`{a,b}\`
   **Correct: C**

6. **A \`*args\` parameter collects:**
   A) Excess keyword arguments into a dict
   B) Excess positional arguments into a tuple
   C) The first argument only
   D) Arbitrary types of arguments into a list
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Collections (List, Tuple, Set, Dict)',
    sectionOrder: 8,
    lessonOrder: 0,
    title: 'Lists and Tuples Deep Dive',
    slug: 'python-lists-tuples',
    estimatedMinutes: 45,
    content: `## Introduction

Almost every piece of data you process comes in groups. Python's ordered sequences — **lists** (mutable, \`[...]\`) and **tuples** (immutable, \`(...)\`) — are the workhorse collections for everyday data. Choosing between them and using their methods correctly separates the beginner from the confident Pythonista.

## Definition

- A **list** is an *ordered*, *mutable*, *indexable* container of zero or more arbitrary Python values. Literal: \`[1, 'b', None]\`.
- A **tuple** is an *ordered*, *immutable*, *indexable* container. Literal: \`(1, 'b', None)\` — or even just \`1, 'b', None\`. A 1-tuple requires a trailing comma: \`(x,)\`.

Both support **slicing** (\`xs[start:stop:step]\`), membership tests (\`in\`), concatenation, and repetition.

## Why It Exists

Lists are for collections where you'll add, remove, or reorder items (e.g., rows being read from CSV, a todo list). Tuples are for fixed-shape, heterogeneous records that shouldn't accidentally change (e.g., a \`(lat, lon)\` coordinate, a DB row).

Using tuples where mutation would be a bug lets Python and your tools catch errors early. Their immutability also allows tuples to be dictionary keys and set members, which lists cannot be.

## How It Works

Both lists and tuples store **references** to Python objects contiguously in memory. For a list, Python overallocates space so \`append\` is amortized O(1). When you index \`xs[i]\`, it's a direct memory lookup — O(1). Searching with \`in\` is linear O(n).

**Slicing** creates a *new* list/tuple containing shallow copies of the element references. Extended slicing with a negative step reverses: \`xs[::-1]\`.

Common list methods:
- \`.append(x)\` / \`.extend(iter)\` / \`.insert(i, x)\`
- \`.pop(i)\` (last by default) / \`.remove(value)\` / \`.clear()\`
- \`.index(x, start, end)\` / \`.count(x)\`
- \`.sort(key=, reverse=)\` / \`.reverse()\` / \`.copy()\`

Tuples have only \`.index()\` and \`.count()\` because all others would mutate.

## Syntax

\`\`\`python
fruits = ['apple', 'banana', 'cherry']
fruits[1] = 'blueberry'                  # MUTATE
fruits.append('date')
fruits.extend(['elderberry', 'fig'])
last = fruits.pop()                      # 'fig'

# List comprehensions
squares = [n * n for n in range(6)]      # [0, 1, 4, 9, 16, 25]

# Slicing [start:stop:step]
xs = list(range(10))
print(xs[3:7])    # [3,4,5,6]
print(xs[::-2])   # [9,7,5,3,1] (every 2nd, reversed)

# Tuple – immutable, hashable
point = (12.9716, 77.5946)  # Bengaluru
lat, lon = point            # unpacking
print(lat, lon)             # 12.9716 77.5946
\`\`\`

## Real World Example

Reading a CSV of orders into a list of tuples (fixed rows) then filtering/sorting:

\`\`\`python
# (order_id, amount, customer_name) — the tuple shape never changes per row
orders = [
    ('#A1001', 1500.0, 'Ada'),
    ('#A1002',  250.0, 'Linus'),
    ('#A1003', 4200.0, 'Grace'),
    ('#A1004',  800.0, 'Dennis'),
]

big_orders = [row for row in orders if row[1] >= 1000]
big_orders.sort(key=lambda row: row[1], reverse=True)   # by amount desc
for oid, amt, cust in big_orders:
    print(f'{cust:10s} {oid:>6s}  ₹{amt:,.0f}')
# Grace      #A1003  ₹4,200
# Ada        #A1001  ₹1,500
\`\`\`

## Code Examples

### Example 1 – List "modify in place" pitfalls

\`\`\`python
a = [1, 2, 3]
b = a                # reference copy – NOT a data copy
b.append(99)
print(a)             # [1, 2, 3, 99]  (a changed too!)
c = a[:]             # slice = a shallow copy
c.append('x')
print(a, c)          # [1, 2, 3, 99]   [1, 2, 3, 99, 'x']
\`\`\`

### Example 2 – Sorting with custom keys vs. \`.sort()\` vs \`sorted()\`

\`\`\`python
names = ['Ada', 'LINUS', 'grace', 'Dennis']
print(sorted(names))                       # ['Ada','Dennis','LINUS','grace'] (ASCII)
print(sorted(names, key=str.lower))        # ['Ada','Dennis','grace','LINUS'] (alphabetical)
names.sort(key=len, reverse=True)          # in-place; longest first
print(names)                               # ['Dennis','LINUS','grace','Ada']
\`\`\`

### Example 3 – Tuple unpacking everywhere

\`\`\`python
for i, (name, age) in enumerate([('A',10), ('B',20), ('C',30)], start=1):
    print(f'{i}. {name} is {age}')

# Swap two variables in a single expression — NO temp needed
x, y = 'left', 'right'
x, y = y, x
print(x, y)        # right left

# Star unpacking for "the rest"
first, *mid, last = range(10)
print(first, mid, last)
# 0 [1, 2, 3, 4, 5, 6, 7, 8] 9
\`\`\`

## Best Practices

- **Pick list vs tuple by intent**: if the collection is a bag of things that will grow/shrink → list; if it's a fixed-size record with heterogeneous fields → tuple (or NamedTuple / dataclass, even better).
- **Prefer comprehensions** over a manual \`result=[]; for…append\` loop. They are faster and more declarative.
- **Use \`enumerate(iter, start=1)\`** instead of manual counters.
- **Never mutate a list while iterating over it directly.** Iterate over a copy or collect indices to delete after the loop.
- **Treat tuples as lightweight records.** For more clarity, use \`collections.namedtuple\` or \`typing.NamedTuple\` so fields have names instead of numeric indices.
- **For copying a list:** \`new = old[:]\`, \`new = old.copy()\`, or \`new = list(old)\` all produce the same shallow copy. For nested structures you need \`copy.deepcopy\`.

## Common Mistakes

- **Confusing tuple creation**: \`t = (42)\` is an integer, NOT a tuple. You need the trailing comma: \`t = (42,)\`.
- **Aliasing instead of copying**: \`b = a\` means two names for the same list. Use \`list(a)\` or \`a[:]\` to shallow-copy.
- **Using \`.sort()\` (returns None) where you wanted \`sorted()\` (returns a new list)**. Writing \`xs = xs.sort()\` clobbers \`xs\` with \`None\`.
- **Indexing with a tuple when you meant a list**: \`pt[0, 1]\` is the tuple key \`(0,1)\`, not two indices! For 2D it's \`grid[0][1]\`.
- **Linear search with \`if x in huge_list:\` inside a loop** turns your algorithm O(n²). If you need many lookups, pre-build a set or dict.
- **Confusing \`.remove(x)\` and \`.pop(i)\`**: \`remove\` searches by VALUE and raises ValueError if missing; \`pop\` uses an INDEX and returns the removed element.

## Summary

Lists \`[a,b,c]\` are ordered, mutable sequences with dozens of methods for dynamic collections. Tuples \`(a,b,c)\` are ordered, immutable sequences ideal for fixed records and as hashable dict keys/set members. Indexing \`xs[i]\`, slicing \`xs[a:b:s]\`, unpacking, and comprehensions are the everyday operations you must master. Think before choosing: mutation → list, record/token → tuple. And watch out for reference aliasing! A solid grasp of these two collections will make every subsequent Python topic dramatically easier.

---
### Practice Questions

1. **Q**: What's the output? \`xs = [1,2,3]; ys = xs; ys += [4]\`. What is \`xs\` now?
   **A**: \`[1,2,3,4]\`. \`+=\` on a list extends in place and \`ys\` is an alias of \`xs\`.

2. **Q**: Create a one-tuple containing the string \`"hello"\`.
   **A**: \`("hello",)\` — the trailing comma is mandatory.

3. **Q**: Explain when you would use a tuple instead of a list.
   **A**: When the data is a fixed-size record that shouldn't mutate (coordinate, row, key), or when you need a hashable value usable as a dict key / set member.

4. **Q**: Using slicing, produce a reversed copy of list \`data\`.
   **A**: \`data[::-1]\`.

5. **Q**: Name three important differences between list \`L.sort()\` and built-in \`sorted(L)\`.
   **A**: (1) \`.sort()\` is in-place, \`sorted()\` returns a NEW list. (2) \`.sort()\` returns \`None\`, \`sorted\` returns the list. (3) \`.sort()\` is only on lists; \`sorted\` accepts any iterable.

6. **Q**: How do you swap \`a\` and \`b\` without a temporary variable?
   **A**: \`a, b = b, a\` — tuple packing on the RHS, unpacking on the LHS.

---
### Quiz (MCQ)

1. **List literal is:**
   A) \`{1,2,3}\`
   B) \`[1,2,3]\`
   C) \`(1,2,3)\`
   D) \`<1,2,3>\`
   **Correct: B**

2. **\`(x,)\` creates:**
   A) A 2-tuple
   B) Syntax error
   C) A 1-tuple
   D) An integer in parens
   **Correct: C**

3. **\`L = [3,1,2]; M = L.sort(); print(M)\` prints:**
   A) \`[3,1,2]\`
   B) \`[1,2,3]\`
   C) \`None\`
   D) TypeError
   **Correct: C** (`.sort()` mutates and returns None)

4. **Slice \`'abcdef'[1:5:2]\` returns:**
   A) \`'bd'\`
   B) \`'ace'\`
   C) \`'bcde'\`
   D) \`'abcf'\`
   **Correct: A** (indices 1…4 step 2: [1,3] → 'b','d')

5. **Which is true about tuples?**
   A) Tuples can grow with \`.append\`
   B) Tuples are mutable
   C) Tuples can be keys in dicts
   D) Tuples cannot contain lists
   **Correct: C**

6. **\`a, *b = [1,2,3,4]\` — \`b\` is:**
   A) \`[2,3,4]\`
   B) \`2\`
   C) \`4\`
   D) \`(2,3,4)\`
   **Correct: A**
`,
  },
  {
    sectionTitle: 'Collections (List, Tuple, Set, Dict)',
    sectionOrder: 8,
    lessonOrder: 1,
    title: 'Dictionaries and Sets',
    slug: 'python-dicts-sets',
    estimatedMinutes: 45,
    content: `## Introduction

When you need to look things up FAST, nothing beats the hash-based pair of **dictionaries** (\`dict\`: unique key → value) and **sets** (\`set\`: unique values with membership testing). Together they account for a huge portion of Python's expressive power and performance.

## Definition

- A **dictionary (\`dict\`)** is an *unordered* (insertion-ordered since 3.7) collection of \`key: value\` pairs where keys are unique and **hashable** (usually strings, numbers, tuples). Literal: \`{'a': 1, 'b': 2}\`.
- A **set** is an unordered collection of *unique, hashable* items. Literal: \`{'a','b','c'}\` (note: \`{}\` is a dict, not an empty set — use \`set()\`).
- A **\`frozenset\`** is an immutable variant of \`set\` (and therefore hashable itself).

## Why It Exists

Lists force O(n) linear scans to find an entry by a property. In a dict or set, lookup, insert, and delete are all **average O(1)**. This changes everything: frequency counts, deduplication, join-like operations, caches, and lookups-by-name become trivially cheap.

Dicts also give Python a natural way to represent configs, JSON payloads, database rows, and application state — all as named mappings.

## How It Works

When you write \`d[k] = v\`, Python:
1. Computes \`hash(k)\` (a deterministic "fingerprint" integer).
2. Mods the hash by the internal table size to pick a bucket.
3. Stores both \`(k, v)\` in that bucket. If the bucket already has an entry with the same key, the value is updated; otherwise it's appended.

Retrieval repeats the same hash + bucket process and compares keys with \`==\` inside the bucket if multiple collided. As the table fills (>2/3), Python transparently resizes (doubles size) and rehashes.

Since Python 3.7 dicts **preserve insertion order** as a language guarantee. Sets do not.

Key dict methods: \`d.get(k, default)\`, \`d.keys()\`, \`d.values()\`, \`d.items()\`, \`d.setdefault(k, default)\`, \`d.pop(k)\`, \`d.update(other)\`, \`d.popitem()\` (LIFO since 3.7).

Key set methods: \`s.add(x)\`, \`s.discard(x)\`, \`s.remove(x)\`, \`s.union(t)=s|t\`, \`s.intersection(t)=s&t\`, \`s.difference(t)=s-t\`, \`s.issubset(t)=s<=t\`.

## Syntax

\`\`\`python
config = {'host': 'localhost', 'port': 5432, 'debug': True}
config['port'] = 6432                  # assign/update
print(config['host'])                  # lookup
print(config.get('user', 'admin'))     # safe lookup with default

# Dict comprehension
squares = {n: n*n for n in range(5)}   # {0:0, 1:1, 2:4, 3:9, 4:16}

# Set literal + set comprehension
primes = {2, 3, 5, 7, 11, 13}
odds = {x for x in range(10) if x % 2}  # {1, 3, 5, 7, 9}

# Set algebra
print(primes & odds)                   # intersection: {3, 5, 7, 13? no, 13 is odd. Yes.}
print(primes | odds)                   # union
print(primes - odds)                   # difference: {2}
\`\`\`

## Real World Example

Counting word frequencies in a text file — the classic "hello, dict!" problem:

\`\`\`python
text = """the quick brown fox jumps over the lazy dog the fox the dog"""
from collections import Counter

# Counter is dict subclass. You can also build it manually with `.setdefault`.
counts = Counter(text.split())
for word, tally in counts.most_common(5):
    print(f'{word:8s}  {tally}×')
# the       4×
# fox       2×
# dog       2×
# quick     1×
# brown     1×
\`\`\`

## Code Examples

### Example 1 – Safe dict patterns (no KeyError)

\`\`\`python
grades = {'Ada': 'A', 'Linus': 'B'}
# 1) .get
print(grades.get('Grace', 'F'))                 # F

# 2) .setdefault – initializes a missing key exactly once
group_index = {}
for name, grp in [('A','x'),('B','y'),('C','x')]:
    group_index.setdefault(grp, []).append(name)
print(group_index)  # {'x': ['A','C'], 'y': ['B']}

# 3) defaultdict – auto-creates any missing key
from collections import defaultdict
dd = defaultdict(int)
for w in ['a','b','a','c','b','a']:
    dd[w] += 1
print(dict(dd))      # {'a':3, 'b':2, 'c':1}
\`\`\`

### Example 2 – Set for de-duplication + membership

\`\`\`python
email_list = ['a@ex.com','b@ex.com','a@ex.com','c@ex.com','b@ex.com']
unique = list(set(email_list))      # de-duplicate (order may change!)
print(unique)                       # ['a@ex.com','b@ex.com','c@ex.com']

# Set membership is O(1) – essential when doing lots of lookups
allowed = {'read','write','exec'}
def check(token): return token in allowed
\`\`\`

### Example 3 – Dictionary iteration (three flavours)

\`\`\`python
capitals = {'KA':'Bengaluru','MH':'Mumbai','TN':'Chennai','KL':'Thiruvananthapuram'}
for state in capitals:                          # by key
    print(state, end=' ')
print()
for city in capitals.values():                  # by value
    print(city, end=' ')
print()
for state, city in capitals.items():            # by key+value (most common)
    print(f'{state} → {city}')
# KA → Bengaluru
# MH → Mumbai
# TN → Chennai
# KL → Thiruvananthapuram
\`\`\`

## Best Practices

- **Use \`.get(key, default)\` instead of a try/except KeyError** when the missing case is normal.
- **Use comprehensions, not loops + \`__setitem__\`**, whenever the rule is a simple expression.
- **Use \`Counter\` / \`defaultdict\` / \`OrderedDict\` / \`ChainMap\`** from \`collections\` — avoid reinventing these wheels.
- **Sets are for membership and set-algebra, NOT for indexing.** If you need order plus unique, use \`dict.fromkeys(iterable).keys()\` or a 3.7+ dict-of-None pattern.
- **Never modify a dict/set while iterating over it.** The iterator protocol gets confused and you'll miss items or get RuntimeError. Iterate over a \`list(...)\` snapshot.
- **Key types must be hashable**: scalars + tuples of hashables work. Lists, dicts, sets themselves cannot be keys (use tuples / frozensets instead).

## Common Mistakes

- **\`empty_set = {}\` creates a dict!** Correct: \`empty_set = set()\`.
- **Iterating keys and doing nested lookups when \`.items()\` exists**: \`for k, v in d.items()\` avoids a redundant \`d[k]\` lookup.
- **Raising KeyError in user-facing code** just because a key is absent. Handle it with \`.get\`, \`.setdefault\`, or \`try/except KeyError\` with a friendlier error message.
- **Using list-of-tuple lookups** instead of building an index dict once — a classic O(n²) performance bug.
- **Mutability inside keys**: putting a list inside a tuple that you use as a key still works — until you later mutate the list through another reference, breaking hash consistency and causing the key to become unfindable.
- **Confusing \`==\` and \`in\` with sets**: \`x in S\` checks membership, \`S == T\` compares contents. Use subset (\`<= / issubset\`) when appropriate.

## Summary

\`dict\` maps unique hashable keys to values with average O(1) lookup/insert/delete. Since Python 3.7 it preserves insertion order. \`set\` holds unique hashable values and supports mathematical set operations (union, intersection, difference, subset) at speed. Both use hash tables under the hood. Reach for dicts to represent records and indices, sets for de-duplication and membership tests, and consider the specialised types in \`collections\` (Counter, defaultdict, etc.) to avoid re-implementing common patterns. Dicts and sets are the fastest, most under-appreciated performance tools in the Python standard library.

---
### Practice Questions

1. **Q**: How do you create an EMPTY set literal?
   **A**: You cannot use \`{}\` because that is a dict — write \`set()\`.

2. **Q**: Write a one-liner to get the keys of dict \`d\` as a list.
   **A**: \`list(d.keys())\`. Or since Python 3.x unpacking: \`[*d]\`.

3. **Q**: What's the difference between \`d['k']\` and \`d.get('k')\` when \`'k'\` is not in \`d\`?
   **A**: \`d['k']\` raises \`KeyError\`; \`d.get('k')\` returns \`None\` (or a provided default).

4. **Q**: Why can't a list be used as a dictionary key?
   **A**: Because lists are mutable and do not have a stable \`__hash__\`. Hash table keys must be hashable — typically immutable.

5. **Q**: You have a list \`words\` with many duplicates. What's the fastest Pythonic way to count each word's occurrences?
   **A**: \`from collections import Counter; counts = Counter(words)\`.

6. **Q**: Why is \`if x in S:\` on a set MUCH faster than \`if x in L:\` on a list?
   **A**: Set membership uses hash-table lookup — average O(1). List membership is a linear scan — O(n). The difference becomes enormous as collections grow.

---
### Quiz (MCQ)

1. **\`{}\` creates:**
   A) Empty set
   B) Empty dict
   C) Empty tuple
   D) Syntax error
   **Correct: B**

2. **Which method returns value for \`k\` *without* raising KeyError if missing?**
   A) \`d[k]\`
   B) \`d.value(k)\`
   C) \`d.get(k, fallback)\`
   D) \`d.retrieve(k)\`
   **Correct: C**

3. **\`for k, v in d:\` — without \`.items()\` — on dict d:**
   A) Unpacks (key, value) correctly
   B) Raises TypeError (too many values to unpack)
   C) Assigns only keys to both k, v
   D) Assigns first two chars of each key
   **Correct: B** (always use \`d.items()\` for key-value iteration)

4. **\`{1,2,3} | {3,4,5}\` returns:**
   A) \`{1,2,3,3,4,5}\`
   B) \`{3}\`
   C) \`{1,2,3,4,5}\`
   D) \`{1,2,4,5}\`
   **Correct: C** (union)

5. **Dictionary keys must be:**
   A) Strings only
   B) Integers or strings only
   C) Hashable (immutable-like with a consistent hash)
   D) Any Python object
   **Correct: C**

6. **\`d = {'a':1}; d.update(b=2); print(d)\` prints:**
   A) \`{'a':1}\` – update doesn't work with kwargs
   B) \`{'b':2}\` – replaces contents
   C) \`{'a':1,'b':2}\`
   D) TypeError
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Strings',
    sectionOrder: 9,
    lessonOrder: 0,
    title: 'String Manipulation and Formatting',
    slug: 'python-strings',
    estimatedMinutes: 35,
    content: `## Introduction

Strings are the interface between a program and humans: input, output, configuration, web content, and every user-facing message is a string. Python's \`str\` is a powerful immutable sequence of Unicode code points with dozens of built-in methods. Mastering them is table stakes.

## Definition

A Python 3 **string** (\`str\`) is an immutable sequence of **Unicode code points**. The bytes type (\`bytes\`) is the raw byte representation of encoded text. The conversion between them is explicit: \`bytes → str\` via \`.decode(encoding)\`; \`str → bytes\` via \`.encode(encoding)\`.

String literals support single quotes, double quotes, triple-quoted multiline forms, and f-string interpolation since Python 3.6.

## Why It Exists

Without strings we'd be limited to numbers and symbols. Real software reads CSVs, parses JSON, renders HTML templates, validates emails, and formats reports — all string-heavy work. Python's "batteries-included" string methods let you write clean one-liners for tasks that would be verbose loops in other languages.

## How It Works

Strings are immutable: calling \`s.strip()\` or \`s.replace(...)\` returns a *new* string; the original is untouched. String concatenation is optimized, but repeated \`+= \` inside loops is not — build a list of parts and \`''.join(parts)\` when possible.

Common string methods, grouped by purpose:
- **Case & layout**: \`.lower() .upper() .title() .capitalize() .swapcase() .strip() .lstrip() .rstrip() .center(w) .ljust(w) .rjust(w) .zfill(w)\`
- **Testing**: \`.isdigit() .isalpha() .isalnum() .isspace() .islower() .isupper() .startswith(x) .endswith(x)\`
- **Searching & replacing**: \`.find(sub) .rfind(sub) .index(sub) .count(sub) .replace(old, new, max)\`
- **Splitting & joining**: \`.split(sep, max) .rsplit(sep, max) .splitlines() .partition(sep) .rpartition(sep) .join(iterable)\`
- **Translation**: \`str.maketrans(dict) + s.translate(table)\`

## Syntax

\`\`\`python
msg = "  Python is Awesome!  "
print(msg.strip())                     # "Python is Awesome!"
print(msg.lower().count('is'))         # 1 (after case-lowering)
print('Ada'.startswith('A'), 'code.py'.endswith('.py'))  # True True

tokens = 'one, two, three, four'.split(', ')     # ['one','two','three','four']
print(' | '.join(tokens))              # one | two | three | four

# Triple-quoted strings (preserve newlines)
sql = '''SELECT id, name
           FROM users
          WHERE active = true'''

# f-string formatting
who, score = "Ada", 98.4567
print(f"{who:>10s} scored {score:.2f}%")
# "       Ada scored 98.46%"
\`\`\`

## Real World Example

A user-input sanitizer that validates email-like strings and formats names for storage:

\`\`\`python
def clean_email(raw: str) -> str | None:
    s = (raw or '').strip().lower()
    if s.count('@') != 1: return None
    local, _, domain = s.partition('@')
    if not local or not domain: return None
    if '.' not in domain:      return None
    return f'{local}@{domain}'

def format_name(raw: str) -> str:
    return raw.strip().title()

print(clean_email('   Ada@Example.COM  '))     # ada@example.com
print(format_name('  liNUs toRvalds'))         # Linus Torvalds
\`\`\`

## Code Examples

### Example 1 – Classic fizzbuzz with \`% / //\` and string join

\`\`\`python
def fizzbuzz(n):
    out = []
    for i in range(1, n+1):
        if i % 15 == 0:   out.append('FizzBuzz')
        elif i % 3 == 0:  out.append('Fizz')
        elif i % 5 == 0:  out.append('Buzz')
        else:             out.append(str(i))
    return ', '.join(out)

print(fizzbuzz(15))
# 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz
\`\`\`

### Example 2 – str.translate for char-level substitutions

\`\`\`python
leak = str.maketrans({'a': '4', 'e': '3', 'l': '1', 'o': '0', 's': '5', 't': '7'})
print('leet speak'.translate(leak))             # 1337 5p34k
\`\`\`

### Example 3 – Splitting with partition vs split

\`\`\`python
text = 'key=value=extra'
parts = text.split('=', 1)                      # stop after 1 split
print(parts)                                     # ['key','value=extra']

k, eq, v = text.partition('=')                   # always 3 parts
print(f'{k!r} {eq!r} {v!r}')                    # 'key' '=' 'value=extra'
\`\`\`

## Best Practices

- **Use f-strings** for string interpolation by default. Fall back to \`str.format()\` only when you need to re-use a template.
- **Avoid the \`%\` printf-style operator** in new code. It's limited and error-prone.
- **Build long strings with lists + \`''.join()\`** inside loops. Each \`+= \` on a string creates a new object and can lead to O(n²) time.
- **Prefer \`.partition(sep)\` over \`.split(sep, 1)\`** when you expect exactly one separator — the 3-way unpacking is clearer than a 2-element list.
- **For "normalization" pipelines** (trim → collapse whitespace → case), compose method calls left-to-right in a single expression.
- **Decode bytes as early as possible** and encode as late as possible. Keep everything inside the program as \`str\` — this avoids "unicode sandwich" bugs.

## Common Mistakes

- **Confusing membership**: \`if 'a' in 'apple'\` is true. \`if 'a' in ['apple']\` is false. Pay attention to the right-hand type.
- **Expecting string methods to mutate the original.** None do — they always return a new string. \`s.strip()\` without assigning the result does nothing.
- **Using \`==\` to compare unicode with visually identical but different code points** (NFC vs NFD). Use \`unicodedata.normalize\` before comparing real-world text.
- **Off-by-one errors with slices like \`s[:-1]\` or \`s[1:-1]\`**. Trace through small examples manually.
- **Implicit bytes/str mixing in Python 3.** It raises \`TypeError\` immediately — that's a feature, not a bug! Decode/encode explicitly.
- **Format spec typos in f-strings**: \`f\"{x .2f}\"` (missing colon) raises \`SyntaxError\`. Always \`f\"{x:.2f}\"\`.

## Summary

Strings in Python 3 are immutable Unicode sequences. They come with 40+ battle-tested methods for case conversion, searching, splitting, joining, translating, and formatting. When you need string building, compose lists of pieces and join them. When you need interpolation, f-strings are the default. Be strict about the bytes/str boundary to avoid encoding pain. Because strings underlie almost every I/O operation, mastery of this one type will make you dramatically more productive across every domain.

---
### Practice Questions

1. **Q**: How do you remove *only* leading whitespace from a string \`s\`?
   **A**: \`s.lstrip()\`.

2. **Q**: What does \`s.partition(sep)\` return?
   **A**: A 3-tuple \`(before, sep, after)\`. If \`sep\` is absent, returns \`(s, '', '')\`.

3. **Q**: Given \`path = '/var/log/app.log'\` — how do you get the file extension?
   **A**: \`path.rpartition('.')[-1]\` or \`path.split('.')[-1]\`. \`rpartition\` handles multi-dot names gracefully.

4. **Q**: Most efficient way to concatenate 100,000 small strings?
   **A**: Append them to a list, then call \`''.join(list)\` once at the end. *Never* use \`+= \` in a hot loop.

5. **Q**: How to check if a string \`pw\` is all numeric?
   **A**: \`pw.isdigit()\` returns True only if every character is a digit AND the string is non-empty. Note: fractions, decimals, minus signs are *not* digits.

6. **Q**: Difference between \`.find(x)\` and \`.index(x)\` when \`x\` is absent?
   **A**: \`.find(x)\` returns \`-1\`. \`.index(x)\` raises \`ValueError\`. Use whichever error semantics you need.

---
### Quiz (MCQ)

1. **Python 3 strings are sequences of:**
   A) ASCII bytes
   B) UTF-8 bytes
   C) Unicode code points
   D) 16-bit UTF-16 words
   **Correct: C**

2. **\`s = 'hello'; s.upper(); print(s)\` prints:**
   A) \`HELLO\`
   B) \`hello\`
   C) \`None\`
   D) Syntax error
   **Correct: B** (strings are immutable — you must re-assign)

3. **Best way to split \`'a:b:c:d:e'\` into \`['a','b:c:d:e']\` (first separator only):**
   A) \`s.split(':', 1)\`
   B) \`s.partition(':')\`
   C) \`s.split(':')[:1]\`
   D) A and B both work for slightly different use cases
   **Correct: D** (partition returns 3-tuple, split returns list)

4. **\`'abcdef'.endswith(('f','e','d'))\` — tuple form checks:**
   A) Always False — endswith takes a single arg
   B) True if ANY of the suffixes match
   C) True only if ALL match
   D) raises TypeError
   **Correct: B**

5. **\`', '.join([1, 2, 3])\`:**
   A) Returns \`'1, 2, 3'\`
   B) Returns \`'123'\`
   C) TypeError — join requires str items
   D) Returns None
   **Correct: C** (use \`[str(x) for x in nums]\` first)

6. **Which is always True for any non-empty string s?**
   A) \`s == s.upper().lower()\`
   B) \`s[::-1][::-1] == s\`
   C) \`s.capitalize() == s.title()\`
   D) \`s + s == s * 3\`
   **Correct: B** (double reverse is identity)
`,
  },
  {
    sectionTitle: 'File Handling',
    sectionOrder: 10,
    lessonOrder: 0,
    title: 'Working with Files and Text I/O',
    slug: 'python-file-handling',
    estimatedMinutes: 40,
    content: `## Introduction

Any program that persists state, reads datasets, produces reports, or ships logs must deal with files. Python's file I/O is built around the \`open()\` built-in and the **context manager** syntax \`with open(...)\`. A few small patterns cover 99% of everyday file work — and the \`pathlib\` module brings modern object-oriented path handling.

## Definition

**File I/O** is the process of reading data from permanent storage (disk, SSD) into a program's memory and writing data back out. Files are opened in **text mode** (\`'rt'\`, returns strings, applies encoding + newline translation) or **binary mode** (\`'rb'\`, returns raw bytes, no translation). A **context manager** (\`with ...:\`) guarantees the file is closed when the block ends — even if an exception is thrown.

## Why It Exists

Without file I/O, every run of a program would start fresh with no memory of previous runs. Data persistence, configuration, ML datasets, CSV/JSON/XML imports and exports, logging, web uploads — every non-trivial application relies on files sooner or later.

## How It Works

\`open(path, mode='r', encoding=None)\` returns a **file object**. The first character of \`mode\` is:
- \`'r'\` – open for reading (default). File must exist.
- \`'w'\` – open for writing, **truncating to zero bytes if it already exists**.
- \`'a'\` – open for appending; new data is written at end.
- \`'x'\` – exclusive creation, fails if the file already exists.

Add \`'b'\` for binary mode, \`'+'\` for read+write.

Text mode defaults to your platform encoding (use \`encoding='utf-8'\` explicitly for portability). After use, files must be closed with \`.close()\` — but the \`with open(...) as f:\` context manager does this for you, even on error.

Useful methods on file objects:
- Reading: \`.read(n)\` (n chars/bytes or whole file), \`.readline()\`, \`.readlines()\`, OR simply **iterate** \`for line in f:\`.
- Writing: \`.write(text_or_bytes)\`, \`.writelines(lines)\` (does NOT add newlines automatically).

## Syntax

\`\`\`python
# ★ Read entire file into one string
with open('poem.txt', encoding='utf-8') as f:
    text = f.read()

# ★ Read line-by-line – memory efficient for big files
with open('access.log', encoding='utf-8') as f:
    for i, line in enumerate(f, start=1):
        if 'ERROR' in line:
            print(i, line.rstrip())

# ★ Write/overwrite a file
with open('results.txt', 'w', encoding='utf-8') as f:
    f.write('Header line\\n')
    f.writelines(f'{i} squared = {i*i}\\n' for i in range(1, 6))

# ★ Append
with open('results.txt', 'a', encoding='utf-8') as f:
    print('Done', file=f)      # print(..., file=f) redirects to f
\`\`\`

## Real World Example

A small log parser that scans a webserver access log and writes only 5xx server-error lines to a new report:

\`\`\`python
from datetime import datetime

input_path, output_path = 'access.log', '5xx-report.txt'
count = 0
start = datetime.now()

with open(input_path, encoding='utf-8') as fi, \\
     open(output_path, 'w', encoding='utf-8') as fo:
    fo.write(f'Report generated {start.isoformat(timespec="seconds")}\\n\\n')
    for lineno, line in enumerate(fi, 1):
        parts = line.split()
        status = parts[8] if len(parts) >= 9 else ''
        if status.startswith('5'):
            count += 1
            fo.write(f'line {lineno:06d}: {line}')

print(f'Wrote {count} server-error lines to {output_path} in {datetime.now()-start}')
\`\`\`

## Code Examples

### Example 1 – pathlib: object-oriented paths (Python 3.4+)

\`\`\`python
from pathlib import Path

p = Path.cwd() / 'data' / 'scores.csv'   # build path portably
print(p.exists(), p.is_file(), p.parent)  # True True /home/u/proj/data
p.parent.mkdir(parents=True, exist_ok=True)  # mkdir -p
p.write_text('name,score\\nAda,100\\n', encoding='utf-8')   # write a whole file
print(p.read_text(encoding='utf-8').splitlines())
# ['name,score', 'Ada,100']
\`\`\`

### Example 2 – CSV module for proper comma/quote handling

\`\`\`python
import csv, io

text = '''name,age,city
Ada Lovelace,207,London
Grace Hopper,117,Arlington
Linus Torvalds,54,Helsinki
'''
reader = csv.DictReader(io.StringIO(text))
for row in reader:
    print(f'{row["name"]:20s} from {row["city"]:12s} age {row["age"]}')
# Ada Lovelace          from London       age 207
# Grace Hopper         from Arlington    age 117
# Linus Torvalds       from Helsinki     age 54
\`\`\`

### Example 3 – Safe tempfile + atomic rename

\`\`\`python
import os, tempfile

def atomic_write(path: str, text: str, encoding='utf-8'):
    """Write file atomically: write to tmp in same dir, then rename."""
    directory = os.path.dirname(path) or '.'
    fd, tmp_path = tempfile.mkstemp(prefix='.tmp_', dir=directory)
    try:
        with os.fdopen(fd, 'w', encoding=encoding) as f:
            f.write(text)
        os.replace(tmp_path, path)
    except Exception:
        if os.path.exists(tmp_path): os.remove(tmp_path)
        raise

atomic_write('note.txt', 'Hello, world – safely written.')
print(open('note.txt').read())
# Hello, world – safely written.
\`\`\`

## Best Practices

- **Always use \`with open(...)\`** instead of raw \`open()/close()\`. The context manager guarantees cleanup on exceptions.
- **Always pass \`encoding='utf-8'\` explicitly** in text mode — platform defaults vary.
- **Use \`for line in f:\`** to stream large files line-by-line rather than \`f.read()\` which slurps everything into memory.
- **Use \`pathlib.Path\`** instead of raw \`os.path\` string manipulation in new code. It's far less error-prone.
- **Use CSV/JSON/Pickle modules for structured formats instead of inventing your own parsing.** Roll-your-own parsers always miss the edge cases.
- **Know the modes:** \`'w'\` truncates! If you're editing a file, read it first, then write — or use a tempfile-and-rename pattern for safety.

## Common Mistakes

- **Forgetting to close a file opened without \`with\`.** GC will eventually close it, but file descriptors are a finite system resource — you'll get \`OSError: Too many open files\` under load.
- **Opening binary data in text mode** and being surprised at UnicodeDecodeError. Images, PDFs, zip archives, .pkl, and executables all need mode \`'rb'\`.
- **Using \`.writelines()\` without newline characters.** It's just a loop of \`.write()\` calls — you provide all separators.
- **Race conditions between \`os.path.exists(path)\` checks and the actual open.** Use mode \`'x'\` (exclusive create) or atomic write via tempfile + rename instead.
- **Opening a file in \`'w'\` mode when you meant \`'r'\`.** Boom — all original content deleted before you blink. Pay attention to the first character.
- **Trailing newlines and \`print(line)\` double-spacing.** Remember to \`line.rstrip('\\n')\` or use \`print(line, end='')\`.

## Summary

Files are opened with \`open(path, mode, encoding=...)\`. Wrap every open in a \`with\` context manager so files close automatically. Use text mode for strings, binary mode for everything else. Read large files line-by-line with \`for line in f:\`. Prefer \`pathlib.Path\` for path manipulation, the \`csv\` module for CSV, and \`json\` module for JSON. Avoid direct \`open+close\`, always specify encoding, and never confuse read (\`'r'\`) with write (\`'w'\`) — the latter silently destroys data. With these habits, file code becomes safe, correct, and portable.

---
### Practice Questions

1. **Q**: What's wrong with \`f = open('x.txt'); print(f.read())\`?
   **A**: No guarantee \`f.close()\` ever runs. If an exception is raised during read, Python leaks a file descriptor. Fix: wrap in \`with open('x.txt') as f:\`.

2. **Q**: What is the difference between modes \`'r'\`, \`'w'\`, \`'a'\`, and \`'x'\`?
   **A**: \`'r'\` read (must exist). \`'w'\` write – create/truncate. \`'a'\` append – create/seek-end. \`'x'\` exclusive create – fail if exists.

3. **Q**: When reading a 50 GB log file, why should you avoid \`f.read()\`?
   **A**: It tries to load 50 GB into RAM. Iterate \`for line in f:\` instead — constant memory per line.

4. **Q**: How do you open a CSV file for reading with proper UTF-8 and BOM handling on Windows?
   **A**: \`with open('f.csv', encoding='utf-8-sig') as f:\` — the \`-sig\` variant strips the leading U+FEFF BOM that Excel loves to add.

5. **Q**: Why is \`tempfile + os.replace\` a better way to write a config file than a plain \`open(name, 'w')\`?
   **A**: It's atomic. If the program crashes mid-write the original file is intact. The rename swaps the new version into place instantly. Readers never see a half-written file.

6. **Q**: What does \`for line in f: print(line)\` usually print with a blank line BETWEEN lines?
   **A**: Each line in the file already contains a trailing \`'\\n'\`, and \`print()\` adds *another* newline. Fix with \`print(line, end='')\` or \`print(line.rstrip())\`.

---
### Quiz (MCQ)

1. **Context manager syntax for files is:**
   A) \`file 'x.txt' as f:\`
   B) \`using open('x.txt') as f:\`
   C) \`with open('x.txt') as f:\`
   D) \`open('x.txt') |f|:\`
   **Correct: C**

2. **Opening in \`'w'\` mode:**
   A) Reads a file
   B) Appends to end
   C) Creates OR truncates the file to 0 bytes
   D) Fails if file exists
   **Correct: C**

3. **Binary mode is signaled by:**
   A) \`binary=True\`
   B) Appending \`b\` to mode string, e.g., \`'rb'\`
   C) \`.binread()\` method
   D) Implicit for any .bin filename
   **Correct: B**

4. **File objects are iterable line-by-line with:**
   A) \`f.lines()\`
   B) \`for line in f.readlines():\` only
   C) \`for line in f:\`
   D) \`foreach line in f:\`
   **Correct: C**

5. **\`print("Hello", file=f)\` does what?**
   A) Prints to stdout AND f
   B) Writes "Hello\\n" to file f via print's file argument
   C) Raises — print can only write to console
   D) Opens f automatically
   **Correct: B**

6. **Most OS-portable way to build \`subdir/file.txt\` path?**
   A) \`subdir + '/' + file.txt\`
   B) \`os.path.join('subdir','file.txt')\` or \`Path('subdir') / 'file.txt'\`
   C) Hard-code backslashes on Windows
   D) Concatenate via f-string with platform checks
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Modules & Packages',
    sectionOrder: 11,
    lessonOrder: 0,
    title: 'Modules, Packages and the Import System',
    slug: 'python-modules-packages',
    estimatedMinutes: 30,
    content: `## Introduction

A one-file script is a toy. Real applications grow into many files that import from each other. Python's module system — individual \`.py\` files as **modules** and directories of modules as **packages** — plus the \`import\` keyword, is how every real project is organized.

## Definition

- A **module** is any \`.py\` file (or C extension, etc.) that can be imported. Importing runs its top-level code *once* and exposes its namespace.
- A **package** is a directory containing modules (and usually a \`__init__.py\` file, or a namespace-package without one). It enables dotted imports like \`pkg.subpkg.mod\`.
- **\`sys.path\`** is the list of directories Python searches when you import. The script's own directory, virtualenv \`site-packages\`, and the standard library all live here.

## Why It Exists

Without modules, every project would be one enormous \`.py\` file — impossible to navigate, test, or collaborate on. Modules break logic along boundaries. Packages give you dotted namespaces so your \`auth\` module doesn't collide with a third-party library's \`auth\` module.

## How It Works

When you run \`import foo.bar\`:
1. Python checks \`sys.modules\` cache (already-imported modules dict) to see if \`foo\` and \`foo.bar\` are already loaded. If so, reuses them.
2. Otherwise, resolves the module's file location using \`sys.path\` order.
3. Creates an empty module object, adds to cache (to prevent circular-import infinite regress).
4. Executes the module's top-level statements in that object's namespace.
5. Binds the module to a name in the importing scope.

You can also:
- \`import X as Y\` for renames
- \`from pkg.mod import name1, name2\` to bind specific names directly
- \`from pkg.mod import *\` (bad style outside REPL) imports everything listed in \`__all__\`.

## Syntax

\`\`\`python
# mypkg/__init__.py (can be empty, or publish public API)
# from .core import User, signup
# __all__ = ['User', 'signup']

# mypkg/core.py
"""Core user logic."""
import hashlib                    # standard library import
from os import path as os_path    # import + rename
DEFAULT_SALT = 's3cret!'          # top-level constant – runs once on import

def hash_password(pwd: str, salt: str = DEFAULT_SALT) -> str:
    return hashlib.sha256((salt + pwd).encode()).hexdigest()

# consumer file elsewhere
from mypkg.core import hash_password
print(hash_password('welcome123'))
\`\`\`

## Real World Example

A typical medium-sized project layout using packages:

\`\`\`
myapp/
├─ main.py                # entry point
└─ myapp/                 # the package
   ├─ __init__.py         # empty OR exposes public API
   ├─ config.py           # constants / settings
   ├─ db.py               # database client
   ├─ models/             # sub-package
   │  ├─ __init__.py
   │  ├─ user.py
   │  └─ product.py
   └─ utils/              # sub-package
      ├─ __init__.py
      ├─ validators.py
      └─ formatting.py

# In main.py:
from myapp.config import DEBUG
from myapp.models.user import User
from myapp.utils.validators import is_email
\`\`\`

## Code Examples

### Example 1 – \`if __name__ == '__main__':\` guard

\`\`\`python
# greet.py — acts as module AND runnable script
def say_hello(name):
    return f'Hello, {name}!'

if __name__ == '__main__':               # runs ONLY when executed directly
    import sys
    who = sys.argv[1] if len(sys.argv) > 1 else 'World'
    print(say_hello(who))
\`\`\`

### Example 2 – Finding a module's path & listing its attributes

\`\`\`python
import json
print(json.__file__)                    # ...python3.x/json/__init__.py
print([n for n in dir(json) if not n.startswith('_')])
# ['JSONDecodeError','JSONDecoder','JSONEncoder','decoder','detect_encoding',
#  'dump','dumps','encoder','load','loads','scanner']
\`\`\`

### Example 3 – Relative imports inside a package

\`\`\`python
# Inside mypkg/utils/formatting.py, importing from sibling package
from ..models.user import User          # up one dir from utils → mypkg, then models.user

def render_user(u: User) -> str:
    return f'<{u.id}: {u.name}>'
\`\`\`

## Best Practices

- **Use absolute imports** (\`from mypkg.auth import login\`) in project code. Relative imports only within the package for internal cross-links.
- **Always guard scripts with \`if __name__ == '__main__':\`.** It lets the same file be imported (without side effects) and executed.
- **Keep module-level side effects to zero.** Importing should define things, not connect to databases, write files, or start threads.
- **Use \`__all__ = [...]\`** in your \`__init__.py\` to publish the public API of a package and keep internal helpers truly internal.
- **Install your own project in editable mode** (\`pip install -e .\`) in a venv, so \`import mypkg\` works from any working directory, not just the project root.
- **Avoid circular imports** (A imports B imports A) — if you get one, extract the shared pieces into a small, pure third module C that both A and B import.

## Common Mistakes

- **Naming a file the same as a stdlib/3rd-party module**, e.g., \`json.py\`, \`requests.py\`. Your own file will win and shadow the real one, breaking every other import in the program.
- **Running a script from INSIDE the package** causes broken relative imports. Always run scripts from the project root: \`python -m mypkg.script\` (module form) rather than \`python mypkg/script.py\`.
- **Relying on the current working directory being on \`sys.path\`.** Use virtualenvs + \`pip install -e .\` to make imports robust.
- **\`from mod import *\` in production code.** It pollutes namespaces, hides where names come from, and enables bugs. Import specific names, or import the module and use dot access.
- **Changing mutable module-level constants as a shortcut.** Other code caching the old value won't see changes. Prefer functions returning fresh values or a proper config object.
- **Forgetting that the top-level code of a module runs EXACTLY ONCE** — on first import. It's not a place for dynamic, repeatable logic.

## Summary

Modules (\`.py\` files) and packages (directories of modules) organize code at scale. Import statements run a module's top-level code once, cache it in \`sys.modules\`, then bind names. Use absolute imports and install your own package editable-mode. Guard runnable scripts with \`if __name__ == '__main__':\`. Never name files after stdlib modules. Follow these rules and your Python projects will scale cleanly from a single file to a hundred files without import nightmares.

---
### Practice Questions

1. **Q**: What is the purpose of a \`__init__.py\` file in a directory?
   **A**: Traditionally it marks the directory as a Python package. In modern Python (3.3+) namespace packages can omit it, but \`__init__.py\` is still required if you want eager package discovery, \`__all__\` public-API exports, or initialization code.

2. **Q**: What's the difference between \`import os.path\` and \`from os import path\`?
   **A**: After \`import os.path\` you access it as \`os.path.exists(...)\`. After \`from os import path\` you access it directly as \`path.exists(...)\`. Same underlying module, different binding in your scope.

3. **Q**: A module's top-level code runs how many times?
   **A**: Exactly once — on its first import anywhere. Subsequent imports return the same cached module object from \`sys.modules\`.

4. **Q**: Why should you avoid naming a script file \`requests.py\` in a project that uses the Requests library?
   **A**: Your local \`requests.py\` will shadow the installed library. Every \`import requests\` will load YOUR file instead, and then \`requests.get()\` will be missing or wrong.

5. **Q**: What is the idiom \`if __name__ == '__main__':\` used for?
   **A**: To mark code that runs only when the file is executed directly as a script, not when it is imported as a module by another file.

6. **Q**: A Python program has circular imports: \`a.py\` imports \`b.py\` and \`b.py\` imports \`a.py\`. What happens?
   **A**: Python breaks the cycle using the \`sys.modules\` cache: a partially-populated module object is inserted *before* its top-level runs. This often leads to confusing \`ImportError: cannot import name X\` bugs. Refactor: move shared definitions into a third module C.

---
### Quiz (MCQ)

1. **A module is:**
   A) A class in OOP
   B) Any \`.py\` file importable by Python
   C) A function decorator
   D) A built-in keyword
   **Correct: B**

2. **\`from math import sqrt as sq\`:**
   A) Copies math module to sq variable
   B) Binds the name \`sq\` to math.sqrt
   C) Renames the math file
   D) Imports everything except sqrt
   **Correct: B**

3. **Which check lets a file work as both script and module?**
   A) \`if __main__:\`
   B) \`if __name__ == '__main__':\`
   C) \`if script_mode():\`
   D) \`unless imported:\`
   **Correct: B**

4. **Importing a module twice runs its top-level code:**
   A) Twice
   B) Once — cached in \`sys.modules\`
   C) Zero times (lazy)
   D) Only if marked \`@reimportable\`
   **Correct: B**

5. **Dotted name \`pkg.sub.mod\` indicates:**
   A) A single long filename \`pkg.sub.mod.py\`
   B) Package pkg → subpackage sub → module mod.py
   C) Three classes named pkg, sub, mod
   D) A tuple of three modules
   **Correct: B**

6. **Which import style is preferred for readability?**
   A) \`from X import *\`
   B) Wildcard + globals()
   C) Specific names: \`from X import a, b, c\`
   D) \`eval(open('X.py').read())\`
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Object Oriented Programming',
    sectionOrder: 12,
    lessonOrder: 0,
    title: 'Classes and OOP Basics',
    slug: 'python-oop-basics',
    estimatedMinutes: 45,
    content: `## Introduction

Functions package behavior; classes package behavior AND state together. Object-oriented programming in Python is deliberately lightweight — no boilerplate declarations like interfaces or header files. A single \`class\` keyword, a constructor \`__init__\`, and a handful of dunder methods cover 99% of everyday use.

## Definition

A **class** is a blueprint for creating **objects** (instances). Classes combine:
- **Attributes / fields** — data stored per-instance (\`self.name\`)
- **Methods** — functions that operate on that data and receive the instance as the implicit first argument \`self\`.
- A **constructor** (\`__init__\`) that initializes attributes on a freshly-allocated instance.

Python uses **dunder** (double-underscore) methods for operator overloading, string representation, and lifecycle hooks: \`__repr__\`, \`__len__\`, \`__eq__\`, \`__str__\`, etc.

## Why It Exists

Some problems are simply easier to model as nouns with verbs: a \`BankAccount\` (not a bag of separate arrays), a \`ShoppingCart\`, a \`HttpRequest\`. Classes bundle state and the only functions that should touch that state, producing modular, testable, encapsulated code.

## How It Works

When you call \`p = Person('Ada', 36)\`:
1. Python allocates a new, empty \`Person\` instance.
2. It invokes \`Person.__init__(self, 'Ada', 36)\` with \`self\` bound to the new instance.
3. \`__init__\` stores values onto \`self.name\`, \`self.age\` — attributes of the object.
4. The fully-initialized instance is returned and bound to \`p\`.

Method lookup uses the **MRO (Method Resolution Order)**: the instance dict is checked first, then its class, then base classes depth-first-left-to-right. Class attributes shared by all instances live on the class object itself (e.g., constants or counters).

## Syntax

\`\`\`python
class BankAccount:
    TYPE = 'savings'                       # class attribute (shared)

    def __init__(self, owner: str, balance: float = 0.0):  # constructor
        self.owner = owner                 # instance attribute
        self._balance = balance            # convention: leading _ = "private"

    def deposit(self, amount: float) -> None:
        if amount <= 0: raise ValueError('amount must be positive')
        self._balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self._balance: raise ValueError('insufficient funds')
        self._balance -= amount

    def balance(self) -> float:
        return self._balance

    def __repr__(self) -> str:             # debug-friendly repr
        return f'BankAccount(owner={self.owner!r}, balance={self._balance})'

acc = BankAccount('Ada', 100.0)
acc.deposit(50)
acc.withdraw(30)
print(acc)                                 # BankAccount(owner='Ada', balance=120.0)
print(acc.balance())                       # 120.0
\`\`\`

## Real World Example

An e-commerce \`Order\` class that knows its own lifecycle and can compute totals — bundling state, validation, and behavior in one place:

\`\`\`python
from dataclasses import dataclass
from typing import List

@dataclass
class LineItem:
    sku: str; unit_price: float; qty: int

class Order:
    def __init__(self, order_id: str, items: List[LineItem] | None = None):
        self.order_id = order_id
        self.items: List[LineItem] = list(items or [])
        self.status = 'DRAFT'

    def add(self, li: LineItem) -> None:
        if self.status != 'DRAFT': raise RuntimeError('cannot modify finalized order')
        self.items.append(li)

    def subtotal(self) -> float:
        return round(sum(li.unit_price * li.qty for li in self.items), 2)

    def finalize(self) -> None:
        if not self.items: raise RuntimeError('empty order cannot be finalized')
        self.status = 'PAID'

o = Order('O-1001')
o.add(LineItem('SKU1', 25.0, 2))
o.add(LineItem('SKU2', 40.0, 1))
o.finalize()
print(o.subtotal(), o.status)              # 90.0 PAID
\`\`\`

## Code Examples

### Example 1 – Class methods & static methods

\`\`\`python
class Date:
    def __init__(self, y: int, m: int, d: int): self.y, self.m, self.d = y, m, d

    @classmethod
    def from_iso(cls, s: str):       # "alternative constructor" idiom
        y, m, d = map(int, s.split('-'))
        return cls(y, m, d)          # cls = Date (or subclass!)

    @staticmethod
    def is_leap(y: int) -> bool:     # no cls, no self – pure helper
        return y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)

d = Date.from_iso('2024-02-29')       # uses classmethod
print(d.y, d.m, d.d, Date.is_leap(2024))  # 2024 2 29 True
\`\`\`

### Example 2 – Inheritance basics

\`\`\`python
class Animal:
    def __init__(self, name): self.name = name
    def speak(self): return '…'

class Dog(Animal):                      # inherits from Animal
    def speak(self): return 'Woof!'     # overrides speak()
    def fetch(self, toy): return f'{self.name} fetched {toy}'

class Cat(Animal):
    def speak(self): return 'Meow~'

pets = [Dog('Rex'), Cat('Pippin')]
for pet in pets:
    print(f'{pet.name}: {pet.speak()}')
# Rex: Woof!
# Pippin: Meow~
\`\`\`

### Example 3 – \`@dataclass\` cuts boilerplate (Python 3.7+)

\`\`\`python
from dataclasses import dataclass, field

@dataclass(order=True)                   # generates __init__ __repr__ __eq__ __lt__
class Student:
    name: str
    grade: str
    score: int = 0
    clubs: list[str] = field(default_factory=list)   # mutable default needs factory

s1 = Student('Ada', 'X', 98)
s2 = Student('Linus', 'X', 93)
print(s1)                           # Student(name='Ada', grade='X', score=98, clubs=[])
print(s1 > s2)                      # True – auto ordering by field order (score 98>93)
\`\`\`

## Best Practices

- **Always write \`__repr__\`** (debug repr) for every class. Convention: include constructor-style args so \`eval(repr(x)) == x\` when possible.
- **Use a single leading underscore** (\`_balance\`) for "internal, don't touch" attributes. Python doesn't enforce it, but all tools (linters, docs) respect the convention.
- **Use \`@dataclass\` / \`attrs\`** for pure-data classes — it auto-generates \`__init__\`, \`__repr__\`, equality, and ordering, removing reams of bug-prone boilerplate.
- **Prefer composition over inheritance** — deep class hierarchies get brittle fast. Use classes that *own* other classes, not endless \`is-a\` chains.
- **Keep constructors simple.** If you need five different ways to build an object, add \`@classmethod\` alternative constructors (\`from_json\`, \`from_iso\`, etc.).
- **Favor immutability where possible:** for data objects, use \`frozen=True\` on dataclasses or \`NamedTuple\`. Immutable objects eliminate whole categories of concurrency bugs.

## Common Mistakes

- **Forgetting \`self\` as first parameter of a method.** Calling \`obj.meth()\` implicitly passes the instance; your signature must accept it.
- **Mutable default argument in \`__init__\`** — e.g., \`def __init__(self, items=[])\`. As with functions, the same list is shared by every instance. Always use \`None\` + a factory.
- **Overusing "private" double-underscore attributes \`__x\`**. Python *name-mangles* these to \`_ClassName__x\` — it's for preventing subclasses from clashing, not true access control. Prefer single underscore.
- **Treating OOP like a golden hammer**. If a class has only one method besides \`__init__\`, or holds no state, just use a function and a dict/dataclass.
- **Writing giant 500-line \`__init__\` methods.** Split them into small helper methods or factory functions.
- **Comparing objects by identity (\`is\`) when you meant equality (\`==\`)**. Two different instances with identical fields will be \`is not\` each other unless \`__eq__\` + identity are both implemented (dataclasses generate \`__eq__\` for you).

## Summary

Classes bundle state (attributes) and behavior (methods) into reusable blueprints. The constructor \`__init__\` sets up per-instance data through the implicit \`self\` argument. Class methods act as alternative constructors, static methods as pure helpers. Use \`@dataclass\` for data-only classes, write \`__repr__\` for debuggability, prefer composition over deep inheritance, and prefix "private" attributes with a single underscore. Learning when NOT to write a class is as important as learning when to — Python rewards choosing the simplest structure (function, dataclass, module) that fits the problem.

---
### Practice Questions

1. **Q**: The first argument to every instance method is conventionally named what?
   **A**: \`self\`. It receives the instance on which the method was called, letting you access its attributes.

2. **Q**: How does \`@dataclass\` help?
   **A**: It generates a working \`__init__\`, \`__repr__\`, \`__eq__\`, and optional ordering for you — eliminating the boilerplate that plagues hand-written data classes.

3. **Q**: What is the "mutable default argument" bug in classes?
   **A**: \`def __init__(self, xs=[]): self.xs = xs\` shares the same list across ALL instances. Use \`xs=None\` and \`self.xs = xs or []\` in the body.

4. **Q**: Difference between \`__str__\` and \`__repr__\`?
   **A**: \`__str__\` is for end-user friendly output (used by \`print()\` / \`str()\`). \`__repr__\` is for developer/debug output (used by REPL / \`repr()\`); it should look like the constructor call when possible.

5. **Q**: What is a \`@classmethod\` commonly used for?
   **A**: To write alternative constructors. The first parameter \`cls\` receives the class itself (not the instance), so subclasses still work correctly.

6. **Q**: \`_balance\` vs \`__balance\` — which is Python's convention for "please don't touch this from outside"?
   **A**: Single underscore \`_balance\`. Double underscore \`__balance\` triggers name mangling (\`_BankAccount__balance\`) and is intended only to prevent subclass-name collisions.

---
### Quiz (MCQ)

1. **Keyword that declares a class:**
   A) \`struct\`
   B) \`object\`
   C) \`class\`
   D) \`type\`
   **Correct: C**

2. **Implicit first parameter of every instance method:**
   A) \`cls\`
   B) \`this\`
   C) \`self\`
   D) \`instance\`
   **Correct: C**

3. **\`__init__\` is:**
   A) Destructor
   B) Constructor / initializer
   C) String repr dunder
   D) Equality dunder
   **Correct: B**

4. **\`@dataclass\` generates all of these except:**
   A) \`__init__\`
   B) \`__repr__\`
   C) \`__eq__\`
   D) Database migrations
   **Correct: D**

5. **\`class B(A):\` means:**
   A) Composition — B contains an A
   B) Inheritance — B is a subclass of A
   C) B is an alias of A
   D) Creates B inside A module
   **Correct: B**

6. **Python's convention for a class attribute that's "internal use":**
   A) CamelCase
   B) Suffix \`!\`
   C) Leading underscore: \`_foo\`
   D) Trailing underscore: \`foo_\`
   **Correct: C**
`,
  },
  {
    sectionTitle: 'Exception Handling',
    sectionOrder: 13,
    lessonOrder: 0,
    title: 'Errors, Exceptions and Context Managers',
    slug: 'python-exceptions',
    estimatedMinutes: 30,
    content: `## Introduction

Things break: files don't exist, networks time out, users type garbage. Python uses **exceptions** — objects representing error conditions — plus the \`try/except/else/finally\` compound statement, to handle failures gracefully. Mastering exceptions lets your program degrade instead of die.

## Definition

An **exception** is an object (instance of a class inheriting from \`BaseException\`) that Python raises automatically (or your code raises explicitly with \`raise\`) when an error occurs. Raising an exception unwinds the call stack until a matching \`except\` clause catches it. If nothing catches it, Python prints a traceback and exits the program.

Common built-in exceptions: \`ValueError\`, \`TypeError\`, \`KeyError\`, \`IndexError\`, \`AttributeError\`, \`ZeroDivisionError\`, \`FileNotFoundError\`, \`IOError\`, \`RuntimeError\`.

## Why It Exists

Without exceptions, every function would have to return an error code (like C) and every caller would have to check it — cluttering the happy path with endless ifs. Exceptions let error-handling live in a single, explicit block while keeping the main logic readable.

## How It Works

\`\`\`
try:
    # run this block first
except SomeError as err:
    # runs if SomeError occurred inside try
except (AnotherError, ThirdError) as err:
    # catches any of the tuple
else:
    # runs ONLY if the try block completed with NO exception
finally:
    # ALWAYS runs last whether exception happened or not (cleanup!)
\`\`\`

Catch order matters: **most-specific exceptions first, more general later.** A bare \`except:\` catches *everything* (including \`KeyboardInterrupt\`, \`SystemExit\`) and is almost always wrong — at minimum use \`except Exception:\`.

You **re-raise** the same exception with a bare \`raise\`, or raise a new one with \`raise NewError(...) from original_exception\` to chain.

## Syntax

\`\`\`python
def safe_divide(a, b):
    try:
        r = a / b
    except ZeroDivisionError as e:
        print(f'Divide failed: {e}')
        return None
    except TypeError as e:
        print(f'Wrong types: {e}')
        return None
    else:
        print('Division went smoothly!')
        return r
    finally:
        print('(cleanup runs always)')

print(safe_divide(10, 3))
# Division went smoothly!
# (cleanup runs always)
# 3.3333333333333335
print(safe_divide(10, 0))
# Divide failed: division by zero
# (cleanup runs always)
# None
\`\`\`

## Real World Example

A small JSON config loader with layered recovery — default config if the file is missing, clear error message if the JSON is unparseable:

\`\`\`python
import json
from pathlib import Path

DEFAULT = {'theme': 'dark', 'notifications': True}

def load_config(path: str):
    try:
        text = Path(path).read_text(encoding='utf-8')
    except FileNotFoundError:
        print(f'[config] {path} missing; using defaults')
        return DEFAULT.copy()
    except PermissionError as e:
        raise RuntimeError(f'Cannot read config at {path} (permissions)') from e
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f'Bad JSON in config: line {e.lineno} col {e.colno}') from e
    return {**DEFAULT, **data}
\`\`\`

## Code Examples

### Example 1 – Python's EAFP (Easier to Ask Forgiveness than Permission) idiom

\`\`\`python
d = {'a': 1, 'b': 2}
# LBYL (Look Before You Leap):
if 'c' in d:
    x = d['c']
else:
    x = -1

# EAFP (preferred in Python):
try:
    x = d['c']
except KeyError:
    x = -1

print(x)  # -1
\`\`\`

### Example 2 – Custom exception classes for domain errors

\`\`\`python
class PaymentError(Exception):            # base for all payment issues
    pass
class InsufficientFunds(PaymentError):   # subclass
    pass
class FraudDetected(PaymentError):
    pass

def charge(amount):
    if amount > 10_000: raise FraudDetected(f'${amount}')
    if amount > 500:    raise InsufficientFunds('limit $500')
    print(f'Charged ${amount}')

try:
    charge(750)
except InsufficientFunds as e:
    print(f'💸 {e}')                     # 💸 limit $500
except PaymentError as e:
    print(f'🚨 Payment issue: {type(e).__name__}: {e}')
\`\`\`

### Example 3 – \`finally\` vs \`with\` (context manager)

\`\`\`python
# Manual finally (the old way)
f = open('a.txt', 'w', encoding='utf-8')
try:
    f.write('hello')
finally:
    f.close()                            # GUARANTEED to run

# Same thing with a context manager (the modern way)
with open('a.txt', 'w', encoding='utf-8') as f:
    f.write('hello')
# f.close() is called automatically
\`\`\`

## Best Practices

- **Catch specific exceptions, not broad ones.** Never a bare \`except:\`. Prefer \`except (KeyError, IndexError):\` over \`except Exception:\` unless you really mean it.
- **Use the EAFP pattern.** It's the Pythonic style — just try the operation; handle the specific failure if it happens. Fewer race conditions than LBYL.
- **Always include the original exception when wrapping** via \`raise New(...) from original\` — this preserves the full traceback chain for debugging.
- **Use \`finally\` only for cleanup that can't be done with a context manager.** Files, locks, DB connections, and HTTP sessions all have context managers — prefer them.
- **Raise ValueError / TypeError / RuntimeError** in library code before writing your own exception types — only subclass when callers need to catch a specific domain case.
- **Keep the \`try:\` block tiny**. Wrap only the one statement that can fail, not an entire function. Handling 5 failures in one large try block makes it impossible to know what broke.

## Common Mistakes

- **Bare \`except:\` catches \`KeyboardInterrupt\` and \`SystemExit\`** — you'll never be able to Ctrl+C your own script again! At minimum use \`except Exception:\`.
- **Swallowing exceptions silently**. Writing \`except: pass\` is the #1 source of "why does this program do nothing?" bugs. If you catch, log, re-raise, or return a clear error value — but never pretend nothing happened.
- **Too-broad \`except Exception:\`** hides bugs you didn't anticipate. Add logging even if you "handle" it.
- **Catching \`KeyError\` when a dict \`.get(default)\` would be cleaner.** Save exceptions for truly exceptional cases, not normal control flow.
- **Incorrect nesting order.** When you have try/except/else/finally, \`else\` comes BEFORE \`finally\`. Mixing them up is a syntax error.
- **Forgetting that \`finally\` runs even after \`return\`.** If you return a value in \`try\` and mutate it in \`finally\`, the returned value will reflect the mutation — a very subtle footgun.

## Summary

Python uses \`raise\` / \`try/except/else/finally\` for error management. Catch the narrowest exception type that makes sense; never swallow with a bare \`except:\`. Chaining with \`raise X from e\` preserves debug context. Python embraces EAFP ("it's easier to ask forgiveness than permission") — just do the thing and handle the specific error that arises instead of checking preconditions. Use \`finally\` for cleanup, but prefer context managers (\`with ...:\`) when they exist, because they're safer and shorter. Robust error-handling separates a throwaway script from software you can ship.

---
### Practice Questions

1. **Q**: Why is \`except: pass\` almost always a bug?
   **A**: It silently swallows ALL exceptions — including \`KeyboardInterrupt\` and \`SystemExit\`. The program will appear frozen or behave mysteriously with no diagnostic output. At minimum, log the exception.

2. **Q**: When does \`else:\` on a \`try\` block execute?
   **A**: ONLY when the \`try\` suite completed without any exception being raised. It's for the "happy-path follow-up" code that shouldn't run if something failed.

3. **Q**: Which runs last: \`else:\` or \`finally:\`?
   **A**: \`finally:\` runs last in all cases. Order is: try → (exception → except) → (else if success) → finally, always.

4. **Q**: EAFP vs LBYL — define each.
   **A**: EAFP (Easier to Ask Forgiveness than Permission) = do the operation, catch exceptions (Pythonic). LBYL (Look Before You Leap) = check preconditions with if/else before doing the operation.

5. **Q**: What does \`raise NewErr(msg) from original_err\` achieve?
   **A**: It creates a new exception while preserving the traceback chain — when printed, you see both the new error and the original cause, vital for debugging.

6. **Q**: Why are context managers like \`with open(...):\` better than manual \`try/finally: close()\`?
   **A**: Less boilerplate. Impossible to forget to close (even on nested early returns/exceptions). Cleanup logic lives inside the object itself rather than at every call site.

---
### Quiz (MCQ)

1. **Which clause guarantees cleanup code runs on both success and failure?**
   A) \`always\`
   B) \`ensure\`
   C) \`finally\`
   D) \`after\`
   **Correct: C**

2. **Bare \`except:\` (no exception type):**
   A) Recommended — catches only our own bugs
   B) Catches everything including Ctrl+C (KeyboardInterrupt) — almost always wrong
   C) Only catches ValueError
   D) Syntax error
   **Correct: B**

3. **\`raise X(msg) from e\` does what:**
   A) Discards exception e
   B) Chains X onto e — debugger shows both as cause chain
   C) Replaces current function
   D) Raises two separate exceptions
   **Correct: B**

4. **Which exception indicates an invalid key lookup in a dict?**
   A) \`IndexError\`
   B) \`KeyError\`
   C) \`AttributeError\`
   D) \`LookupException\`
   **Correct: B**

5. **EAFP is the Pythonic style of:**
   A) Check state before calling, handle return codes
   B) Just perform the operation in try and handle specific exception on failure
   C) Never use exceptions
   D) Assert preconditions with macros
   **Correct: B**

6. **Context managers are activated with keyword:**
   A) \`using\`
   B) \`with\`
   C) \`scope\`
   D) \`resource\`
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Advanced Python Concepts',
    sectionOrder: 14,
    lessonOrder: 0,
    title: 'Iterators, Generators and Comprehensions',
    slug: 'python-advanced-iter',
    estimatedMinutes: 40,
    content: `## Introduction

Python's superpower is iteration. Every for-loop, every list comprehension, and every stdlib helper (sorted, sum, zip, map…) works because of the **iterator protocol**. **Generators** let you write lazy, memory-friendly iterators with normal function syntax. Mastery of this layer unlocks elegant, efficient processing of even huge datasets.

## Definition

- An **iterable** is any object you can call \`iter()\` on to get an iterator (lists, dicts, strings, files, ranges).
- An **iterator** is an object you can call \`next()\` on; it raises \`StopIteration\` when exhausted.
- A **generator** is a function that uses the \`yield\` keyword instead of \`return\`. Calling it returns a generator iterator — each \`next()\` advances to the next \`yield\`.
- A **generator expression** is like a list comprehension but wrapped in parentheses instead of brackets; it's lazy and uses O(1) memory.

## Why It Exists

Without generators, reading a 100-million-record file meant loading everything into lists — exhausting RAM. With generators you process one item at a time, in constant memory, while still writing top-to-bottom imperative code. Comprehensions let you express filter-map pipelines in a single, concise line.

## How It Works

The iterator protocol in 3 lines:
\`\`\`python
it = iter([1, 2, 3])                    # iterable → iterator
print(next(it))   # 1
print(next(it))   # 2
print(next(it))   # 3
print(next(it))   # raises StopIteration (loops catch this internally)
\`\`\`

A generator function pauses at each \`yield\` and resumes where it left off on the next \`next()\`:
\`\`\`python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(5): print(x, end=' ')   # 5 4 3 2 1
\`\`\`

List/Set/Dict comprehensions are syntactic sugar for for+append patterns. Generator expressions are "list comprehensions without the list" — lazy values.

## Syntax

\`\`\`python
# List, dict, set comprehensions
L = [x*x for x in range(6) if x % 2 == 0]          # [0,4,16]
D = {f'k{i}': i*2 for i in range(4)}               # {'k0':0,'k1':2,'k2':4,'k3':6}
S = {word.lower() for word in ['A','B','A','c']}   # {'a','b','c'}

# Generator expression – NO list built!
total = sum(x*x for x in range(1_000_001))         # constant memory

# yield from – delegates to sub-iterator
def chain(a, b):
    yield from a
    yield from b
print(list(chain([1,2], [3,4,5])))                # [1,2,3,4,5]
\`\`\`

## Real World Example

A 3-stage streaming pipeline to process a 10 GB CSV without ever loading it into memory:

\`\`\`python
import csv
def rows(filename):
    with open(filename, encoding='utf-8') as f:
        yield from csv.DictReader(f)             # lazy rows

def with_metric(dicts):
    for r in dicts:
        revenue = float(r['price']) * int(r['qty'])
        if revenue > 100:
            yield {**r, 'revenue': revenue}       # filter + enrich

def totals(dicts):
    total_rev, count = 0.0, 0
    for r in dicts:
        total_rev += r['revenue']; count += 1
        yield total_rev, count                    # running totals

# COMPOSE: rows → with_metric → totals → last()
pipeline = totals(with_metric(rows('sales.csv')))
final_rev, line_count = None, None
for final_rev, line_count in pipeline:            # ONE pass
    pass
print(f'{line_count} qualifying rows, revenue=${final_rev:,.2f}')
\`\`\`

## Code Examples

### Example 1 – Itertools is your iterator stdlib

\`\`\`python
import itertools

# Infinite counters, cycles, repeaters
for n, c in zip(range(8), itertools.cycle('RGB')):
    print(c, end=' ')                             # R G B R G B R G

# Pairwise iteration
for a, b in itertools.pairwise('ABCDE'):
    print(a+b, end=' ')                           # AB BC CD DE

# Takewhile – take items until a condition fails
nums = itertools.count(1)
less10 = list(itertools.takewhile(lambda x: x < 10, nums))
print(less10)                                     # [1,2,3,4,5,6,7,8,9]
\`\`\`

### Example 2 – Flatten a nested list with a recursive generator

\`\`\`python
def flatten(items):
    for it in items:
        if isinstance(it, list):
            yield from flatten(it)
        else:
            yield it

print(list(flatten([1, [2, 3, [4, 5]], 6, [7]])))
# [1, 2, 3, 4, 5, 6, 7]
\`\`\`

### Example 3 – Generator with \`.send()\` / \`.throw()\` (coroutine basics)

\`\`\`python
def running_average():
    total, count = 0, 0
    avg = None
    while True:
        incoming = yield avg                    # yield the result, receive new value
        total += incoming
        count += 1
        avg = total / count

ra = running_average()
next(ra)                                        # must prime a coroutine generator
print(ra.send(10))   # 10.0
print(ra.send(20))   # 15.0
print(ra.send(30))   # 20.0
\`\`\`

## Best Practices

- **Use a generator expression** whenever you are building a list/dict only to immediately consume it (sum, any, all, join, iteration). You save allocations and memory.
- **Reach for \`itertools\` first**: \`chain, islice, takewhile, dropwhile, groupby, product, permutations, combinations\` cover the gamut of iterator combinations.
- **Keep generators single-purpose** — then compose them by piping one generator into another, as in the pipeline example. This is the functional-programming heart of Python.
- **Use \`yield from subiter\`** instead of \`for x in subiter: yield x\`. It's shorter, faster, and correctly propagates .send/.throw.
- **Prime a coroutine-generator** before sending. Wrap with a \`@coroutine\` decorator that calls \`next()\` for you so callers don't forget.
- **Convert to list explicitly** when you need random access or length. Generators are one-shot; iterating twice will surprise you (second iteration is empty).

## Common Mistakes

- **Thinking a generator expression produces a tuple.** It does NOT — wrap in \`tuple()\` if you need one. The parentheses are only syntax for the generator expression.
- **Iterating a generator twice** without recreating it. The first run exhausts it; the second returns nothing. Rebuild from source or materialize to a list if re-read is needed.
- **Overdoing list comprehensions.** Nested comprehensions with three \`for\` clauses are hard to read. Write a helper generator function with descriptive names instead.
- **Using \`next(it, None)\` when \`None\` is a legitimate value.** Pass a unique sentinel object or catch \`StopIteration\` explicitly.
- **Calling list() too eagerly.** Don't defeat the whole "constant memory" win just to print a debug preview — use \`itertools.islice(gen, 10)\`.
- **Confusing \`yield\` and \`return\` in a generator.** \`return value\` inside a generator raises \`StopIteration(value)\`; it does NOT make \`value\` appear in iteration output. Use \`yield\` for items, \`return\` only for the chain's final result.

## Summary

Iterables implement \`__iter__\` → iterators implement \`__next__\` → StopIteration signals the end; the for-loop machinery handles all of this transparently. Generator functions (\`yield\`) and generator expressions let you write custom iterators lazily, in constant memory. Comprehensions (list/dict/set) replace for+append patterns. Compose small generators into pipelines to process unlimited-size streams in one pass. Keep the distinction clear between one-shot iterators and reusable containers, and you'll write Python that's fast, memory-friendly, and surprisingly readable.

---
### Practice Questions

1. **Q**: How do you write a generator expression vs a list comprehension?
   **A**: Generator = parentheses: \`(x*x for x in range(10))\`. List = brackets: \`[x*x for x in range(10)]\`. Generator is lazy and uses O(1) memory; list materializes all values immediately.

2. **Q**: What does \`yield from xs\` do inside a generator?
   **A**: Delegates iteration to the iterable \`xs\` — equivalent to \`for item in xs: yield item\`, but also correctly forwards \`send()\` / \`throw()\` calls when used as a coroutine.

3. **Q**: What happens when you iterate an already-exhausted generator a second time?
   **A**: It yields zero items. The iterator's internal position is already past the end; you need to create a fresh generator from its source.

4. **Q**: Why is \`sum(x*x for x in huge)\` preferred over \`sum([x*x for x in huge])\`?
   **A**: The first uses a generator expression — O(1) extra memory. The second materializes a full temporary list, then sums it, using O(n) memory and two passes.

5. **Q**: What's the purpose of calling \`next(coroutine)\` before sending values with \`.send()\`?
   **A**: It "primes" the generator: advances execution to the first \`yield\` expression, where it's ready to accept a sent value. Forgetting this step throws \`TypeError: can't send non-None value to a just-started generator\`.

6. **Q**: Name 5 itertools functions.
   **A**: (any valid 5) \`chain, islice, takewhile, dropwhile, groupby, product, permutations, combinations, repeat, count, cycle, tee, zip_longest, pairwise, accumulate, starmap, compress, filterfalse\`.

---
### Quiz (MCQ)

1. **Keyword used inside a function to make it a generator:**
   A) \`produce\`
   B) \`return\` with \`async\`
   C) \`yield\`
   D) \`emit\`
   **Correct: C**

2. **\`(x*x for x in range(5))\` evaluates to:**
   A) A tuple \`(0,1,4,9,16)\`
   B) A list
   C) A generator expression (lazy iterator)
   D) A set
   **Correct: C**

3. **A generator is exhausted after:**
   A) One minute
   B) The first full iteration (StopIteration raised)
   C) Program exits
   D) Calling \`rewind()\`
   **Correct: B**

4. **\`yield from it\`:**
   A) Raises — \`yield\` only takes a single value
   B) Delegates iteration to sub-iterator \`it\`
   C) Calls \`return it\`
   D) Mirrors items twice
   **Correct: B**

5. **Which itertools groups consecutive equal keys?**
   A) \`sorted()\`
   B) \`groupby()\`
   C) \`bucket()\`
   D) \`chunk()\`
   **Correct: B**

6. **Calling \`.send(v)\` on a generator does what?**
   A) Replaces the generator function
   B) Resumes it and makes the current \`yield\` expression evaluate to \`v\`
   C) Starts a new thread running the generator
   D) Appends v to results
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Advanced Python Concepts',
    sectionOrder: 14,
    lessonOrder: 1,
    title: 'Decorators, Lambdas and Context Managers',
    slug: 'python-decorators-lambdas-cm',
    estimatedMinutes: 45,
    content: `## Introduction

Intermediate Python fluency means speaking its idioms: anonymous functions with \`lambda\`, wrapping existing functions with **decorators** to add behavior, and writing your own **context managers** for resource cleanup. These tools look magical at first, but each rests on simple foundations you can master in an afternoon.

## Definition

- A **lambda** is a single-expression anonymous function: \`lambda args: expr\`. It returns the value of \`expr\`.
- A **decorator** is a callable that takes a function (or class) and returns a replacement (usually a wrapper function that adds pre/post hooks). Syntax sugar: \`@decorator\` on the line above \`def\`.
- A **context manager** implements \`__enter__\` and \`__exit__\` (or uses the \`@contextmanager\` decorator + \`yield\`) to bracket a \`with\` block with setup/teardown logic.

## Why It Exists

Without decorators, cross-cutting concerns (logging, timing, auth, caching, retry) would get copy-pasted into 100 functions and become inconsistent. Without context managers, every file/socket/lock would need a try/finally — a bug magnet. Lambdas give you tiny throwaway functions for keys and callbacks without polluting the namespace.

## How It Works

- **Lambda:** \`square = lambda x: x*x\` is *exactly* equivalent to \`def square(x): return x*x\`. Lambdas can only hold a single expression — no statements.
- **Decorators:** \`@deco\` above \`def f(): ...\` desugars to \`f = deco(f)\`. You re-bind the original name to the decorated wrapper. The wrapper typically calls \`functools.wraps(original_func)\` on itself to preserve docstrings and metadata.
- **Context managers:** \`with cm() as val:\` calls \`val = cm.__enter__()\` before the block, then calls \`cm.__exit__(exc_type, exc_val, tb)\` after. If the block raised, exception info is passed to \`__exit__\`; return \`True\` from \`__exit__\` to suppress the exception. The easy-mode version uses \`@contextlib.contextmanager\` on a generator: code before \`yield\` = enter, \`yield\` returns the value, code after = exit.

## Syntax

\`\`\`python
import time, functools, contextlib

# ★ Lambda
add = lambda a, b: a + b
print(sorted(['CC','A','BBBB'], key=lambda s: len(s)))  # ['A', 'CC', 'BBBB']

# ★ Decorator – time any function
def timer(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            print(f'{fn.__name__} took {time.perf_counter()-t0*1000:.2f}ms')
    return wrapper

@timer                              # same as slow_fn = timer(slow_fn)
def slow_fn(n):
    total = 0
    for i in range(n): total += i*i
    return total
slow_fn(1_000_000)                  # slow_fn took 62.41ms

# ★ ContextManager decorator
@contextlib.contextmanager
def timed_block(label):
    t0 = time.perf_counter()
    try:
        yield                       # value bound by "as X"
    finally:
        print(f'Block "{label}" took {(time.perf_counter()-t0)*1000:.2f}ms')

with timed_block('work'):
    sum(range(5_000_000))           # Block "work" took 123.10ms
\`\`\`

## Real World Example

A decorator + context manager combo: a \`@retry(max_times=3)\` decorator that automatically retries flaky network calls, and a context manager that logs request durations:

\`\`\`python
import functools, logging, requests, time
logging.basicConfig(level=logging.INFO)

def retry(max_times=3, delay=1.0, on=(Exception,)):
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kw):
            last_exc = None
            for attempt in range(1, max_times + 1):
                try:
                    return fn(*args, **kw)
                except on as e:
                    last_exc = e
                    logging.warning(f'{fn.__name__} try {attempt}/{max_times} failed: {e}')
                    if attempt < max_times: time.sleep(delay)
            raise last_exc
        return wrapper
    return deco

@retry(max_times=3, delay=0.5, on=(requests.ConnectionError, requests.Timeout))
def fetch(url):
    return requests.get(url, timeout=2).text
\`\`\`

## Code Examples

### Example 1 – Decorator with parameters (cache memoizer)

\`\`\`python
from functools import wraps
def memoize(fn):
    cache = {}
    @wraps(fn)
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapper

@memoize
def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)

print([fib(i) for i in range(12)])   # [0,1,1,2,3,5,8,13,21,34,55,89] — instant!
\`\`\`

### Example 2 – Lambda as key in sort/min/max

\`\`\`python
users = [
    {'name': 'Ada',    'age': 207, 'score': 98},
    {'name': 'Linus',  'age': 54,  'score': 89},
    {'name': 'Grace',  'age': 117, 'score': 99},
]
print(min(users, key=lambda u: u['age'])['name'])                  # Linus
print(max(users, key=lambda u: u['score'])['name'])                # Grace
print(sorted(users, key=lambda u: (-u['score'], u['name'])))       # Grace, Ada, Linus
\`\`\`

### Example 3 – Custom class-based context manager

\`\`\`python
class Indenter:
    def __init__(self): self.level = 0
    def __enter__(self):
        self.level += 1; return self
    def __exit__(self, *exc):
        self.level -= 1
        return False                      # don't suppress
    def print(self, s):
        print('  ' * (self.level - 1) + s)

with Indenter() as ind:
    ind.print('chapter 1')
    with ind:
        ind.print('section A')
        ind.print('section B')
    ind.print('chapter 2')
# chapter 1
#   section A
#   section B
# chapter 2
\`\`\`

## Best Practices

- **Use \`functools.wraps(orig)\`** in every decorator wrapper. Without it, help(), docstrings, and debugging stack traces show \`wrapper\` instead of the real function.
- **Keep lambdas tiny.** If you need an if/else, a loop, or multiple lines — write a proper \`def\`. The name will help readability.
- **Prefer \`functools.lru_cache\`** for memoization instead of writing your own — it's battle-tested and supports maxsize, typed parameters, and cache_info().
- **When writing context managers**, always put your cleanup code in the \`finally:\` branch (for generator-style) or \`__exit__\` (for class-based) so it runs even if the block raises.
- **Stack decorators from outermost → innermost bottom-up.** \`@A @B @C def f()\` → \`f = A(B(C(f)))\`. Order matters — debug with print-decorators if you're unsure.
- **For decorators you want to use both with and without arguments**, write a flexible factory: \`deco(*args, **kw)\` that detects "first positional arg is a callable" as the no-args form.

## Common Mistakes

- **Calling a function when decorating.** \`@timer()\` works only if \`timer\` is a factory returning the real decorator. If you just wrote \`def timer(fn):...\`, use \`@timer\` — no parentheses.
- **Returning nothing from a decorator wrapper.** The original function's return value is lost. The wrapper must \`return fn(*args, **kwargs)\` or the consumer sees \`None\`.
- **Lambdas in loops creating closures.** All lambdas share the same late-binding variable — you get only the last iteration's value. Capture via default: \`lambda x=x: f(x)\`.
- **Class-based context manager that returns True from \`__exit__\` without thinking.** That SUPPRESSES the exception — almost never what you want.
- **Decorators breaking function signatures** because they use plain \`*args, **kwargs\` without \`wraps\`. IDE autocompletion, \`inspect.signature\`, and FastAPI's dependency injection all break — \`functools.wraps\` fixes it.
- **Context managers that forget to handle exceptions in cleanup.** If teardown can also throw, wrap inner calls in try/except and log, or you'll mask the original error.

## Summary

Lambda gives you one-expression throwaway functions great for sort keys. Decorators (\`@deco\`) wrap functions, transparently adding logging, caching, retries, timing — use \`functools.wraps\` to preserve metadata. Context managers (\`with X as y:\`) guarantee teardown; implement them as classes with \`__enter__\` / \`__exit__\`, or far more simply with \`@contextmanager\` on a generator that yields once. These three patterns underpin almost every Python framework — internalize them, and your code will be both shorter and far more professional.

---
### Practice Questions

1. **Q**: What does \`functools.wraps\` do and why use it?
   **A**: It copies metadata (__name__, __doc__, __module__) from the original function onto the decorator wrapper. Without it stack traces, help(), and signature inspection show the wrapper instead of the real function, confusing debugging and breaking tooling.

2. **Q**: Explain the "late-binding closure" bug with lambdas inside loops.
   **A**: All lambda closures created in a loop share the same *variable name*, not the value captured at definition time — by the time they run, the variable has the last loop iteration's value. Fix: capture the current value with a default argument: \`lambda x=x: f(x)\`.

3. **Q**: Convert \`def area(w, h): return w * h\` to a lambda.
   **A**: \`area = lambda w, h: w * h\`.

4. **Q**: In a class-based context manager, what signature does \`__exit__\` receive?
   **A**: \`__exit__(self, exc_type, exc_value, traceback)\`. If the block exited normally, all three args are None. If an exception was raised they contain the type, instance, and traceback — returning True from __exit__ suppresses it.

5. **Q**: \`@deco\` above a function definition is syntactic sugar for what line?
   **A**: Immediately after the \`def\` block, Python runs \`func = deco(func)\`, re-binding the name \`func\` to whatever \`deco\` returned.

6. **Q**: What is \`functools.lru_cache\` used for?
   **A**: Memoization — it automatically caches function return values keyed by arguments. Ideal for expensive pure functions like recursive Fibonacci, network fetches, or expensive computations.

---
### Quiz (MCQ)

1. **Anonymous one-expression function declared with:**
   A) \`fun\`
   B) \`lambda\`
   C) \`anon\`
   D) \`proc\`
   **Correct: B**

2. **\`@deco\` on a function desugars to:**
   A) \`deco(function)\`
   B) \`function(deco)\`
   C) \`function = deco(function)\`
   D) \`class function(deco)\`
   **Correct: C**

3. **Context manager block syntax:**
   A) \`scope cm() as x:\`
   B) \`using cm(x):\`
   C) \`with cm() as x:\`
   D) \`lock cm() → x:\`
   **Correct: C**

4. **\`functools.wraps\` is used in decorators to:**
   A) Unroll loops automatically
   B) Preserve original function name/docs/signature
   C) Create a new coroutine
   D) Roll back on exception
   **Correct: B**

5. **What decorator turns a generator into a context manager?**
   A) \`@contextmanager\` from contextlib
   B) \`@with\`
   C) \`@generator\`
   D) \`@enter_exit\`
   **Correct: A**

6. **\`lambda x: x if x>0 else 0\`:**
   A) Syntax error — lambdas can't have if/else
   B) Valid lambda returning max(x,0)
   C) Returns a function, not a value
   D) Runs only on negative numbers
   **Correct: B** (uses ternary expression, the only "branching" allowed in a lambda)
`,
  },
  {
    sectionTitle: 'Object Oriented Programming',
    sectionOrder: 12,
    lessonOrder: 1,
    title: 'Inheritance, Polymorphism and Dunder Methods',
    slug: 'python-oop-advanced',
    estimatedMinutes: 40,
    content: `## Introduction

Once you're comfortable writing simple classes, the next level is building class hierarchies that share logic via inheritance, creating objects that behave like native Python types with dunder methods, and leveraging polymorphism for clean, pluggable code. These patterns turn "just Python" into Python that feels like the standard library itself.

## Definition

- **Inheritance**: class \`Child(Parent)\` inherits all attributes and methods from Parent; override methods with the same name; call up to parent via \`super()\`.
- **Polymorphism**: objects of different classes respond to the same method call in class-appropriate ways — no type-checking required, just the same signature.
- **Dunder methods** (aka "magic methods"): special names like \`__len__\`, \`__eq__\`, \`__add__\`, \`__iter__\`, \`__hash__\` that Python invokes automatically for built-in operations (\`len()\`, \`==\`, \`+\`, iteration, \`hash()\`).

## Why It Exists

Inheritance lets you share 90% of logic between classes while overriding the 10% that differs. Dunder methods let your custom classes act exactly like built-ins — users can call \`len(obj)\`, \`obj in set\`, \`print(obj)\`, and \`for x in obj:\` naturally instead of a dozen different-named methods.

## How It Works

When Python resolves \`obj.method()\`, the MRO (Method Resolution Order) is walked: instance dict → class → base classes in a specific order (print \`Class.mro()\` to inspect). \`super()\` in a method calls the next method in the MRO, which in single inheritance means the immediate parent.

Dunder method mapping examples:
- \`len(obj)\` → \`obj.__len__()\`
- \`repr(obj)\` → \`obj.__repr__()\`
- \`a == b\` → \`a.__eq__(b)\`
- \`a + b\` → \`a.__add__(b)\` (or \`b.__radd__(a)\` if the first returns NotImplemented)
- \`hash(obj)\` → \`obj.__hash__()\` (if defined, instances become usable as dict keys / set members; must align with \`__eq__\`)
- \`iter(obj)\` → \`obj.__iter__()\`, then \`next()\` on returned iterator

## Syntax

\`\`\`python
from dataclasses import dataclass
import math

class Shape:
    def area(self) -> float:                  # abstract-ish method
        raise NotImplementedError('subclasses override')
    def describe(self):
        return f'{type(self).__name__} area={self.area():.2f}'

@dataclass
class Rectangle(Shape):
    w: float; h: float
    def area(self): return self.w * self.h

@dataclass
class Circle(Shape):
    r: float
    def area(self): return math.pi * self.r ** 2

# Polymorphism: same method call, different behavior per class
for s in [Rectangle(3, 4), Circle(5)]:
    print(s.describe())
# Rectangle area=12.00
# Circle area=78.54
\`\`\`

## Real World Example

A playable playlist class that supports all the native operations — len, indexing, contains, iter, append, + concatenation, and equality — purely via dunders:

\`\`\`python
class Playlist:
    def __init__(self, name, tracks=None):
        self.name, self.tracks = name, list(tracks or [])
    def __len__(self):         return len(self.tracks)
    def __getitem__(self, i):  return self.tracks[i]         # indexing + slicing
    def __contains__(self, x): return x in self.tracks
    def __iter__(self):        return iter(self.tracks)      # for-loops
    def __add__(self, other):  return Playlist(f'{self.name}+{other.name}', self.tracks + other.tracks)
    def append(self, track):   self.tracks.append(track)
    def __repr__(self):        return f'Playlist({self.name!r}, {self.tracks!r})'
    def __eq__(self, other):
        return isinstance(other, Playlist) and self.name == other.name and self.tracks == other.tracks

p = Playlist('Study', ['Trap', 'Lofi', 'Ambient'])
print(len(p), 'Ambient' in p, p[1:3])
for t in p: print('-', t)
print(p + Playlist('Workout', ['808s']))
# 3 True ['Lofi', 'Ambient']
# - Trap
# - Lofi
# - Ambient
# Playlist('Study+Workout', ['Trap', 'Lofi', 'Ambient', '808s'])
\`\`\`

## Code Examples

### Example 1 – super() and cooperative multiple inheritance

\`\`\`python
class Person:
    def __init__(self, name, age=0):
        self.name, self.age = name, age
    def greet(self):
        return f'Hello, {self.name} ({self.age})'

class Student(Person):
    def __init__(self, name, age, major='CSE'):
        super().__init__(name, age)        # call parent init
        self.major = major
    def greet(self):
        return super().greet() + f' [{self.major}]'

print(Student('Ada', 207, 'Math').greet())
# Hello, Ada (207) [Math]
\`\`\`

### Example 2 – Making a class hashable + usable in sets/dict keys

\`\`\`python
@dataclass(frozen=True)    # frozen → auto __hash__ + immutable
class Point:
    x: int
    y: int

ps = {Point(0,0), Point(3,4), Point(0,0)}  # dup removed
print(len(ps), Point(3,4) in ps)            # 2 True
index = {Point(0,0): 'origin', Point(1,0): 'east'}
print(index[Point(0,0)])                     # origin
\`\`\`

### Example 3 – Operator overloading: a Money type

\`\`\`python
@dataclass
class Money:
    amount: int                         # store in cents to avoid float error
    def __add__(self, other):
        if isinstance(other, Money): return Money(self.amount + other.amount)
        return NotImplemented            # Python will try other.__radd__
    def __sub__(self, other):
        return Money(self.amount - other.amount)
    def __str__(self):
        dollars, cents = divmod(self.amount, 100)
        return f'${dollars}.{cents:02d}'

a, b = Money(150), Money(225)
print(f'{a} + {b} = {a+b}')     # $1.50 + $2.25 = $3.75
\`\`\`

## Best Practices

- **Explicitly inherit from nothing in Python 3** (all classes implicitly inherit \`object\`). Single inheritance first, multiple only when using clearly-separated mixins.
- **Always call \`super().__init__()\`** (or the appropriate method) in subclasses when you override. Skipping it is the #1 source of "where'd my attribute go?" bugs.
- **Implement \`__repr__\` first**, then \`__str__\`, then \`__eq__\` — your class instantly becomes debuggable. Only implement \`__hash__\` for immutable-like classes and keep it aligned with \`__eq__\`.
- **Keep hierarchies shallow.** 2-3 levels deep tops; otherwise refactor into composition (has-a) with strategy objects.
- **Use mixins** for orthogonal concerns (logging, serialization, API formatting) — inherit from one "real" parent plus multiple small mixin classes. Name mixins with the \`...Mixin\` suffix for clarity.
- **Only overload operators when the meaning is obvious** (\`Money + Money\` = yes, \`Car + Car\` = very confusing). Prefer named methods (\`car.crash_into(other)\`).

## Common Mistakes

- **Forgetting to call \`super()\` in the overridden method.** The parent's initialization or logic simply never runs and mysterious AttributeErrors follow.
- **Mismatched \`__eq__\` and \`__hash__\`.** Python automatically sets \`__hash__ = None\` if you define \`__eq__\` without a \`__hash__\`, which breaks set/dict usage. Fix: define both, or mark @dataclass(frozen=True) / eq=True, unsafe_hash=True.
- **Testing type with \`type(x) == A\`.** It fails for subclasses! Always use \`isinstance(x, A)\` — it walks the inheritance chain.
- **Deep MRO diamond inheritance** where multiple inheritance leads to unpredictable method resolution. Print \`YourClass.__mro__\` or \`help(YourClass)\` to see the order.
- **Mutating shared class attributes from instances.** \`class X: items = []\` → every instance shares that list! Put mutable values in \`__init__\`.
- **Returning \`NotImplemented\` as \`NotImplementedError\` exception.** They're different — return the singleton \`NotImplemented\` from dunder ops to let Python try the reflected method.

## Summary

Use single inheritance and \`super()\` to reuse code. Use polymorphism to write functions that accept *any* object with the right interface — duck typing means no interface declarations required. Implement dunders to make your classes behave like native Python types: \`__len__\`, \`__getitem__\`, \`__iter__\`, \`__eq__\`, \`__repr__\`, \`__hash__\`, and arithmetic operators when appropriate. Keep hierarchies shallow; reach for dataclass, NamedTuple, and frozen variants to avoid boilerplate and accidental mutation.

---
### Practice Questions

1. **Q**: Why should you use \`isinstance(x, C)\` instead of \`type(x) == C\`?
   **A**: \`type()\` is exact-match; subclasses fail. \`isinstance()\` returns True for subclasses too (correct for inheritance / LSP), plus supports tuples of classes: \`isinstance(x, (int, float))\`.

2. **Q**: You override \`__eq__\` but not \`__hash__\`. What happens?
   **A**: Python sets \`__hash__ = None\`, making instances unhashable — they can't be added to sets or used as dict keys. Fix by implementing \`__hash__\` consistently with \`__eq__\`, or freeze the class.

3. **Q**: What's the difference between \`__str__\` and \`__repr__\` in one sentence each?
   **A**: \`__str__\` (for end users) returns pretty-printed output — used by \`str()\`, \`print()\`. \`__repr__\` (for developers) returns a canonical debug representation that ideally recreates the object — used by REPL, \`repr()\`, container contents.

4. **Q**: What does \`super()\` do, approximately?
   **A**: Inside a method, \`super()\` returns a proxy object that delegates the next method lookup to the next class in the MRO (usually the direct parent class in single inheritance).

5. **Q**: Implementing which 2 dunders enables \`for x in obj:\` iteration?
   **A**: The simplest is \`__iter__\` returning an iterator (often a generator). Or alternatively \`__getitem__\` starting at 0 and raising IndexError to stop.

6. **Q**: What is a mixin?
   **A**: A small class that implements one specific concern (e.g., \`SerializeJsonMixin\`), designed to be inherited alongside other classes via multiple inheritance — not instantiated on its own.

---
### Quiz (MCQ)

1. **Python inheritance declared as:**
   A) \`class B extends A\`
   B) \`class B inherits A\`
   C) \`class B(A)\`
   D) \`class B <- A\`
   **Correct: C**

2. **\`len(obj)\` calls which dunder on obj?**
   A) \`__count__\`
   B) \`__len__\`
   C) \`__size__\`
   D) \`length()\`
   **Correct: B**

3. **\`isinstance(x, Parent)\` returns True if x is:**
   A) Exactly Parent type only
   B) Parent or any subclass of Parent
   C) Any object at all
   D) A string representation of Parent
   **Correct: B**

4. **Which dunder controls behavior of \`a == b\`?**
   A) \`__is__\`
   B) \`__eq__\`
   C) \`__same__\`
   D) \`__cmp__\`
   **Correct: B**

5. **\`super()\` inside an overridden method is used to:**
   A) Delete the parent class
   B) Call the parent class's implementation of the method
   C) Instantiate a new parent object
   D) Import superglobals
   **Correct: B**

6. **\`frozen=True\` on a dataclass means:**
   A) No one can import it
   B) Instances are immutable after creation (auto __hash__ too)
   C) Prevents inheritance
   D) Deletes attributes after first use
   **Correct: B**
`,
  },
  {
    sectionTitle: 'Python Projects',
    sectionOrder: 15,
    lessonOrder: 0,
    title: 'Project #1 – Interactive CLI Todo App',
    slug: 'python-project-todo-cli',
    estimatedMinutes: 45,
    content: `## Introduction

Learning syntax is one thing; building something you'll actually use is another. In this project you'll implement a classic command-line todo app backed by a JSON file. You'll exercise modules, file I/O, dicts, lists, error handling, argument parsing, and classes. The result is a real utility you can extend with priorities, due dates, tags, and syncing.

## Definition

A **CLI (command-line interface) app** is a program invoked from a terminal with command arguments and flags — no GUI needed. Our Todo app accepts commands like:
- \`todo.py add "Buy milk"\` – appends a task
- \`todo.py list\` – prints numbered tasks
- \`todo.py done 2\` – marks task #2 complete
- \`todo.py rm 3\` – removes task #3
- \`todo.py clear\` – wipes storage

Data persists between runs in \`todos.json\` in the current directory.

## Why It Exists

Every beginner should ship at least one tiny, complete, *useful* program. CRUD (create, read, update, delete) + persistence + CLI interface recycles into 80% of other small Python scripts you'll write in your career. The exact skills you practice here (argparse, JSON load/dump, idempotent storage, EAFP error handling) transfer directly to log analyzers, scrapers, data migration scripts, and DevOps utilities.

## How It Works

1. **Parse the command**: Use Python's built-in \`argparse\` (or simple \`sys.argv[1:]\`) to figure out what the user wants.
2. **Load storage**: Read existing \`todos.json\` if present, default to empty list. Handle both missing files (first run) and corrupt JSON gracefully.
3. **Mutate in-memory**: For add/done/rm/clear, modify the loaded Python list of dicts.
4. **Persist**: Write back to \`todos.json\` *atomically* (write-temp + rename) so crashes mid-write never corrupt the store.
5. **Report**: Print a nice user-facing table of changes or the updated todo list.

Task schema in JSON: \`{"id": 1, "text": "Buy milk", "done": false}\`.

## Syntax

\`\`\`python
#!/usr/bin/env python3
"""Minimal CLI todo manager — data stored in ./todos.json"""
import argparse, json, os, tempfile, sys

FILE = os.path.join(os.path.dirname(__file__), 'todos.json')

def load():
    try:
        with open(FILE, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as e:
        print(f'⚠ corrupt JSON ({e}); starting fresh', file=sys.stderr)
        return []

def save(todos):
    fd, tmp = tempfile.mkstemp(prefix='.todo_', dir=os.path.dirname(FILE) or '.')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(todos, f, indent=2)
        os.replace(tmp, FILE)
    except BaseException:
        if os.path.exists(tmp): os.remove(tmp)
        raise
\`\`\`

## Real World Example

The finished core functions:

\`\`\`python
def next_id(todos):
    return 1 + max((t['id'] for t in todos), default=0)

def add(text):
    todos = load()
    todos.append({'id': next_id(todos), 'text': text, 'done': False})
    save(todos)
    print(f'+ added [{todos[-1]["id"]}] {text}')

def mark_done(task_id):
    todos = load()
    for t in todos:
        if t['id'] == task_id:
            t['done'] = True; save(todos)
            print(f'✓ #{task_id} {t["text"]}')
            return
    print(f'No task with id {task_id}'); sys.exit(1)

def remove(task_id):
    todos = [t for t in load() if t['id'] != task_id]
    save(todos); print(f'- removed #{task_id}')

def render():
    todos = load()
    if not todos: return print('(empty)')
    for t in todos:
        mark = '✓' if t['done'] else '·'
        print(f'{mark} {t["id"]:>4}. {t["text"]}')
\`\`\`

## Code Examples

### Example 1 – Argument parser wiring

\`\`\`python
def main(argv=None):
    p = argparse.ArgumentParser(prog='todo', description='Tiny JSON todo list')
    sub = p.add_subparsers(dest='cmd', required=True)
    sub.add_parser('list').set_defaults(func=lambda _: render())
    sub.add_parser('clear', aliases=['reset']).set_defaults(func=lambda _: (save([]), print('cleared')))
    p_add = sub.add_parser('add'); p_add.add_argument('text', nargs='+'); p_add.set_defaults(func=lambda a: add(' '.join(a.text)))
    p_done = sub.add_parser('done'); p_done.add_argument('id', type=int); p_done.set_defaults(func=lambda a: mark_done(a.id))
    p_rm = sub.add_parser('rm', aliases=['remove','delete']); p_rm.add_argument('id', type=int); p_rm.set_defaults(func=lambda a: remove(a.id))
    args = p.parse_args(argv)
    args.func(args)

if __name__ == '__main__':
    main()
\`\`\`

### Example 2 – Typical usage session

\`\`\`bash
$ ./todo.py add "Install Python deps"
+ added [1] Install Python deps
$ ./todo.py add "Watch lectures"
+ added [2] Watch lectures
$ ./todo.py list
·    1. Install Python deps
·    2. Watch lectures
$ ./todo.py done 1
✓ #1 Install Python deps
$ ./todo.py rm 2
- removed #2
$ ./todo.py list
✓    1. Install Python deps
\`\`\`

### Example 3 – Adding priority extension

\`\`\`python
# Extend task schema with priority:
def add_with_priority(text, priority='med'):
    todos = load()
    todos.append({'id': next_id(todos), 'text': text, 'done': False, 'priority': priority})
    save(todos)

# Then render sorted by priority first (high > med > low), then by id
PRIO = {'high': 0, 'med': 1, 'low': 2}
def render_sorted():
    for t in sorted(load(), key=lambda x: (PRIO.get(x.get('priority','med'), x['id']))):
        print(f'{("!" + t.get("priority","")[0]).upper():<3} {t["id"]:>4} {t["text"]}')
\`\`\`

## Best Practices

- **Use argparse over raw \`sys.argv\`** for anything beyond a single command. Subparsers, help text, type coercion, and aliases are free.
- **Atomic writes** with tempfile + \`os.replace\` — they prevent corrupt data even if the power cuts out mid-save.
- **Seed storage with empty list on first run** instead of asking the user to create a file.
- **Exit with non-zero codes on failure** (\`sys.exit(1)\`) — shell scripts and CI pipelines depend on these.
- **Prefix error/warning messages to stderr** (\`print(msg, file=sys.stderr)\`) so stdout capture of pure output remains clean.
- **Use docstrings and --help.** Users shouldn't read source code to figure out usage — argparse auto-generates it.

## Common Mistakes

- **Loading then saving separately in each function without returning the updated list** → two simultaneous calls race. Always load → mutate one list → save once.
- **Forgetting to handle \`JSONDecodeError\`.** If a user accidentally edits the JSON file, your program shouldn't crash with a traceback — log and restart empty (or restore from backup).
- **Using \`remove(task_id)\` as a list mutation inside a loop.** Mutating while iterating skips elements; build a new filtered list (comprehension), which is also cleaner.
- **Corrupting JSON on Ctrl+C.** Without atomic writes, a half-written file is the typical result. tempfile + os.replace is mandatory for any long-term storage.
- **Confusing task ID with list index.** After deletions, index 2 may not be id 2. Always key by \`t['id']\`, never the list position in user output.
- **Hard-coding the data path relative to cwd.** If the user runs the app from a different directory they see a blank store. Build \`FILE\` relative to the script location with \`__file__\`.

## Summary

The todo CLI is a perfect "real Python" capstone: you combine argparse for subcommands, JSON for durable storage with atomic writes, list comprehensions and sort keys for rendering, dictionaries for each task record, sys.exit/exit codes for shell-friendliness, and EAFP exception handling around both parse and write phases. Once working, extending it is trivial — priorities, due dates, tags, regex search, multiple named lists, sync to a cloud API — all become natural exercises that reuse these same skills.

---
### Practice Questions

1. **Q**: Why do we use a temporary file + \`os.replace()\` instead of directly writing to \`todos.json\`?
   **A**: To guarantee atomicity. If the program crashes or system fails mid-write, the original file is still intact. \`os.replace\` is an atomic filesystem operation on all platforms.

2. **Q**: Why use argparse instead of raw \`sys.argv\` slicing?
   **A**: argparse gives --help, type coercion (ints/bools), subcommands, aliases, positional/optional distinction, validation errors in the user's language, and consistent formatting — hundreds of lines of code you don't have to write.

3. **Q**: We key tasks by unique auto-incremented id, not list index. Why?
   **A**: Indices shift after any delete — user's "task 3" becomes a different task tomorrow. IDs are stable; they survive mutations and allow safe references in logs, emails, etc.

4. **Q**: When is it okay to use \`sys.exit(1)\`?
   **A**: Whenever the requested operation failed (task not found, corrupt data, missing permissions). Non-zero exit codes let automated shell scripts (or CI) detect failures programmatically.

5. **Q**: How to preserve file paths when the user runs the app from a different directory?
   **A**: Resolve paths relative to the script's own \`__file__\` attribute, not the current working directory: \`os.path.join(os.path.dirname(__file__), 'todos.json')\`.

6. **Q**: Which exception(s) should a robust JSON loader catch?
   **A**: \`FileNotFoundError\` (first run → empty list) + \`json.JSONDecodeError\` (bad content → log + start fresh or fail). Don't catch broad exceptions — hide bugs.

---
### Quiz (MCQ)

1. **Atomic file write means:**
   A) Writing using many small syscalls
   B) Readers see either the old complete file or new complete file, never partial
   C) Writing encrypted content
   D) Writing via database driver
   **Correct: B**

2. **Best stdlib for defining subcommands and flags:**
   A) \`sys.argv\` parsing manually
   B) \`argparse\`
   C) \`getenv\`
   D) \`subprocess\`
   **Correct: B**

3. **Programs should report errors using:**
   A) A big dialog box
   B) \`sys.exit(0)\`
   C) Non-zero exit code + stderr message
   D) Only return value
   **Correct: C**

4. **\`json.dump(obj, f, indent=2)\` — \`indent=2\`:**
   A) Truncates long strings
   B) Pretty-prints JSON with 2-space indentation for humans
   C) Adds comments to JSON
   D) Requires paid license
   **Correct: B**

5. **Good way to build storage path relative to your own script file:**
   A) Hard-code \`./todos.json\`
   B) Use \`os.getenv('HOME') + '/todos.json'\`
   C) \`os.path.join(os.path.dirname(__file__), 'todos.json')\`
   D) Ask the user each time
   **Correct: C**

6. **To mark task #N done — correct search is:**
   A) Set todos[N] = done (index-based)
   B) Find first t where \`t['id'] == N\`, set done
   C) Delete the Nth line of the text file
   D) Run an SQL UPDATE
   **Correct: B** (IDs are stable)
`,
  },
  {
    sectionTitle: 'Python Projects',
    sectionOrder: 15,
    lessonOrder: 1,
    title: 'Project #2 – 10 More Mini Project Ideas',
    slug: 'python-project-ideas',
    estimatedMinutes: 20,
    content: `## Introduction

One project builds confidence; a portfolio builds a career. This lesson is a curated buffet of ten mini project prompts ranked by difficulty, each with suggested skills it exercises and hints at extension. Each one is small enough to ship in a weekend but meaty enough to show a recruiter. Work through them in order or jump to whichever sounds fun.

## Definition

These are **open-ended build prompts**, not tutorials. You are expected to:
1. Pick one and write a short spec ("user stories") for 3 core features + 1 stretch feature.
2. Implement it in Python as a single module or small package.
3. Use a README documenting installation + usage.
4. Commit it to a public GitHub/GitLab repo for practice.

## Why It Exists

Tutorials can only teach you syntax. **Projects teach you engineering**: choosing libraries, designing APIs, handling edge cases, debugging weird environmental issues, writing for maintainability, and shipping even when things are boring. A portfolio of 5 completed mini-projects on GitHub signals to employers that you can deliver working software — often outweighing grades or certifications for entry-level roles.

## How It Works

Approach every project the same way:
- **Step 1 (10 min):** Write down 3 must-have features. No more. Everything else is a bonus.
- **Step 2 (1 hour):** Sketch. List the Python modules / data structures / libraries you'll use. Draft CLI help or API endpoints.
- **Step 3 (2–6 hours):** Code vertically. Get ONE end-to-end scenario working before polishing.
- **Step 4 (1 hour):** Clean up. Add docstrings, README with install + example, commit.
- **Step 5 (optional):** Add 1 stretch feature. That's how you learn.

## Syntax / Patterns — reuse these across projects

\`\`\`python
# Project skeleton (CLI)
import argparse, sys

def run(args): ...          # core logic, pure when possible

def main(argv=None):
    p = argparse.ArgumentParser(description='...')
    p.add_argument('path', type=argparse.FileType('r', encoding='utf-8'))
    a = p.parse_args(argv)
    try:
        run(a)
    except KeyboardInterrupt:
        sys.exit(130)

# Project skeleton (simple HTTP API)
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({'ok': True}).encode()
        self.send_response(200)
        self.send_header('content-type','application/json')
        self.end_headers()
        self.wfile.write(body)
if __name__ == '__main__':
    HTTPServer(('', 8080), Handler).serve_forever()
\`\`\`

## Ten Project Ideas (Difficulty 1-10)

### 1. Number Guessing Game (★☆☆)
**Features:** random 1-100 secret, user inputs guesses, feedback "too high/too low", guess counter, play-again prompt. **Skills:** random, while, input, int conversion, break, exception handling for non-numeric input.

### 2. Rock Paper Scissors vs AI (★☆☆)
**Features:** player picks R/P/S, computer random pick, announce winner, running score across rounds, best-of-5 match. **Skills:** random.choice, score dict, match/elif, input validation.

### 3. Password Generator + Strength Checker (★★☆)
**Features:** configurable length, include/exclude symbols/digits/uppercase, entropy estimation, copy to clipboard (pyperclip), generate 10 variants at once. **Skills:** secrets (for security!), string constants, math.log for entropy, optional PyPI deps.

### 4. Expense Tracker CSV (★★☆)
**Features:** add(date,category,amount,note), list month-to-date, summarize by category pie chart (matplotlib), top-10 expenses. **Skills:** csv module, datetime, pathlib, defaultdict, matplotlib, argparse subcommands.

### 5. Markdown to HTML Converter (★★☆)
**Features:** input .md → output .html supporting headings (##, ###), bold, italic, bullet lists, code blocks, fenced syntax highlighting. **Skills:** regex re.sub, file I/O, line classification state machine.

### 6. Weather CLI (★★★)
**Features:** \`weather city_name\` calls OpenWeatherMap free API, prints current temp + description + forecast for next 3 days, cache responses to 10-min JSON cache. **Skills:** requests, argparse, datetime UTC offsets, dict caching, API keys via env vars.

### 7. Pomodoro Timer (★★★)
**Features:** 25-min work / 5-min break cycles, desktop notifications (plyer), sound, task log to CSV, shows statistics weekly bar chart. **Skills:** time.sleep, threading or sched, csv write, matplotlib, plyer on pypi.

### 8. URL Shortener Service (★★★★)
**Features:** POST /shorten → short URL, GET /{code} redirects, SQLite visit counter, stats page. **Skills:** Flask/FastAPI, SQLite/SQLAlchemy, redirects, random short codes.

### 9. Personal Blog Static Site Generator (★★★★)
**Features:** folder of .md posts → output folder of .html pages, home index page with reverse-chron listing, tag pages, RSS feed, syntax highlighting, sitemap. **Skills:** markdown library, Jinja2 templates, pathlib rglob, feedgen, dev auto-reload.

### 10. Discord/Slack Bot (★★★★)
**Features:** slash commands: roll dice, quote library, reminder bot using asyncio sleep, weather lookup (call the API from project 6). Deploy to a cheap VPS or Replit. **Skills:** discord.py / slack_sdk, async/await, sqlite persistent state, dotenv for tokens.

## Code Examples

### Example 1 – Minimal password generator (starter for Project 3)

\`\`\`python
import secrets, string
def gen_pw(length=20, *, digits=True, symbols=True, uppercase=True):
    chars = string.ascii_lowercase
    if uppercase: chars += string.ascii_uppercase
    if digits:    chars += string.digits
    if symbols:   chars += "!@#$%^&*()_+-=[]{};:,.<>?/~"
    return ''.join(secrets.choice(chars) for _ in range(length))
print(gen_pw())     # e.g., 'Q#s8$dZp!0L2a@kVxR5N'
\`\`\`

### Example 2 – Skeleton expense month summary (starter for Project 4)

\`\`\`python
import csv
from collections import defaultdict
def monthly_summary(csv_path, yyyy_mm):
    totals = defaultdict(float)
    with open(csv_path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            if row['date'].startswith(yyyy_mm):
                totals[row['category']] += float(row['amount'])
    return dict(sorted(totals.items(), key=lambda kv: -kv[1]))
\`\`\`

### Example 3 – Starter markdown → HTML regex rules (Project 5)

\`\`\`python
import re
def md_to_html(md: str) -> str:
    rules = [
        (re.compile(r'^### (.*)', re.M), r'<h3>\1</h3>'),
        (re.compile(r'^## (.*)',  re.M), r'<h2>\1</h2>'),
        (re.compile(r'^# (.*)',   re.M), r'<h1>\1</h1>'),
        (re.compile(r'\*\*(.+?)\*\*'), r'<strong>\1</strong>'),
        (re.compile(r'\\*(.+?)\\*'),    r'<em>\1</em>'),
        (re.compile(r'^- (.*)',   re.M), r'<li>\1</li>'),
    ]
    out = md
    for pat, repl in rules: out = pat.sub(repl, out)
    return out.replace('<li>', '<ul>\\n<li>', 1).replace('</li>\\n<li>', '</li>\\n<li>') + '\\n</ul>'
\`\`\`

## Best Practices

- **Use virtual environments.** Every single project. \`python -m venv .venv ; .venv/scripts/activate\` (windows) and then pip install into it only. Commit a \`requirements.txt\` (\`pip freeze > requirements.txt\`).
- **Put external config in env vars.** NEVER commit API keys / database URIs. Use \`python-dotenv\` and a \`.env.example\` file.
- **Write README as the first file, not the last.** Other humans (and future-you) are the real audience.
- **Handle missing dependencies with clear messages.** If you import requests and user hasn't installed it, they should see \`pip install requests\` not a 30-line traceback.
- **Name things properly.** \`pw_gen.py\` not \`thing2-final-working-edition-v4.py\`. A repo with good filenames, README, and consistent formatting looks professional regardless of size.
- **Demo GIFs > 1000 words of README explanation.** Use peek or ScreenToGif to record 10 seconds of real usage and paste at top of README.

## Common Mistakes

- **Scope creep gold plating.** Adding 18 features before you ship version 0.1. Ship minimal, working, documented. *Then* iterate.
- **Ignoring virtualenv and installing packages globally.** Within a month you'll hit dependency hell, guaranteed.
- **Secrets hard-coded in source.** Accidental GitHub push of an API key costs real money (or your AWS account hijacked). Use environment variables *always*.
- **No error handling around I/O or network.** You will get connection errors, permission errors, timeouts — wrap them in try/except, give the user a friendly message, don't print the raw traceback.
- **Only testing on your machine.** Ask a friend to clone and install from scratch — the README you wrote is missing steps. Trust me.
- **Writing 500-line modules without functions.** Split into logical functions (then classes, then packages) as you grow. A good rule: if you need a comment for a section, it probably deserved a function.

## Summary

Projects are where Python becomes a superpower rather than a textbook topic. Pick from the ten starters (or pick a personal itch), enforce 3-feature minimum scope, use virtualenvs and dotenv for secrets, document with README before coding, and ship small/working before adding polish. Finishing one small project teaches more than watching a 20-hour course. After shipping five, you'll have both the skills and the portfolio evidence to confidently call yourself a Python programmer.

---
### Practice Questions

1. **Q**: Explain "ship the minimal version first" philosophy.
   **A**: Get 3 core features working + documented before adding extras. Most projects die in scope creep. A version 0.1 that exists beats a v1.0 that's perpetually 90% complete.

2. **Q**: Why must API keys go in environment variables / .env instead of code?
   **A**: Two reasons: (1) The code might get pushed to GitHub accidentally — public bots scan for keys in real time and abuse them within minutes. (2) Environments (dev/staging/prod) need different keys without editing source.

3. **Q**: What is a requirements.txt and how is it generated?
   **A**: It's a frozen list of exact dependencies (== versions) so someone else can reproduce your environment. Generated with \`pip freeze > requirements.txt\` after pip installs inside an activated venv.

4. **Q**: What are at least three things every GitHub project README should have?
   **A**: (Any three+) Project title + one-line description, screenshot/demo GIF, features list, installation instructions, usage with examples, contributing guide, license.

5. **Q**: When should you use \`secrets.choice()\` vs \`random.choice()\`?
   **A**: \`random\` is for games/statistics (predictable seed). \`secrets\` is for security-sensitive tokens, passwords, API keys — cryptographically strong randomness.

6. **Q**: Why does Project 9 (blog SSG) use templating (Jinja2) instead of f-string HTML?
   **A**: Templates let you separate HTML from Python. You write layouts once, include navigation/footer from partials, pass post objects as context, and designers can edit templates without touching logic — at scale this is night-and-day cleaner than f-strings.

---
### Quiz (MCQ)

1. **Freeze Python dependencies exactly:**
   A) Copy your venv folder
   B) \`pip freeze > requirements.txt\`
   C) Screenshot pip list output
   D) Email them to yourself
   **Correct: B**

2. **Security-sensitive random (passwords/tokens) should use:**
   A) \`random\` module
   B) \`numpy.random\`
   C) \`secrets\` module
   D) \`hashlib.md5\`
   **Correct: C**

3. **API keys and DB URIs should be stored in:**
   A) Source code at top for visibility
   B) Environment variables / \`.env\` (never committed)
   C) README.md
   D) Printed on your monitor frame
   **Correct: B**

4. **Ship mentality for mini projects means:**
   A) Wait until perfect
   B) Ship small + documented, iterate
   C) Only ship 1000+ LOC
   D) Never publish source
   **Correct: B**

5. **Markdown to HTML converter typically uses:**
   A) Sockets
   B) Regex rules / line classification state machine
   C) OpenGL
   D) HTTP 404
   **Correct: B**

6. **Correct CLI return code on *success*:**
   A) \`sys.exit(255)\`
   B) \`sys.exit(1)\`
   C) \`sys.exit(0)\` / implicit return
   D) \`sys.exit('done')\`
   **Correct: C**
`,
  },
]

export function getLessons(): LessonSeedData[] {
  return PYTHON_LESSONS
}
