/**
 * CODEFLOW — Per-Language Beginner Examples
 * PRD-2 §15: Each language has beginner examples at 6 levels:
 *   Level 1: Variables
 *   Level 2: Conditions
 *   Level 3: Loops
 *   Level 4: Functions
 *   Level 5: Arrays / Collections
 *   Level 6: Language-specific runtime concepts
 */

import { SupportedLanguage } from '../types';

export interface CodeExample {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  levelName: string;
  title: string;
  description: string;
  code: string;
}

const JAVASCRIPT_EXAMPLES: CodeExample[] = [
  {
    id: 'js-1-variables', level: 1, levelName: 'Variables',
    title: 'Variables & Data Types',
    description: 'Declare variables with var, let, const. Observe hoisting in the Creation Phase.',
    code: `var name = "Alice";
let age = 25;
const PI = 3.14;
var score;
console.log(name);
console.log(age);
console.log(PI);
console.log(score);`,
  },
  {
    id: 'js-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If / Else Conditions',
    description: 'Watch conditions evaluate step by step.',
    code: `let score = 75;
if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 75) {
  console.log("Grade: B");
} else {
  console.log("Grade: C");
}`,
  },
  {
    id: 'js-3-loops', level: 3, levelName: 'Loops',
    title: 'For Loop',
    description: 'Observe each loop iteration step by step.',
    code: `let sum = 0;
for (let i = 1; i <= 5; i++) {
  sum = sum + i;
  console.log("i=" + i + " sum=" + sum);
}
console.log("Total: " + sum);`,
  },
  {
    id: 'js-4-functions', level: 4, levelName: 'Functions',
    title: 'Function Calls & Call Stack',
    description: 'Watch functions push and pop from the Call Stack.',
    code: `function greet(name) {
  return "Hello, " + name + "!";
}

function add(a, b) {
  return a + b;
}

let msg = greet("World");
console.log(msg);
let result = add(3, 4);
console.log(result);`,
  },
  {
    id: 'js-5-arrays', level: 5, levelName: 'Arrays',
    title: 'Arrays & Iteration',
    description: 'Create arrays and iterate over them.',
    code: `let numbers = [10, 20, 30, 40, 50];
let total = 0;
for (let i = 0; i < numbers.length; i++) {
  total += numbers[i];
  console.log("numbers[" + i + "] = " + numbers[i]);
}
console.log("Total: " + total);`,
  },
  {
    id: 'js-6-event-loop', level: 6, levelName: 'Runtime Concepts',
    title: 'Event Loop & Async',
    description: 'See how setTimeout moves through Web APIs → Task Queue → Call Stack via the Event Loop.',
    code: `console.log("Start");

setTimeout(function() {
  console.log("Timeout callback");
}, 0);

console.log("End");`,
  },
];

const PYTHON_EXAMPLES: CodeExample[] = [
  {
    id: 'py-1-variables', level: 1, levelName: 'Variables',
    title: 'Variables & Types',
    description: 'Python is dynamically typed. Watch variables appear in the global frame.',
    code: `name = "Alice"
age = 25
pi = 3.14159
is_student = True
nothing = None
print(name)
print(age)
print(pi)
print(is_student)`,
  },
  {
    id: 'py-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If / Elif / Else',
    description: 'Python uses indentation for blocks. Watch each condition evaluate.',
    code: `score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")`,
  },
  {
    id: 'py-3-loops', level: 3, levelName: 'Loops',
    title: 'For Loop with range()',
    description: 'Python for-loops iterate over sequences. Watch the loop variable update.',
    code: `total = 0
for i in range(1, 6):
    total = total + i
    print("i=" + str(i) + " total=" + str(total))
print("Sum:", total)`,
  },
  {
    id: 'py-4-functions', level: 4, levelName: 'Functions',
    title: 'Functions & Frames',
    description: 'Each function call creates a new execution frame. Watch frames appear on the call stack.',
    code: `def greet(name):
    message = "Hello, " + name + "!"
    return message

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

msg = greet("World")
print(msg)
result = factorial(5)
print(result)`,
  },
  {
    id: 'py-5-lists', level: 5, levelName: 'Lists',
    title: 'Lists & Iteration',
    description: 'Python lists are dynamic arrays. Watch elements being appended and iterated.',
    code: `numbers = [3, 1, 4, 1, 5, 9, 2]
total = 0
for num in numbers:
    total = total + num
print("Sum:", total)
numbers.append(6)
print("Length:", len(numbers))`,
  },
  {
    id: 'py-6-runtime', level: 6, levelName: 'Runtime Concepts',
    title: 'Python VM & Bytecode',
    description: 'See the Python compilation pipeline: Source → Bytecode → PVM → Execution Frames.',
    code: `def add(a, b):
    result = a + b
    return result

x = 10
y = 20
z = add(x, y)
print("Result:", z)`,
  },
];

