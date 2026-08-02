/**
 * FPRD-17 Phase 2 — Language Configuration
 * Each language has: runtime, version, starter template, timeLimit, memoryLimit.
 * Used by both the Piston adapter and the frontend template endpoint.
 */

import { ProgrammingLanguage } from '@prisma/client';

export interface LanguageConfig {
  runtime: string;          // Piston runtime name
  version: string;          // Piston runtime version pattern
  fileExtension: string;
  filename: string;         // file Piston expects
  starterTemplate: string;
  defaultTimeLimit: number; // ms
  defaultMemoryLimit: number; // MB
}

export const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, LanguageConfig> = {
  C: {
    runtime: 'c',
    version: '*',
    fileExtension: 'c',
    filename: 'main.c',
    defaultTimeLimit: 2000,
    defaultMemoryLimit: 256,
    starterTemplate: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
  },
  CPP: {
    runtime: 'c++',
    version: '*',
    fileExtension: 'cpp',
    filename: 'main.cpp',
    defaultTimeLimit: 2000,
    defaultMemoryLimit: 256,
    starterTemplate: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Your code here
    return 0;
}`,
  },
  JAVA: {
    runtime: 'java',
    version: '*',
    fileExtension: 'java',
    filename: 'Main.java',
    defaultTimeLimit: 4000,
    defaultMemoryLimit: 512,
    starterTemplate: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        // Your code here
    }
}`,
  },
  PYTHON: {
    runtime: 'python',
    version: '*',
    fileExtension: 'py',
    filename: 'main.py',
    defaultTimeLimit: 5000,
    defaultMemoryLimit: 256,
    starterTemplate: `import sys
input = sys.stdin.readline

def solve():
    # Your code here
    pass

solve()`,
  },
  JAVASCRIPT: {
    runtime: 'javascript',
    version: '*',
    fileExtension: 'js',
    filename: 'main.js',
    defaultTimeLimit: 5000,
    defaultMemoryLimit: 256,
    starterTemplate: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
    // Your code here
});`,
  },
  TYPESCRIPT: {
    runtime: 'typescript',
    version: '*',
    fileExtension: 'ts',
    filename: 'main.ts',
    defaultTimeLimit: 6000,
    defaultMemoryLimit: 256,
    starterTemplate: `import * as readline from 'readline';
const rl = readline.createInterface({ input: process.stdin });
const lines: string[] = [];
rl.on('line', (l: string) => lines.push(l.trim()));
rl.on('close', () => {
    // Your code here
});`,
  },
  GO: {
    runtime: 'go',
    version: '*',
    fileExtension: 'go',
    filename: 'main.go',
    defaultTimeLimit: 3000,
    defaultMemoryLimit: 256,
    starterTemplate: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    _ = reader
    // Your code here
    fmt.Println()
}`,
  },
  RUST: {
    runtime: 'rust',
    version: '*',
    fileExtension: 'rs',
    filename: 'main.rs',
    defaultTimeLimit: 3000,
    defaultMemoryLimit: 256,
    starterTemplate: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();
    // Your code here
}`,
  },
  CSHARP: {
    runtime: 'mono',
    version: '*',
    fileExtension: 'cs',
    filename: 'Main.cs',
    defaultTimeLimit: 4000,
    defaultMemoryLimit: 512,
    starterTemplate: `using System;
using System.Collections.Generic;

class Main {
    static void Main(string[] args) {
        // Your code here
    }
}`,
  },
  KOTLIN: {
    runtime: 'kotlin',
    version: '*',
    fileExtension: 'kt',
    filename: 'main.kt',
    defaultTimeLimit: 5000,
    defaultMemoryLimit: 512,
    starterTemplate: 'import java.util.Scanner\n\nfun main() {\n    val sc = Scanner(System.`in`)\n    // Your code here\n}',
  },
};
