#!/usr/bin/env node
/**
 * FPRD-19 Batch 2 — Additional ~130+ problems to reach ~300 total.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'datasets', 'problems');
const starter = {
  python: "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nsolve()",
  javascript: "const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Your code here",
  java: "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n    }\n}",
  cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Your code here\n    return 0;\n}"
};

const hashing2 = [
  { title:"Happy Number", slug:"happy-number", difficulty:"EASY", topic:"hashing",
    statement:"A happy number is defined: starting with any positive integer, replace the number with the sum of squares of its digits. Repeat until the number equals 1 (happy) or loops endlessly (unhappy). Return `true` if happy, `false` if not.",
    constraints:"- `1 <= n <= 2^31 - 1`",
    examples:[{input:"19",output:"true",explanation:"1^2+9^2=82, 8^2+2^2=68, 6^2+8^2=100, 1^2+0+0=1"},{input:"2",output:"false"}],
    hints:["Use a set to detect cycles.","Or use Floyd's cycle detection."],
    tags:["Hash Table","Math","Two Pointers"],companies:["Amazon","Google","Apple"],
    visibleTests:[{input:"19",output:"true"},{input:"2",output:"false"}],
    hiddenTests:[{input:"1",output:"true"},{input:"7",output:"true"},{input:"10",output:"true"},{input:"13",output:"true"},{input:"3",output:"false"},{input:"4",output:"false"},{input:"100",output:"true"},{input:"82",output:"false"},{input:"1000",output:"true"},{input:"999",output:"false"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:12,license:"ORIGINAL",starterCode:starter },

  { title:"Contains Nearby Duplicate", slug:"contains-nearby-duplicate", difficulty:"EASY", topic:"hashing",
    statement:"Given an integer array `nums` and an integer `k`, return `true` if there exist indices `i` and `j` such that `nums[i] == nums[j]` and `|i - j| <= k`.",
    constraints:"- `1 <= nums.length <= 10^5`\n- `-10^9 <= nums[i] <= 10^9`\n- `0 <= k <= 10^5`",
    examples:[{input:"4 1\n1 2 3 1",output:"true"},{input:"4 2\n1 2 3 1 2 3",output:"false"}],
    hints:["Use a hash map to store the last seen index of each value.","If current index - last_seen_index <= k, return true."],
    tags:["Array","Hash Table","Sliding Window"],companies:["Amazon","Adobe"],
    visibleTests:[{input:"4 1\n1 2 3 1",output:"true"},{input:"6 2\n1 2 3 1 2 3",output:"false"}],
    hiddenTests:[{input:"3 3\n1 2 3 1",output:"true"},{input:"2 1\n1 1",output:"true"},{input:"1 0\n1",output:"false"},{input:"4 0\n1 1 1 1",output:"false"},{input:"5 3\n1 2 3 4 5",output:"false"},{input:"5 4\n1 2 3 4 1",output:"true"},{input:"4 2\n4 1 2 3",output:"false"},{input:"5 2\n1 0 1 1 1",output:"true"},{input:"5 1\n2 2 2 2 2",output:"true"},{input:"4 3\n1 2 3 4",output:"false"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:12,license:"ORIGINAL",starterCode:starter },

  { title:"Continuous Subarray Sum Multiple of K", slug:"continuous-subarray-sum-k", difficulty:"MEDIUM", topic:"hashing",
    statement:"Given an integer array `nums` and an integer `k`, return `true` if `nums` has a **continuous subarray of size at least 2** whose elements sum up to a multiple of `k`. Otherwise return `false`.",
    constraints:"- `1 <= nums.length <= 10^5`\n- `0 <= nums[i] <= 10^9`\n- `0 <= k <= 2^31 - 1`",
    examples:[{input:"5 6\n23 2 4 6 7",output:"true"},{input:"5 6\n23 2 6 4 7",output:"true"}],
    hints:["Use prefix sum mod k.","If the same remainder appears at two indices i and j where j - i > 1, then sum is multiple of k."],
    tags:["Array","Hash Table","Math","Prefix Sum"],companies:["Amazon","Google"],
    visibleTests:[{input:"5 6\n23 2 4 6 7",output:"true"},{input:"5 6\n23 2 6 4 7",output:"true"}],
    hiddenTests:[{input:"2 0\n0 0",output:"true"},{input:"2 1\n1 0",output:"true"},{input:"3 5\n1 2 3",output:"true"},{input:"3 5\n1 2 2",output:"false"},{input:"5 7\n23 2 4 6 7",output:"false"},{input:"4 3\n0 0 3 6",output:"true"},{input:"3 0\n5 5 5",output:"true"},{input:"2 3\n1 2",output:"true"},{input:"5 10\n0 1 0 1 0",output:"false"},{input:"4 7\n3 4 7 6",output:"true"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },
];

const sorting2 = [
  { title:"Count Inversions in Array", slug:"count-inversions-array", difficulty:"MEDIUM", topic:"sorting",
    statement:"Given an array of integers, count the number of **inversions** (pairs `i < j` where `arr[i] > arr[j]`).",
    constraints:"- `1 <= n <= 10^5`\n- `0 <= arr[i] <= 10^9`",
    examples:[{input:"5\n2 4 1 3 5",output:"3"},{input:"4\n3 2 1 0",output:"6"}],
    hints:["Modify merge sort: while merging, count elements where left > right."],
    tags:["Array","Sorting","Divide and Conquer"],companies:["Amazon","Google","Microsoft","Flipkart"],
    visibleTests:[{input:"5\n2 4 1 3 5",output:"3"},{input:"4\n3 2 1 0",output:"6"}],
    hiddenTests:[{input:"1\n1",output:"0"},{input:"3\n1 2 3",output:"0"},{input:"3\n3 2 1",output:"3"},{input:"4\n1 3 2 4",output:"1"},{input:"5\n1 5 2 4 3",output:"4"},{input:"6\n6 5 4 3 2 1",output:"15"},{input:"4\n1 2 3 4",output:"0"},{input:"5\n5 1 2 3 4",output:"4"},{input:"4\n2 1 4 3",output:"2"},{input:"5\n1 20 6 4 5",output:"5"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:30,license:"ORIGINAL",starterCode:starter },

  { title:"Wiggle Sort", slug:"wiggle-sort", difficulty:"MEDIUM", topic:"sorting",
    statement:"Given an integer array `nums`, reorder it in-place such that `nums[0] <= nums[1] >= nums[2] <= nums[3]...`. Print the resulting array.\n\nMultiple valid answers are possible — print any valid one.",
    constraints:"- `1 <= nums.length <= 5 * 10^4`\n- `0 <= nums[i] <= 10^4`",
    examples:[{input:"3\n3 5 2",output:"3 5 2"},{input:"4\n6 6 5 3",output:"3 6 5 6"}],
    hints:["For every even index i: if nums[i] > nums[i+1], swap.","For every odd index i: if nums[i] < nums[i+1], swap."],
    tags:["Array","Sorting","Greedy"],companies:["Amazon","Google"],
    visibleTests:[{input:"3\n3 5 2",output:"3 5 2"},{input:"4\n6 6 5 3",output:"3 6 5 6"}],
    hiddenTests:[{input:"1\n1",output:"1"},{input:"2\n1 2",output:"1 2"},{input:"2\n2 1",output:"1 2"},{input:"5\n1 2 3 4 5",output:"1 3 2 5 4"},{input:"4\n4 3 2 1",output:"1 4 2 3"},{input:"5\n0 0 0 0 0",output:"0 0 0 0 0"},{input:"3\n1 1 1",output:"1 1 1"},{input:"5\n5 3 1 4 2",output:"1 5 2 4 3"},{input:"4\n1 2 1 2",output:"1 2 1 2"},{input:"6\n1 5 1 1 6 4",output:"1 5 1 6 1 4"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },
];

const arrays2 = [
  { title:"Maximum Circular Subarray Sum", slug:"max-circular-subarray-sum", difficulty:"MEDIUM", topic:"arrays",
    statement:"Given a circular integer array `nums` (the last element and first element are adjacent), find the maximum possible sum of a non-empty subarray of `nums`.",
    constraints:"- `1 <= nums.length <= 3 * 10^4`\n- `-3 * 10^4 <= nums[i] <= 3 * 10^4`",
    examples:[{input:"4\n1 -2 3 -2",output:"3"},{input:"4\n5 -3 5",output:"10"}],
    hints:["max circular sum = max(max_subarray, total_sum - min_subarray).","Edge case: if all elements are negative, return the max element."],
    tags:["Array","Divide and Conquer","Dynamic Programming","Queue"],companies:["Amazon","Google"],
    visibleTests:[{input:"4\n1 -2 3 -2",output:"3"},{input:"3\n5 -3 5",output:"10"}],
    hiddenTests:[{input:"1\n5",output:"5"},{input:"1\n-5",output:"-5"},{input:"3\n-1 -2 -3",output:"-1"},{input:"4\n3 -1 2 -1",output:"4"},{input:"5\n3 -2 2 -3 3",output:"6"},{input:"4\n2 2 2 2",output:"8"},{input:"3\n-3 -2 -3",output:"-2"},{input:"5\n1 2 3 4 5",output:"15"},{input:"5\n5 -3 -3 -3 5",output:"10"},{input:"4\n1 -1 1 -1",output:"1"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },

  { title:"Gas Stations Visited", slug:"gas-stations-visited", difficulty:"EASY", topic:"arrays",
    statement:"There are `n` cities in a row. You start at city 0 with `fuel` units of fuel. Each move to the next city costs 1 fuel. City `i` has `gas[i]` fuel you can collect upon arriving.\n\nReturn the maximum city index you can reach (0-indexed). You cannot go backwards.",
    constraints:"- `1 <= n <= 10^5`\n- `0 <= fuel <= 10^9`\n- `0 <= gas[i] <= 10^5`",
    examples:[{input:"5 3\n1 2 3 4 5",output:"4"},{input:"5 0\n0 0 0 0 10",output:"0"}],
    hints:["Simulate: start with fuel, add gas[i] after reaching city i, subtract 1 to move forward.","Stop when fuel hits -1."],
    tags:["Array","Greedy"],companies:["Amazon"],
    visibleTests:[{input:"5 3\n1 2 3 4 5",output:"4"},{input:"5 0\n0 0 0 0 10",output:"0"}],
    hiddenTests:[{input:"3 0\n1 0 0",output:"1"},{input:"3 5\n0 0 0",output:"2"},{input:"5 10\n0 0 0 0 0",output:"4"},{input:"4 2\n0 5 0 0",output:"3"},{input:"5 1\n2 0 0 0 0",output:"4"},{input:"3 0\n0 0 0",output:"0"},{input:"5 3\n0 0 0 0 0",output:"3"},{input:"4 0\n3 0 0 0",output:"3"},{input:"5 2\n1 1 1 1 1",output:"4"},{input:"3 1\n0 0 5",output:"2"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:12,license:"ORIGINAL",starterCode:starter },

  { title:"Minimum Jumps to Reach End", slug:"minimum-jumps-reach-end", difficulty:"MEDIUM", topic:"arrays",
    statement:"Given an integer array `nums` where `nums[i]` is the maximum jump length from index `i`, return the **minimum number of jumps** to reach the last index starting from index 0.\n\nAssume you can always reach the last index.",
    constraints:"- `1 <= nums.length <= 10^4`\n- `0 <= nums[i] <= 1000`",
    examples:[{input:"6\n2 3 1 1 4",output:"2"},{input:"5\n2 3 0 1 4",output:"2"}],
    hints:["Greedy BFS-style: track the farthest reachable from current jump range.","Increment jump count when you pass the current range boundary."],
    tags:["Array","Greedy","Dynamic Programming"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"5\n2 3 1 1 4",output:"2"},{input:"5\n2 3 0 1 4",output:"2"}],
    hiddenTests:[{input:"1\n0",output:"0"},{input:"2\n1 0",output:"1"},{input:"3\n1 1 1",output:"2"},{input:"5\n5 4 3 2 1",output:"1"},{input:"6\n1 1 1 1 1 1",output:"5"},{input:"5\n3 2 1 1 1",output:"2"},{input:"6\n2 1 2 3 1 4",output:"3"},{input:"4\n1 2 3 1",output:"2"},{input:"7\n1 2 3 4 1 1 1",output:"3"},{input:"5\n5 5 5 5 5",output:"1"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },

  { title:"Find the Missing Number", slug:"find-missing-number", difficulty:"EASY", topic:"arrays",
    statement:"Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing.",
    constraints:"- `n == nums.length`\n- `1 <= n <= 10^4`\n- `0 <= nums[i] <= n`\n- All numbers are unique.",
    examples:[{input:"3\n3 0 1",output:"2"},{input:"4\n9 6 4 2 3 5 7 0 1",output:"8"}],
    hints:["Expected sum = n*(n+1)/2. Missing = expected - actual sum.","Or XOR all indices and array values; duplicates cancel."],
    tags:["Array","Bit Manipulation","Math","Hash Table"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"3\n3 0 1",output:"2"},{input:"9\n9 6 4 2 3 5 7 0 1",output:"8"}],
    hiddenTests:[{input:"1\n0",output:"1"},{input:"1\n1",output:"0"},{input:"2\n1 0",output:"2"},{input:"3\n0 1 2",output:"3"},{input:"5\n0 1 3 4 5",output:"2"},{input:"5\n5 4 3 2 1",output:"0"},{input:"4\n0 2 3 4",output:"1"},{input:"6\n6 1 2 3 4 5",output:"0"},{input:"5\n0 1 2 3 5",output:"4"},{input:"4\n0 1 2 4",output:"3"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:10,license:"ORIGINAL",starterCode:starter },

  { title:"Array of Doubled Pairs", slug:"array-doubled-pairs", difficulty:"MEDIUM", topic:"arrays",
    statement:"Given an integer array of even length, return `true` if it is possible to reorder it such that for every pair `arr[2i]` and `arr[2i+1]`, one element equals double the other.",
    constraints:"- `2 <= arr.length <= 3 * 10^4`\n- `arr.length % 2 == 0`\n- `-10^5 <= arr[i] <= 10^5`",
    examples:[{input:"4\n3 1 3 6",output:"true"},{input:"4\n2 1 2 6",output:"false"}],
    hints:["Sort by absolute value.","Use a frequency map; for smallest absolute value x, pair it with 2x."],
    tags:["Array","Hash Table","Greedy","Sorting"],companies:["Amazon","Google"],
    visibleTests:[{input:"4\n3 1 3 6",output:"true"},{input:"4\n2 1 2 6",output:"false"}],
    hiddenTests:[{input:"4\n4 -2 2 -4",output:"true"},{input:"4\n1 2 4 16",output:"false"},{input:"2\n2 4",output:"true"},{input:"4\n0 0 2 0",output:"false"},{input:"4\n0 0 0 0",output:"true"},{input:"6\n1 2 4 8 16 32",output:"false"},{input:"4\n2 4 4 8",output:"false"},{input:"6\n1 2 2 4 4 8",output:"true"},{input:"4\n-2 -4 0 0",output:"true"},{input:"4\n3 6 2 4",output:"true"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },
];

const dp2 = [
  { title:"Edit Distance", slug:"edit-distance", difficulty:"MEDIUM", topic:"dynamic-programming",
    statement:"Given two strings `word1` and `word2`, return the **minimum number of operations** (insert, delete, replace) required to convert `word1` to `word2`.",
    constraints:"- `0 <= word1.length, word2.length <= 500`",
    examples:[{input:"horse\nros",output:"3"},{input:"intention\nexecution",output:"5"}],
    hints:["dp[i][j] = edit distance of word1[0..i-1] and word2[0..j-1].","If chars match: dp[i][j] = dp[i-1][j-1].","Else: 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])."],
    tags:["String","Dynamic Programming"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"horse\nros",output:"3"},{input:"intention\nexecution",output:"5"}],
    hiddenTests:[{input:"a\nb",output:"1"},{input:"a\na",output:"0"},{input:"abc\nabc",output:"0"},{input:"abc\n",output:"3"},{input:"\nabc",output:"3"},{input:"ab\nba",output:"2"},{input:"kitten\nsitting",output:"3"},{input:"sunday\nsaturday",output:"3"},{input:"food\nmoney",output:"4"},{input:"abc\nbc",output:"1"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:30,license:"ORIGINAL",starterCode:starter },

  { title:"Longest Common Subsequence", slug:"longest-common-subsequence", difficulty:"MEDIUM", topic:"dynamic-programming",
    statement:"Given two strings `text1` and `text2`, return the length of their **longest common subsequence**. A subsequence is derived from a string by deleting some (or no) characters without changing the remaining order.",
    constraints:"- `1 <= text1.length, text2.length <= 1000`\n- Both strings consist of lowercase English letters.",
    examples:[{input:"abcde\nace",output:"3"},{input:"abc\nabc",output:"3"}],
    hints:["dp[i][j] = LCS of text1[0..i-1] and text2[0..j-1].","If chars match: dp[i][j] = dp[i-1][j-1]+1; else max(dp[i-1][j], dp[i][j-1])."],
    tags:["String","Dynamic Programming"],companies:["Amazon","Google","Microsoft","Adobe"],
    visibleTests:[{input:"abcde\nace",output:"3"},{input:"abc\nabc",output:"3"}],
    hiddenTests:[{input:"abc\ndef",output:"0"},{input:"a\na",output:"1"},{input:"bl\nyby",output:"1"},{input:"abcba\nabcbcba",output:"5"},{input:"oxcpqrsvwf\nshmtulqrypy",output:"2"},{input:"ezupkr\nubmrapg",output:"2"},{input:"hofubmnylkra\nlyb",output:"2"},{input:"abc\nc",output:"1"},{input:"abab\nbaba",output:"3"},{input:"geeks\ngeeksfor",output:"5"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },

  { title:"Triangle Minimum Path Sum", slug:"triangle-minimum-path-sum", difficulty:"MEDIUM", topic:"dynamic-programming",
    statement:"Given a triangle (as rows of numbers), find the minimum path sum from top to bottom. At each step you may move to adjacent numbers on the row below.",
    constraints:"- `1 <= triangle.length <= 200`\n- `triangle[i].length == i + 1`\n- `-10^4 <= triangle[i][j] <= 10^4`",
    examples:[{input:"4\n2\n3 4\n6 5 7\n4 1 8 3",output:"11"},{input:"1\n-10",output:"-10"}],
    hints:["Work bottom-up: for each element add the minimum of the two below.","dp[i] = triangle[row][i] + min(dp[i], dp[i+1])."],
    tags:["Array","Dynamic Programming"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"4\n2\n3 4\n6 5 7\n4 1 8 3",output:"11"},{input:"1\n-10",output:"-10"}],
    hiddenTests:[{input:"1\n1",output:"1"},{input:"2\n1\n2 3",output:"3"},{input:"3\n2\n3 4\n6 5 7",output:"10"},{input:"3\n-1\n2 3\n1 -1 -3",output:"-1"},{input:"4\n1\n2 3\n4 5 6\n7 8 9 10",output:"14"},{input:"3\n5\n1 2\n3 4 5",output:"9"},{input:"4\n2\n3 2\n6 5 7\n4 4 8 1",output:"11"},{input:"2\n0\n5 0",output:"0"},{input:"3\n1\n3 5\n2 1 4",output:"5"},{input:"5\n5\n9 6\n4 6 8\n0 7 1 5\n0 1 2 3 4",output:"10"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },
];

const strings2 = [
  { title:"Roman to Integer", slug:"roman-to-integer", difficulty:"EASY", topic:"strings",
    statement:"Given a roman numeral string, convert it to an integer.\n\nSymbols: I=1, V=5, X=10, L=50, C=100, D=500, M=1000\nSubtraction: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900",
    constraints:"- `1 <= s.length <= 15`\n- `s` consists of `I`, `V`, `X`, `L`, `C`, `D`, `M`.\n- It is guaranteed to be a valid roman numeral in the range `[1, 3999]`.",
    examples:[{input:"III",output:"3"},{input:"MCMXCIV",output:"1994"}],
    hints:["Map each symbol to its value.","If current value < next value, subtract current; else add."],
    tags:["Hash Table","Math","String"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"III",output:"3"},{input:"MCMXCIV",output:"1994"}],
    hiddenTests:[{input:"I",output:"1"},{input:"IV",output:"4"},{input:"IX",output:"9"},{input:"LVIII",output:"58"},{input:"MMCMXCIX",output:"2999"},{input:"MMMCMXCIX",output:"3999"},{input:"CMXCIX",output:"999"},{input:"DCCCXCIX",output:"899"},{input:"M",output:"1000"},{input:"CDXLIV",output:"444"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:10,license:"ORIGINAL",starterCode:starter },

  { title:"Integer to Roman", slug:"integer-to-roman", difficulty:"MEDIUM", topic:"strings",
    statement:"Given an integer, convert it to a roman numeral.",
    constraints:"- `1 <= num <= 3999`",
    examples:[{input:"3",output:"III"},{input:"1994",output:"MCMXCIV"}],
    hints:["Use a greedy approach: repeatedly subtract the largest possible value.","Keep a list of value-symbol pairs sorted descending."],
    tags:["Hash Table","Math","String"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"3",output:"III"},{input:"1994",output:"MCMXCIV"}],
    hiddenTests:[{input:"1",output:"I"},{input:"4",output:"IV"},{input:"9",output:"IX"},{input:"58",output:"LVIII"},{input:"1000",output:"M"},{input:"3999",output:"MMMCMXCIX"},{input:"58",output:"LVIII"},{input:"444",output:"CDXLIV"},{input:"1776",output:"MDCCLXXVI"},{input:"2024",output:"MMXXIV"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:15,license:"ORIGINAL",starterCode:starter },

  { title:"Decode String", slug:"decode-string", difficulty:"MEDIUM", topic:"strings",
    statement:"Given an encoded string, decode it. The encoding rule is `k[encoded_string]`, where `encoded_string` inside the brackets is to be repeated `k` times.",
    constraints:"- `1 <= s.length <= 30`\n- `s` consists of lowercase English letters, digits, and square brackets.\n- `k` is guaranteed to be a positive integer and at most 300.",
    examples:[{input:"3[a]2[bc]",output:"aaabcbc"},{input:"3[a2[c]]",output:"accaccacc"}],
    hints:["Use a stack. When you see `[`, push current string and multiplier.","When you see `]`, pop and multiply."],
    tags:["String","Stack","Recursion"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"3[a]2[bc]",output:"aaabcbc"},{input:"3[a2[c]]",output:"accaccacc"}],
    hiddenTests:[{input:"2[abc]3[cd]ef",output:"abcabccdcdcdef"},{input:"abc3[cd]xyz",output:"abccdcdcdxyz"},{input:"100[a]",output:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},{input:"2[3[a]b]",output:"aaabaaab"},{input:"1[a]",output:"a"},{input:"10[a]",output:"aaaaaaaaaa"},{input:"2[ab]",output:"abab"},{input:"3[2[a]]",output:"aaaaaa"},{input:"ab2[c]",output:"abcc"},{input:"2[a2[b]]",output:"abbabb"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },

  { title:"Find All Anagram Positions", slug:"find-all-anagram-positions", difficulty:"MEDIUM", topic:"strings",
    statement:"Given a string `s` and a non-empty string `p`, find all **starting indices** of `p`'s anagrams in `s`. Print them space-separated in ascending order.",
    constraints:"- `1 <= s.length, p.length <= 3 * 10^4`\n- Both strings consist of lowercase English letters.",
    examples:[{input:"cbaebabacd\nabc",output:"0 6"},{input:"abab\nab",output:"0 1 2"}],
    hints:["Use a sliding window of size p.length.","Maintain frequency maps and compare."],
    tags:["Hash Table","String","Sliding Window"],companies:["Amazon","Google","Meta"],
    visibleTests:[{input:"cbaebabacd\nabc",output:"0 6"},{input:"abab\nab",output:"0 1 2"}],
    hiddenTests:[{input:"aa\nb",output:""},{input:"baa\naa",output:"1"},{input:"abaacbaab\naab",output:"1 5 6"},{input:"abcabc\nabc",output:"0 1 2 3"},{input:"aaab\nab",output:"2"},{input:"abc\nabc",output:"0"},{input:"abcd\ndc",output:"2"},{input:"aaaaa\naa",output:"0 1 2 3"},{input:"abcdef\nfed",output:"3"},{input:"aaaaaaaaa\naaaa",output:"0 1 2 3 4 5"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },
];

const graphs2 = [
  { title:"Course Schedule I", slug:"course-schedule-i", difficulty:"MEDIUM", topic:"graphs",
    statement:"There are `numCourses` courses labeled `0` to `numCourses-1`. Some courses have prerequisites. Return `true` if you can finish all courses, `false` if there's a cycle.",
    constraints:"- `1 <= numCourses <= 2000`\n- `0 <= prerequisites.length <= 5000`",
    examples:[{input:"2 1\n1 0",output:"true"},{input:"2 2\n1 0\n0 1",output:"false"}],
    hints:["Build an adjacency list.","Topological sort via BFS (Kahn's algorithm) or DFS cycle detection."],
    tags:["DFS","BFS","Graph","Topological Sort"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"2 1\n1 0",output:"true"},{input:"2 2\n1 0\n0 1",output:"false"}],
    hiddenTests:[{input:"1 0",output:"true"},{input:"3 0",output:"true"},{input:"3 2\n1 0\n2 1",output:"true"},{input:"3 3\n1 0\n2 1\n0 2",output:"false"},{input:"4 4\n1 0\n2 1\n3 2\n1 3",output:"false"},{input:"5 4\n1 0\n2 0\n3 1\n3 2",output:"true"},{input:"4 3\n1 0\n2 1\n3 2",output:"true"},{input:"4 4\n0 1\n1 2\n2 3\n3 0",output:"false"},{input:"6 3\n1 0\n2 0\n3 0",output:"true"},{input:"3 2\n0 1\n0 2",output:"true"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },

  { title:"Clone Graph", slug:"clone-graph", difficulty:"MEDIUM", topic:"graphs",
    statement:"Given a connected undirected graph's adjacency list (0-indexed), make a deep copy and print the adjacency list of the clone in the same order.",
    constraints:"- `0 <= n <= 100`\n- `1 <= node.val <= 100`\n- No repeated edges or self-loops.",
    examples:[{input:"4\n2 4\n1 3\n2 4\n1 3",output:"2 4\n1 3\n2 4\n1 3"},{input:"1\n\n",output:"\n"}],
    hints:["BFS or DFS with a hash map from original node to clone node."],
    tags:["Hash Table","DFS","BFS","Graph"],companies:["Amazon","Google","Meta","Microsoft"],
    visibleTests:[{input:"4\n2 4\n1 3\n2 4\n1 3",output:"2 4\n1 3\n2 4\n1 3"},{input:"1\n",output:""}],
    hiddenTests:[{input:"2\n2\n1",output:"2\n1"},{input:"3\n2 3\n1 3\n1 2",output:"2 3\n1 3\n1 2"},{input:"4\n2\n1 3\n2 4\n3",output:"2\n1 3\n2 4\n3"},{input:"5\n2 5\n1 3\n2 4\n3 5\n1 4",output:"2 5\n1 3\n2 4\n3 5\n1 4"},{input:"3\n2\n1 3\n2",output:"2\n1 3\n2"},{input:"4\n2 3 4\n1\n1\n1",output:"2 3 4\n1\n1\n1"},{input:"5\n2\n1 3\n2 4\n3 5\n4",output:"2\n1 3\n2 4\n3 5\n4"},{input:"2\n2\n1",output:"2\n1"},{input:"4\n2 4\n1 3\n2 4\n1 3",output:"2 4\n1 3\n2 4\n1 3"},{input:"6\n2 6\n1 3\n2 4\n3 5\n4 6\n1 5",output:"2 6\n1 3\n2 4\n3 5\n4 6\n1 5"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },

  { title:"Word Ladder Length", slug:"word-ladder-length", difficulty:"MEDIUM", topic:"graphs",
    statement:"Given a `beginWord`, an `endWord`, and a word list, find the **length of the shortest transformation sequence** from `beginWord` to `endWord`, changing one letter at a time (each intermediate word must be in the list). Return 0 if no sequence exists.",
    constraints:"- `1 <= beginWord.length <= 10`\n- `endWord.length == beginWord.length`\n- `1 <= wordList.length <= 5000`\n- All words are lowercase English letters.",
    examples:[{input:"hit\ncog\n6\nhot dot dog lot log cog",output:"5"},{input:"hit\ncog\n5\nhot dot dog lot log",output:"0"}],
    hints:["BFS: each level = one transformation.","For each word, try changing each character to a-z and check if it's in the word set."],
    tags:["Hash Table","String","BFS"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"hit\ncog\n6\nhot dot dog lot log cog",output:"5"},{input:"hit\ncog\n5\nhot dot dog lot log",output:"0"}],
    hiddenTests:[{input:"a\nb\n2\na b",output:"2"},{input:"hot\ndot\n3\nhot dot dog",output:"2"},{input:"abc\nabc\n1\nabc",output:"1"},{input:"abc\nxyz\n3\nxbc ybc xyz",output:"4"},{input:"abc\ncba\n3\nabc acb cba",output:"3"},{input:"hit\ncog\n4\nhot dot dog cog",output:"5"},{input:"hot\ncog\n6\nhot dot dog lot log cog",output:"5"},{input:"abc\ndef\n2\nabc def",output:"0"},{input:"abc\nabd\n1\nabd",output:"2"},{input:"red\ntax\n4\nted tex tax tad",output:"4"}],
    timeLimit:3000,memoryLimit:256,xp:20,estimatedTime:30,license:"ORIGINAL",starterCode:starter },
];

const trees2 = [
  { title:"Right Side View of Tree", slug:"right-side-view-tree", difficulty:"MEDIUM", topic:"trees",
    statement:"Given a binary tree in level-order format, print the values visible when looking from the **right side** (rightmost node at each level), top to bottom.",
    constraints:"- `0 <= nodes <= 100`\n- `-100 <= node.val <= 100`",
    examples:[{input:"5\n1 2 3 -1 5 -1 4",output:"1 3 4"},{input:"3\n1 2 3",output:"1 3"}],
    hints:["BFS level by level; take the last element of each level."],
    tags:["Tree","BFS","DFS"],companies:["Amazon","Google","Meta","Microsoft"],
    visibleTests:[{input:"5\n1 2 3 -1 5 -1 4",output:"1 3 4"},{input:"3\n1 2 3",output:"1 3"}],
    hiddenTests:[{input:"1\n1",output:"1"},{input:"0",output:""},{input:"3\n1 -1 3",output:"1 3"},{input:"3\n1 2 -1",output:"1 2"},{input:"7\n1 2 3 4 5 6 7",output:"1 3 7"},{input:"5\n1 2 3 4 5",output:"1 3 5"},{input:"4\n1 2 -1 3 -1",output:"1 2 3"},{input:"5\n3 9 20 -1 -1 15 7",output:"3 20 7"},{input:"7\n1 2 3 -1 4 -1 5",output:"1 3 5"},{input:"4\n1 -1 2 -1 -1 -1 3",output:"1 2 3"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:15,license:"ORIGINAL",starterCode:starter },

  { title:"Validate Binary Search Tree", slug:"validate-binary-search-tree", difficulty:"MEDIUM", topic:"trees",
    statement:"Given a binary tree in level-order format, determine if it is a valid **Binary Search Tree (BST)**. A BST requires left subtree values < node < right subtree values.",
    constraints:"- `1 <= nodes <= 10^4`\n- `-2^31 <= node.val <= 2^31 - 1`",
    examples:[{input:"3\n2 1 3",output:"true"},{input:"3\n5 1 4 -1 -1 3 6",output:"false"}],
    hints:["Recursive check: pass valid (min, max) range to each node.","Left child must satisfy val < parent; right child val > parent."],
    tags:["Tree","DFS","BFS"],companies:["Amazon","Google","Microsoft","Adobe"],
    visibleTests:[{input:"3\n2 1 3",output:"true"},{input:"5\n5 1 4 -1 -1 3 6",output:"false"}],
    hiddenTests:[{input:"1\n1",output:"true"},{input:"3\n1 2 3",output:"false"},{input:"7\n4 2 6 1 3 5 7",output:"true"},{input:"5\n4 2 7 1 3",output:"true"},{input:"5\n5 4 6 -1 -1 3 7",output:"false"},{input:"3\n3 1 5",output:"true"},{input:"7\n5 3 7 2 4 6 8",output:"true"},{input:"3\n5 5 5",output:"false"},{input:"5\n3 1 5 0 2",output:"true"},{input:"7\n2 2 2 2 2 2 2",output:"false"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },

  { title:"Lowest Common Ancestor of BST", slug:"lca-of-bst", difficulty:"EASY", topic:"trees",
    statement:"Given a BST (in level-order format) and two values `p` and `q`, find their **Lowest Common Ancestor (LCA)** — the deepest node that is an ancestor of both.\n\nPrint the LCA value.",
    constraints:"- `2 <= nodes <= 10^5`\n- All node values are unique.\n- `p != q`",
    examples:[{input:"7\n6 2 8 0 4 7 9\n2\n8",output:"6"},{input:"7\n6 2 8 0 4 7 9\n2\n4",output:"2"}],
    hints:["If both p and q are less than current, go left.","If both greater, go right.","Otherwise current is LCA."],
    tags:["Tree","DFS","BST"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"7\n6 2 8 0 4 7 9\n2\n8",output:"6"},{input:"7\n6 2 8 0 4 7 9\n2\n4",output:"2"}],
    hiddenTests:[{input:"3\n2 1 3\n1\n3",output:"2"},{input:"5\n3 1 5 -1 2\n1\n2",output:"1"},{input:"3\n5 3 7\n3\n5",output:"5"},{input:"7\n4 2 6 1 3 5 7\n1\n7",output:"4"},{input:"7\n4 2 6 1 3 5 7\n1\n3",output:"2"},{input:"7\n4 2 6 1 3 5 7\n3\n5",output:"4"},{input:"5\n20 10 30 5 15\n5\n15",output:"10"},{input:"3\n10 5 15\n5\n10",output:"10"},{input:"5\n6 2 8 1 4\n1\n4",output:"2"},{input:"7\n8 3 10 1 6 9 14\n3\n14",output:"8"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:15,license:"ORIGINAL",starterCode:starter },
];

const math2 = [
  { title:"Palindrome Number", slug:"palindrome-number", difficulty:"EASY", topic:"math",
    statement:"Given an integer `x`, return `true` if `x` is a **palindrome** (reads the same forwards and backwards), `false` otherwise. Negative numbers are not palindromes.",
    constraints:"- `-2^31 <= x <= 2^31 - 1`",
    examples:[{input:"121",output:"true"},{input:"-121",output:"false"}],
    hints:["Reverse the second half of x and compare.","Negative numbers are never palindromes; numbers ending in 0 (except 0) are not."],
    tags:["Math"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"121",output:"true"},{input:"-121",output:"false"}],
    hiddenTests:[{input:"0",output:"true"},{input:"10",output:"false"},{input:"11",output:"true"},{input:"1221",output:"true"},{input:"1231",output:"false"},{input:"9",output:"true"},{input:"99999",output:"true"},{input:"100",output:"false"},{input:"1001",output:"true"},{input:"-1001",output:"false"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:8,license:"ORIGINAL",starterCode:starter },

  { title:"Sum of Digits Until Single", slug:"sum-digits-single", difficulty:"EASY", topic:"math",
    statement:"Given a non-negative integer `num`, repeatedly sum its digits until the result is a single digit and return it. (This is the digital root.)",
    constraints:"- `0 <= num <= 2^31 - 1`",
    examples:[{input:"38",output:"2",explanation:"3+8=11, 1+1=2"},{input:"0",output:"0"}],
    hints:["Digital root formula: if n==0 return 0; else return 1+(n-1)%9.","Or just simulate the process."],
    tags:["Math","Simulation"],companies:["Amazon","Adobe"],
    visibleTests:[{input:"38",output:"2"},{input:"0",output:"0"}],
    hiddenTests:[{input:"1",output:"1"},{input:"9",output:"9"},{input:"10",output:"1"},{input:"11",output:"2"},{input:"99",output:"9"},{input:"100",output:"1"},{input:"999",output:"9"},{input:"123456789",output:"9"},{input:"987654321",output:"9"},{input:"2147483647",output:"1"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:8,license:"ORIGINAL",starterCode:starter },

  { title:"Number of Steps to Zero", slug:"number-of-steps-to-zero", difficulty:"EASY", topic:"math",
    statement:"Given a non-negative integer `num`, return the number of steps to reduce it to zero. In each step: if even, divide by 2; if odd, subtract 1.",
    constraints:"- `0 <= num <= 10^6`",
    examples:[{input:"14",output:"6"},{input:"8",output:"4"}],
    hints:["Simulate: count steps until num reaches 0."],
    tags:["Math","Bit Manipulation","Simulation"],companies:["Amazon","Adobe"],
    visibleTests:[{input:"14",output:"6"},{input:"8",output:"4"}],
    hiddenTests:[{input:"0",output:"0"},{input:"1",output:"1"},{input:"2",output:"2"},{input:"3",output:"3"},{input:"123",output:"12"},{input:"100",output:"8"},{input:"1000000",output:"38"},{input:"7",output:"4"},{input:"15",output:"7"},{input:"256",output:"8"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:8,license:"ORIGINAL",starterCode:starter },
];

const greedy2 = [
  { title:"Minimum Number of Arrows to Burst Balloons", slug:"min-arrows-burst-balloons", difficulty:"MEDIUM", topic:"greedy",
    statement:"Balloons are represented as intervals. An arrow shot vertically at position `x` bursts any balloon with `x_start <= x <= x_end`. Return the **minimum number of arrows** needed to burst all balloons.",
    constraints:"- `1 <= points.length <= 10^4`\n- `-2^31 <= x_start <= x_end <= 2^31 - 1`",
    examples:[{input:"4\n10 16\n2 8\n1 6\n7 12",output:"2"},{input:"3\n1 2\n3 4\n5 6",output:"3"}],
    hints:["Sort by end point.","Fire arrow at first balloon's end; skip all balloons hit by this arrow."],
    tags:["Array","Greedy","Sorting"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"4\n10 16\n2 8\n1 6\n7 12",output:"2"},{input:"3\n1 2\n3 4\n5 6",output:"3"}],
    hiddenTests:[{input:"1\n1 2",output:"1"},{input:"2\n1 2\n2 3",output:"1"},{input:"2\n1 2\n3 4",output:"2"},{input:"4\n1 10\n2 8\n3 6\n4 5",output:"1"},{input:"3\n-2147483648 2147483647\n-2147483648 0\n0 2147483647",output:"1"},{input:"4\n3 9\n7 12\n3 8\n6 8",output:"2"},{input:"4\n1 4\n2 3\n3 5\n4 6",output:"2"},{input:"3\n0 5\n5 10\n10 15",output:"1"},{input:"5\n1 2\n3 4\n5 6\n7 8\n9 10",output:"5"},{input:"4\n1 10\n1 10\n1 10\n1 10",output:"1"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },

  { title:"Best Time to Buy and Sell Stock II", slug:"best-time-buy-sell-stock-ii", difficulty:"MEDIUM", topic:"greedy",
    statement:"Given an integer array `prices` where `prices[i]` is the stock price on day `i`, find the **maximum profit** you can achieve. You may complete as many transactions as you like (buy then sell; you must sell before buying again).",
    constraints:"- `1 <= prices.length <= 3 * 10^4`\n- `0 <= prices[i] <= 10^4`",
    examples:[{input:"6\n7 1 5 3 6 4",output:"7"},{input:"5\n1 2 3 4 5",output:"4"}],
    hints:["Add every upward slope: profit += max(0, prices[i]-prices[i-1]) for each i."],
    tags:["Array","Greedy","Dynamic Programming"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"6\n7 1 5 3 6 4",output:"7"},{input:"5\n1 2 3 4 5",output:"4"}],
    hiddenTests:[{input:"5\n7 6 4 3 1",output:"0"},{input:"1\n5",output:"0"},{input:"2\n1 2",output:"1"},{input:"2\n2 1",output:"0"},{input:"4\n1 4 2 7",output:"8"},{input:"5\n3 3 5 0 0",output:"2"},{input:"6\n2 1 4 5 2 9",output:"11"},{input:"5\n1 2 1 2 1",output:"2"},{input:"4\n3 1 4 1",output:"3"},{input:"6\n1 2 3 1 2 3",output:"4"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:15,license:"ORIGINAL",starterCode:starter },
];

const slidingWindow2 = [
  { title:"Permutation in String", slug:"permutation-in-string", difficulty:"MEDIUM", topic:"sliding-window",
    statement:"Given two strings `s1` and `s2`, return `true` if `s2` contains a **permutation** of `s1`, or `false` otherwise. In other words, return `true` if one of `s1`'s permutations is a substring of `s2`.",
    constraints:"- `1 <= s1.length, s2.length <= 10^4`\n- Both strings consist of lowercase English letters.",
    examples:[{input:"ab\neidbaooo",output:"true"},{input:"ab\neidboaoo",output:"false"}],
    hints:["Use a fixed-size sliding window of size s1.length.","Compare character frequencies of window and s1."],
    tags:["Hash Table","Two Pointers","String","Sliding Window"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"ab\neidbaooo",output:"true"},{input:"ab\neidboaoo",output:"false"}],
    hiddenTests:[{input:"a\nb",output:"false"},{input:"a\na",output:"true"},{input:"abc\ncbaebabacd",output:"true"},{input:"ab\nba",output:"true"},{input:"adc\ndcda",output:"true"},{input:"abc\ndbc",output:"true"},{input:"abc\nxyz",output:"false"},{input:"abcd\ndcba",output:"true"},{input:"ab\nabc",output:"true"},{input:"xyz\nyzx",output:"true"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },

  { title:"Max Average Subarray I", slug:"max-average-subarray-i", difficulty:"EASY", topic:"sliding-window",
    statement:"Given an integer array `nums` and an integer `k`, find the contiguous subarray of length `k` with the maximum average. Print the average with exactly 5 decimal places.",
    constraints:"- `n == nums.length`\n- `1 <= k <= n <= 10^5`\n- `-10^4 <= nums[i] <= 10^4`",
    examples:[{input:"5 4\n1 12 -5 -6 50 3",output:"12.75000"},{input:"4 2\n5 5 5 5",output:"5.00000"}],
    hints:["Compute sum of first window, then slide.","Print sum/k with 5 decimal places."],
    tags:["Array","Sliding Window"],companies:["Amazon","Google"],
    visibleTests:[{input:"6 4\n1 12 -5 -6 50 3",output:"12.75000"},{input:"4 2\n5 5 5 5",output:"5.00000"}],
    hiddenTests:[{input:"1 1\n5",output:"5.00000"},{input:"3 3\n1 2 3",output:"2.00000"},{input:"5 2\n1 2 3 4 5",output:"4.50000"},{input:"4 1\n-10 -5 0 5",output:"5.00000"},{input:"5 3\n5 5 5 5 5",output:"5.00000"},{input:"5 2\n0 0 0 0 0",output:"0.00000"},{input:"5 3\n-1 -2 -3 -4 -5",output:"-2.00000"},{input:"6 3\n1 2 3 4 5 6",output:"5.00000"},{input:"4 2\n10 20 30 40",output:"35.00000"},{input:"5 4\n-4 -3 -2 -1 0",output:"-1.50000"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:10,license:"ORIGINAL",starterCode:starter },
];

const bitManipulation2 = [
  { title:"Sum of Two Integers Without Arithmetic", slug:"sum-two-integers-no-arithmetic", difficulty:"MEDIUM", topic:"bit-manipulation",
    statement:"Given two integers `a` and `b`, return their **sum** without using the `+` or `-` operators.",
    constraints:"- `-1000 <= a, b <= 1000`",
    examples:[{input:"1 2",output:"3"},{input:"2 3",output:"5"}],
    hints:["XOR gives sum without carry; AND shifted left gives carry.","Repeat until no carry."],
    tags:["Bit Manipulation","Math"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"1 2",output:"3"},{input:"2 3",output:"5"}],
    hiddenTests:[{input:"0 0",output:"0"},{input:"5 0",output:"5"},{input:"-1 1",output:"0"},{input:"-5 5",output:"0"},{input:"-1 -1",output:"-2"},{input:"10 5",output:"15"},{input:"-3 2",output:"-1"},{input:"100 200",output:"300"},{input:"-100 50",output:"-50"},{input:"999 1",output:"1000"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:15,license:"ORIGINAL",starterCode:starter },
];

const backtracking2 = [
  { title:"Generate Parentheses", slug:"generate-parentheses", difficulty:"MEDIUM", topic:"backtracking",
    statement:"Given `n` pairs of parentheses, generate all combinations of well-formed parentheses. Print each on a separate line in lexicographic order.",
    constraints:"- `1 <= n <= 8`",
    examples:[{input:"3",output:"((()))\n(()())\n(())()\n()(())\n()()()"},{input:"1",output:"()"}],
    hints:["Backtrack: add `(` if open < n; add `)` if close < open."],
    tags:["String","Backtracking","Dynamic Programming"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"3",output:"((()))\n(()())\n(())()\n()(())\n()()()"},{input:"1",output:"()"}],
    hiddenTests:[{input:"2",output:"(())\n()()"},{input:"4",output:"(((())))\n((()()))\n((())())\n((()))()\n(()(()))\n(()()())\n(()())()\n(())(())\n(())()()\n()((()))\n()(()())\n()(())()\n()()(())\n()()()()"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },

  { title:"Letter Combinations Phone Number", slug:"letter-combinations-phone", difficulty:"MEDIUM", topic:"backtracking",
    statement:"Given a string containing digits 2-9 inclusive, return all possible letter combinations using a phone keypad mapping. Print combinations in lexicographic order, one per line.",
    constraints:"- `0 <= digits.length <= 4`\n- `digits[i]` is a digit in `['2', '9']`.",
    examples:[{input:"23",output:"ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf"},{input:"2",output:"a\nb\nc"}],
    hints:["Map each digit to its letters (2->abc, 3->def, etc.).","Backtrack: at each step, pick a letter for the current digit."],
    tags:["Hash Table","String","Backtracking"],companies:["Amazon","Google","Microsoft","Meta"],
    visibleTests:[{input:"23",output:"ad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf"},{input:"2",output:"a\nb\nc"}],
    hiddenTests:[{input:"",output:""},{input:"9",output:"w\nx\ny\nz"},{input:"22",output:"aa\nab\nac\nba\nbb\nbc\nca\ncb\ncc"},{input:"29",output:"aw\nax\nay\naz\nbw\nbx\nby\nbz\ncw\ncx\ncy\ncz"},{input:"7",output:"p\nq\nr\ns"},{input:"8",output:"t\nu\nv"},{input:"3",output:"d\ne\nf"},{input:"4",output:"g\nh\ni"},{input:"5",output:"j\nk\nl"},{input:"6",output:"m\nn\no"}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:20,license:"ORIGINAL",starterCode:starter },
];

const prefixSum2 = [
  { title:"Find Pivot Index", slug:"find-pivot-index", difficulty:"EASY", topic:"prefix-sum",
    statement:"Given an array of integers `nums`, return the **leftmost pivot index** — the index where the sum of numbers strictly to the left equals the sum to the right. If no pivot exists, return `-1`.",
    constraints:"- `1 <= nums.length <= 10^4`\n- `-1000 <= nums[i] <= 1000`",
    examples:[{input:"6\n1 7 3 6 5 6",output:"3"},{input:"3\n1 2 3",output:"-1"}],
    hints:["Precompute total sum.","Iterate: leftSum += nums[i], check if leftSum == totalSum - leftSum - nums[i]."],
    tags:["Array","Prefix Sum"],companies:["Amazon","Google"],
    visibleTests:[{input:"6\n1 7 3 6 5 6",output:"3"},{input:"3\n1 2 3",output:"-1"}],
    hiddenTests:[{input:"1\n0",output:"0"},{input:"3\n2 1 -1",output:"0"},{input:"3\n-1 -1 -1",output:"-1"},{input:"5\n0 0 0 0 0",output:"0"},{input:"5\n1 0 0 0 -1",output:"2"},{input:"4\n1 2 3 0",output:"-1"},{input:"5\n1 1 1 1 1",output:"-1"},{input:"5\n1 2 0 3 0",output:"2"},{input:"5\n-1 -1 0 1 1",output:"2"},{input:"4\n0 1 -1 2",output:"1"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:10,license:"ORIGINAL",starterCode:starter },

  { title:"Running Sum of 1D Array", slug:"running-sum-1d-array", difficulty:"EASY", topic:"prefix-sum",
    statement:"Given an array `nums`, return a **running sum** of `nums`, where `runningSum[i] = sum(nums[0..i])`. Print as space-separated values.",
    constraints:"- `1 <= nums.length <= 1000`\n- `-10^6 <= nums[i] <= 10^6`",
    examples:[{input:"4\n1 2 3 4",output:"1 3 6 10"},{input:"5\n1 1 1 1 1",output:"1 2 3 4 5"}],
    hints:["Accumulate the sum as you iterate."],
    tags:["Array","Prefix Sum"],companies:["Amazon","Adobe"],
    visibleTests:[{input:"4\n1 2 3 4",output:"1 3 6 10"},{input:"5\n1 1 1 1 1",output:"1 2 3 4 5"}],
    hiddenTests:[{input:"1\n5",output:"5"},{input:"3\n3 2 1",output:"3 5 6"},{input:"4\n-1 -2 -3 -4",output:"-1 -3 -6 -10"},{input:"5\n0 0 0 0 0",output:"0 0 0 0 0"},{input:"3\n1 -1 1",output:"1 0 1"},{input:"4\n100 200 300 400",output:"100 300 600 1000"},{input:"5\n5 4 3 2 1",output:"5 9 12 14 15"},{input:"4\n-5 10 -5 10",output:"-5 5 0 10"},{input:"3\n1000000 -1000000 1000000",output:"1000000 0 1000000"},{input:"5\n2 2 2 2 2",output:"2 4 6 8 10"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:8,license:"ORIGINAL",starterCode:starter },
];

const intervals2 = [
  { title:"Summary Ranges", slug:"summary-ranges", difficulty:"EASY", topic:"intervals",
    statement:"Given a sorted unique integer array `nums`, return the smallest sorted list of ranges that cover all numbers exactly. Each range `[a,b]` is printed as `a->b`. Single elements are printed as just the number.",
    constraints:"- `0 <= nums.length <= 20`\n- `-2^31 <= nums[i] <= 2^31 - 1`\n- All values are unique and sorted.",
    examples:[{input:"5\n0 1 2 4 5 7",output:"0->2\n4->5\n7"},{input:"4\n0 2 3 4 6 8 9",output:"0\n2->4\n6\n8->9"}],
    hints:["Track the start of each range.","When consecutive sequence breaks, output the range."],
    tags:["Array"],companies:["Amazon","Google"],
    visibleTests:[{input:"6\n0 1 2 4 5 7",output:"0->2\n4->5\n7"},{input:"7\n0 2 3 4 6 8 9",output:"0\n2->4\n6\n8->9"}],
    hiddenTests:[{input:"0",output:""},{input:"1\n0",output:"0"},{input:"2\n1 3",output:"1\n3"},{input:"3\n1 2 3",output:"1->3"},{input:"4\n0 1 2 3",output:"0->3"},{input:"4\n1 3 5 7",output:"1\n3\n5\n7"},{input:"5\n-1 0 1 2 3",output:"-1->3"},{input:"5\n0 1 3 4 6",output:"0->1\n3->4\n6"},{input:"3\n5 6 7",output:"5->7"},{input:"5\n0 2 4 6 8",output:"0\n2\n4\n6\n8"}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:12,license:"ORIGINAL",starterCode:starter },

  { title:"Minimum Interval to Include Each Query", slug:"min-interval-include-query", difficulty:"MEDIUM", topic:"intervals",
    statement:"Given a 2D integer array `intervals` and a 1D integer array `queries`, for each query `q`, find the **size of the smallest interval** (size = end-start+1) that contains `q`. If no interval contains `q`, the answer is `-1`.\n\nPrint answers for each query in original order.",
    constraints:"- `1 <= intervals.length <= 10^5`\n- `1 <= queries.length <= 10^5`\n- `1 <= start <= end <= 10^7`\n- `1 <= query <= 10^7`",
    examples:[{input:"3\n1 4\n2 4\n3 6\n3\n2 3 4",output:"3 3 3"},{input:"2\n2 3\n2 5\n3\n1 2 3",output:"-1 2 2"}],
    hints:["Sort intervals by start, queries by value.","Use a min-heap of (size, end) sorted by size.","Process queries sorted; add all starting intervals, remove expired ones."],
    tags:["Array","Binary Search","Sorting","Heap"],companies:["Amazon","Google"],
    visibleTests:[{input:"3\n1 4\n2 4\n3 6\n3\n2 3 4",output:"3 3 3"},{input:"2\n2 3\n2 5\n3\n1 2 3",output:"-1 2 2"}],
    hiddenTests:[{input:"1\n1 1\n1\n1",output:"1"},{input:"1\n1 10\n3\n1 5 10",output:"10 10 10"},{input:"2\n1 3\n5 7\n4\n1 2 6 8",output:"3 3 3 -1"},{input:"3\n1 2\n3 4\n5 6\n3\n1 3 5",output:"2 2 2"},{input:"2\n1 5\n2 3\n2\n2 4",output:"2 5"},{input:"3\n1 4\n3 6\n2 8\n3\n3 5 6",output:"4 4 7"},{input:"2\n1 3\n2 4\n3\n1 2 3",output:"3 2 2"},{input:"1\n5 10\n2\n4 11",output:"-1 -1"},{input:"3\n1 4\n2 5\n3 6\n3\n2 3 4",output:"3 3 3"},{input:"2\n1 2\n3 4\n3\n1 3 5",output:"2 2 -1"}],
    timeLimit:3000,memoryLimit:256,xp:20,estimatedTime:35,license:"ORIGINAL",starterCode:starter },
];

const heap2 = [
  { title:"Reorganize String", slug:"reorganize-string", difficulty:"MEDIUM", topic:"heap",
    statement:"Given a string `s`, rearrange the characters so that no two adjacent characters are the same. Print the result. If impossible, print an empty line.",
    constraints:"- `1 <= s.length <= 500`\n- `s` consists of lowercase English letters.",
    examples:[{input:"aab",output:"aba"},{input:"aaab",output:""}],
    hints:["Greedily pick the most frequent character that isn't the same as the last placed.","Use a max-heap by frequency."],
    tags:["Hash Table","String","Greedy","Sorting","Heap"],companies:["Amazon","Google","Microsoft"],
    visibleTests:[{input:"aab",output:"aba"},{input:"aaab",output:""}],
    hiddenTests:[{input:"a",output:"a"},{input:"aa",output:""},{input:"ab",output:"ab"},{input:"aabb",output:"abab"},{input:"aaabbb",output:"ababab"},{input:"vvvlo",output:"vlovv"},{input:"aaabbc",output:"ababac"},{input:"abcabc",output:"abcabc"},{input:"aaabc",output:"abaca"},{input:"abc",output:"abc"}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:25,license:"ORIGINAL",starterCode:starter },
];

// ─── WRITE ALL BATCH 2 FILES ──────────────────────────────────────────────
const files2 = {
  'hashing.json':           hashing2,
  'sorting.json':           sorting2,
  'arrays.json':            arrays2,
  'dynamic-programming.json': dp2,
  'strings.json':           strings2,
  'graphs.json':            graphs2,
  'trees.json':             trees2,
  'math.json':              math2,
  'greedy.json':            greedy2,
  'sliding-window.json':    slidingWindow2,
  'bit-manipulation.json':  bitManipulation2,
  'backtracking.json':      backtracking2,
  'prefix-sum.json':        prefixSum2,
  'intervals.json':         intervals2,
  'heap.json':              heap2,
};

let total2Added = 0;
let total2Final = 0;

for (const [filename, newProblems] of Object.entries(files2)) {
  const filepath = path.join(DIR, filename);
  let existing = [];
  if (fs.existsSync(filepath)) {
    try { existing = JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch(e) {}
  }
  const existingSlugs = new Set(existing.map(p => p.slug));
  const toAdd = newProblems.filter(p => !existingSlugs.has(p.slug));
  const merged = [...existing, ...toAdd];
  fs.writeFileSync(filepath, JSON.stringify(merged, null, 2));
  console.log(`✓ ${filename}: +${toAdd.length} = ${merged.length} total`);
  total2Added += toAdd.length;
  total2Final += merged.length;
}

console.log(`\n✅ Batch 2 added: ${total2Added} problems`);
console.log(`📚 Grand total: ${total2Final} problems`);