const C_EXAMPLES: CodeExample[] = [
  {
    id: 'c-1-variables', level: 1, levelName: 'Variables',
    title: 'Typed Variables & Stack',
    description: 'C requires explicit types. Watch variables allocated on the stack.',
    code: `#include <stdio.h>

int main() {
    int age = 25;
    float pi = 3.14;
    char grade = 'A';
    printf("Age: %d\\n", age);
    printf("Pi: %f\\n", pi);
    printf("Grade: %c\\n", grade);
    return 0;
}`,
  },
  {
    id: 'c-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If / Else in C',
    description: 'C conditions use 0 for false, non-zero for true.',
    code: `#include <stdio.h>

int main() {
    int score = 75;
    if (score >= 90) {
        printf("Grade A\\n");
    } else if (score >= 75) {
        printf("Grade B\\n");
    } else {
        printf("Grade C\\n");
    }
    return 0;
}`,
  },
  {
    id: 'c-3-loops', level: 3, levelName: 'Loops',
    title: 'While Loop in C',
    description: 'Watch each loop iteration step by step.',
    code: `#include <stdio.h>

int main() {
    int i = 1;
    int sum = 0;
    while (i <= 5) {
        sum = sum + i;
        printf("i=%d sum=%d\\n", i, sum);
        i++;
    }
    printf("Total: %d\\n", sum);
    return 0;
}`,
  },
  {
    id: 'c-4-functions', level: 4, levelName: 'Functions',
    title: 'C Functions & Stack Frames',
    description: 'Each function call creates a new stack frame with local variables.',
    code: `#include <stdio.h>

int add(int a, int b) {
    int result = a + b;
    return result;
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int sum = add(3, 4);
    printf("Sum: %d\\n", sum);
    int fact = factorial(5);
    printf("Factorial: %d\\n", fact);
    return 0;
}`,
  },
  {
    id: 'c-5-arrays', level: 5, levelName: 'Arrays',
    title: 'Arrays in C',
    description: 'C arrays are stored contiguously on the stack.',
    code: `#include <stdio.h>

int main() {
    int numbers[5] = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += numbers[i];
        printf("numbers[%d] = %d\\n", i, numbers[i]);
    }
    printf("Sum: %d\\n", sum);
    return 0;
}`,
  },
  {
    id: 'c-6-pointers', level: 6, levelName: 'Runtime Concepts',
    title: 'Pointers & Memory',
    description: 'See the compilation pipeline and how pointers reference memory addresses.',
    code: `#include <stdio.h>

int main() {
    int x = 10;
    int *ptr = &x;
    printf("x = %d\\n", x);
    printf("ptr points to: %d\\n", *ptr);
    *ptr = 20;
    printf("x after *ptr=20: %d\\n", x);
    return 0;
}`,
  },
];

const CPP_EXAMPLES: CodeExample[] = [
  {
    id: 'cpp-1-variables', level: 1, levelName: 'Variables',
    title: 'C++ Variables & Types',
    description: 'C++ has both primitive types and std::string.',
    code: `#include <iostream>
using namespace std;

int main() {
    int age = 25;
    double pi = 3.14159;
    bool active = true;
    string name = "Alice";
    cout << name << endl;
    cout << age << endl;
    cout << pi << endl;
    return 0;
}`,
  },
  {
    id: 'cpp-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If/Else in C++',
    description: 'Identical to C conditions but with iostream output.',
    code: `#include <iostream>
using namespace std;

int main() {
    int score = 85;
    if (score >= 90) {
        cout << "Grade A" << endl;
    } else if (score >= 80) {
        cout << "Grade B" << endl;
    } else {
        cout << "Grade C" << endl;
    }
    return 0;
}`,
  },
  {
    id: 'cpp-3-loops', level: 3, levelName: 'Loops',
    title: 'For Loop in C++',
    description: 'Watch each iteration with variable updates.',
    code: `#include <iostream>
using namespace std;

int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
        cout << i << endl;
    }
    cout << sum << endl;
    return 0;
}`,
  },
  {
    id: 'cpp-4-functions', level: 4, levelName: 'Functions',
    title: 'Functions & Stack Frames',
    description: 'C++ functions with typed parameters and return values.',
    code: `#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    cout << add(3, 4) << endl;
    cout << factorial(5) << endl;
    return 0;
}`,
  },
  {
    id: 'cpp-5-arrays', level: 5, levelName: 'Arrays',
    title: 'Arrays & Vectors',
    description: 'C++ arrays and dynamic vectors.',
    code: `#include <iostream>
using namespace std;

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += arr[i];
        cout << arr[i] << endl;
    }
    cout << sum << endl;
    return 0;
}`,
  },
  {
    id: 'cpp-6-heap', level: 6, levelName: 'Runtime Concepts',
    title: 'Heap Memory & Pointers',
    description: 'See how new allocates on the heap and delete frees it.',
    code: `#include <iostream>
using namespace std;

int main() {
    int *ptr = new int(42);
    cout << *ptr << endl;
    *ptr = 100;
    cout << *ptr << endl;
    delete ptr;
    return 0;
}`,
  },
];

const CSHARP_EXAMPLES: CodeExample[] = [
  {
    id: 'cs-1-variables', level: 1, levelName: 'Variables',
    title: 'C# Variables & Types',
    description: 'C# is strongly typed. Variables are stored in managed memory.',
    code: `using System;

class Program {
    static void Main() {
        int age = 25;
        double pi = 3.14159;
        bool isActive = true;
        string name = "Alice";
        Console.WriteLine(name);
        Console.WriteLine(age);
        Console.WriteLine(pi);
    }
}`,
  },
  {
    id: 'cs-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If/Else in C#',
    description: 'C# boolean expressions are strictly bool.',
    code: `using System;

class Program {
    static void Main() {
        int score = 85;
        if (score >= 90) {
            Console.WriteLine("Grade A");
        } else if (score >= 80) {
            Console.WriteLine("Grade B");
        } else {
            Console.WriteLine("Grade C");
        }
    }
}`,
  },
  {
    id: 'cs-3-loops', level: 3, levelName: 'Loops',
    title: 'For Loop in C#',
    description: 'Watch the for loop iterate step by step.',
    code: `using System;

class Program {
    static void Main() {
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
            Console.WriteLine(i);
        }
        Console.WriteLine(sum);
    }
}`,
  },
  {
    id: 'cs-4-methods', level: 4, levelName: 'Methods',
    title: 'Methods & Call Stack',
    description: 'C# method calls create managed stack frames.',
    code: `using System;

class Program {
    static int Add(int a, int b) {
        return a + b;
    }

    static int Factorial(int n) {
        if (n <= 1) return 1;
        return n * Factorial(n - 1);
    }

    static void Main() {
        Console.WriteLine(Add(3, 4));
        Console.WriteLine(Factorial(5));
    }
}`,
  },
  {
    id: 'cs-5-arrays', level: 5, levelName: 'Arrays',
    title: 'Arrays & foreach',
    description: 'C# arrays are objects on the managed heap.',
    code: `using System;

class Program {
    static void Main() {
        int[] numbers = {10, 20, 30, 40, 50};
        int sum = 0;
        foreach (int n in numbers) {
            sum += n;
            Console.WriteLine(n);
        }
        Console.WriteLine(sum);
    }
}`,
  },
  {
    id: 'cs-6-clr', level: 6, levelName: 'Runtime Concepts',
    title: 'CLR, JIT & Managed Heap',
    description: 'See the Roslyn → MSIL → CLR → JIT pipeline and GC events.',
    code: `using System;

class Program {
    static void Main() {
        int x = 10;
        int y = 20;
        int result = x + y;
        Console.WriteLine(result);
        string s = "Hello CLR";
        Console.WriteLine(s);
    }
}`,
  },
];

const JAVA_EXAMPLES: CodeExample[] = [
  {
    id: 'java-1-variables', level: 1, levelName: 'Variables',
    title: 'Java Variables & Types',
    description: 'Java is statically typed. See JVM class loading and variable initialization.',
    code: `public class Main {
    public static void main(String[] args) {
        int age = 25;
        double pi = 3.14159;
        boolean isActive = true;
        String name = "Alice";
        System.out.println(name);
        System.out.println(age);
        System.out.println(pi);
    }
}`,
  },
  {
    id: 'java-2-conditions', level: 2, levelName: 'Conditions',
    title: 'If/Else in Java',
    description: 'Java conditions must evaluate to boolean.',
    code: `public class Main {
    public static void main(String[] args) {
        int score = 85;
        if (score >= 90) {
            System.out.println("Grade A");
        } else if (score >= 80) {
            System.out.println("Grade B");
        } else {
            System.out.println("Grade C");
        }
    }
}`,
  },
  {
    id: 'java-3-loops', level: 3, levelName: 'Loops',
    title: 'For Loop in Java',
    description: 'Watch the JVM execute each iteration step by step.',
    code: `public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
            System.out.println(i);
        }
        System.out.println(sum);
    }
}`,
  },
  {
    id: 'java-4-methods', level: 4, levelName: 'Methods',
    title: 'Methods & JVM Stack Frames',
    description: 'Each method invocation pushes a new frame onto the JVM stack.',
    code: `public class Main {
    static int add(int a, int b) {
        return a + b;
    }

    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        System.out.println(add(3, 4));
        System.out.println(factorial(5));
    }
}`,
  },
  {
    id: 'java-5-arrays', level: 5, levelName: 'Arrays',
    title: 'Arrays & Enhanced For',
    description: 'Java arrays are objects stored on the heap.',
    code: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40, 50};
        int sum = 0;
        for (int n : numbers) {
            sum += n;
            System.out.println(n);
        }
        System.out.println(sum);
    }
}`,
  },
  {
    id: 'java-6-jvm', level: 6, levelName: 'Runtime Concepts',
    title: 'JVM Heap & GC',
    description: 'See the bytecode → JVM pipeline, heap object creation, and GC events.',
    code: `public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int result = x + y;
        System.out.println(result);
        String msg = "Hello JVM";
        System.out.println(msg);
    }
}`,
  },
];

const EXAMPLES_MAP: Record<SupportedLanguage, CodeExample[]> = {
  javascript: JAVASCRIPT_EXAMPLES,
  python: PYTHON_EXAMPLES,
  c: C_EXAMPLES,
  cpp: CPP_EXAMPLES,
  csharp: CSHARP_EXAMPLES,
  java: JAVA_EXAMPLES,
};

export function getExamplesForLanguage(language: SupportedLanguage): CodeExample[] {
  return EXAMPLES_MAP[language] ?? [];
}

export function getAllExamples(): Record<SupportedLanguage, CodeExample[]> {
  return EXAMPLES_MAP;
}
