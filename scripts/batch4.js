'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'datasets', 'problems');
const S = { python: 'pass', javascript: '// code', java: '// code', cpp: '// code' };

function merge(file, probs) {
  const fp = path.join(DIR, file);
  let ex = [];
  if (fs.existsSync(fp)) try { ex = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) {}
  const slugs = new Set(ex.map(p => p.slug));
  const add = probs.filter(p => !slugs.has(p.slug));
  fs.writeFileSync(fp, JSON.stringify([...ex, ...add], null, 2));
  console.log(`${file}: +${add.length} = ${ex.length + add.length}`);
  return add.length;
}

merge('math.json', [
  { title: 'Count Zeros in Factorial', slug: 'count-zeros-factorial', difficulty: 'EASY', topic: 'math',
    statement: 'Given `n`, count the number of trailing zeros in `n!`.',
    constraints: '- `0 <= n <= 10^4`', examples: [{ input: '5', output: '1' }, { input: '10', output: '2' }],
    hints: ['Count factors of 5: floor(n/5) + floor(n/25) + ...'],
    tags: ['Math'], companies: ['Amazon', 'Microsoft'],
    visibleTests: [{ input: '5', output: '1' }, { input: '10', output: '2' }],
    hiddenTests: [{ input: '0', output: '0' }, { input: '1', output: '0' }, { input: '25', output: '6' }, { input: '100', output: '24' }, { input: '1000', output: '249' }, { input: '50', output: '12' }, { input: '125', output: '31' }, { input: '200', output: '49' }, { input: '4', output: '0' }, { input: '20', output: '4' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 10, license: 'ORIGINAL', starterCode: S },
  { title: 'Check Perfect Number', slug: 'check-perfect-number', difficulty: 'EASY', topic: 'math',
    statement: 'A perfect number equals the sum of its proper divisors. Return `true` or `false`.',
    constraints: '- `1 <= num <= 10^8`', examples: [{ input: '28', output: 'true' }, { input: '7', output: 'false' }],
    hints: ['Sum divisors 1..sqrt(n). Return sum==n and n!=1.'],
    tags: ['Math'], companies: ['Amazon'],
    visibleTests: [{ input: '28', output: 'true' }, { input: '7', output: 'false' }],
    hiddenTests: [{ input: '1', output: 'false' }, { input: '6', output: 'true' }, { input: '12', output: 'false' }, { input: '496', output: 'true' }, { input: '8128', output: 'true' }, { input: '2', output: 'false' }, { input: '4', output: 'false' }, { input: '100', output: 'false' }, { input: '33550336', output: 'true' }, { input: '10', output: 'false' }],
    timeLimit: 2000, memoryLimit: 256, xp: 10, estimatedTime: 10, license: 'ORIGINAL', starterCode: S },
  { title: 'Power of Three Check', slug: 'power-of-three-check', difficulty: 'EASY', topic: 'math',
    statement: 'Given integer `n`, return `true` if it is a power of three.',
    constraints: '- `-2^31 <= n <= 2^31 - 1`', examples: [{ input: '27', output: 'true' }, { input: '0', output: 'false' }],
    hints: ['Divide by 3 repeatedly; check if reaches 1.'],
    tags: ['Math', 'Recursion'], companies: ['Amazon', 'Adobe'],
    visibleTests: [{ input: '27', output: 'true' }, { input: '0', output: 'false' }],
    hiddenTests: [{ input: '1', output: 'true' }, { input: '3', output: 'true' }, { input: '9', output: 'true' }, { input: '81', output: 'true' }, { input: '-3', output: 'false' }, { input: '2', output: 'false' }, { input: '243', output: 'true' }, { input: '729', output: 'true' }, { input: '1000000000', output: 'false' }, { input: '1162261467', output: 'true' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 8, license: 'ORIGINAL', starterCode: S },
]);

merge('hashing.json', [
  { title: 'Longest Palindrome From Chars', slug: 'longest-palindrome-from-chars', difficulty: 'EASY', topic: 'hashing',
    statement: 'Given a string `s`, find the longest palindrome that can be built by rearranging its characters. Return its length.',
    constraints: '- `1 <= s.length <= 2000`\n- `s` consists of lowercase/uppercase English letters.',
    examples: [{ input: 'abccccdd', output: '7' }, { input: 'a', output: '1' }],
    hints: ['Count frequencies. Sum floor(freq/2)*2 for all chars. Add 1 if any odd freq exists.'],
    tags: ['Hash Table', 'String', 'Greedy'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: 'abccccdd', output: '7' }, { input: 'a', output: '1' }],
    hiddenTests: [{ input: 'bb', output: '2' }, { input: 'abc', output: '1' }, { input: 'aabbcc', output: '6' }, { input: 'aabbccd', output: '7' }, { input: 'aaabbbccc', output: '9' }, { input: 'Aa', output: '1' }, { input: 'cdd', output: '3' }, { input: 'aaaa', output: '4' }, { input: 'abcba', output: '5' }, { input: 'aab', output: '3' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 10, license: 'ORIGINAL', starterCode: S },
  { title: 'Trie Insert and Search', slug: 'trie-insert-search', difficulty: 'MEDIUM', topic: 'hashing',
    statement: 'Given `n` words to insert and `q` queries, for each query print `true` if the word exists in the trie, `false` otherwise.',
    constraints: '- `1 <= n, q <= 1000`\n- `1 <= word.length <= 100`\n- Words are lowercase.',
    examples: [{ input: '3\napp apple ban\n3\napple app banana', output: 'true\ntrue\nfalse' }],
    hints: ['Use a hash set for simplicity, or implement a full Trie.'],
    tags: ['Hash Table', 'String', 'Trie', 'Design'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: '3\napp apple ban\n3\napple app banana', output: 'true\ntrue\nfalse' }],
    hiddenTests: [{ input: '1\nhello\n1\nhello', output: 'true' }, { input: '2\nfoo bar\n2\nbaz foo', output: 'false\ntrue' }, { input: '3\na ab abc\n3\na ab abc', output: 'true\ntrue\ntrue' }, { input: '2\ntest testing\n2\ntest tested', output: 'true\nfalse' }, { input: '1\nword\n2\nwor word', output: 'false\ntrue' }, { input: '3\ncat cats catch\n3\ncat cats catfish', output: 'true\ntrue\nfalse' }, { input: '2\npi pie\n2\npie pi', output: 'true\ntrue' }, { input: '1\nabc\n3\nabc ab a', output: 'true\nfalse\nfalse' }, { input: '4\none two three four\n4\none two three five', output: 'true\ntrue\ntrue\nfalse' }, { input: '2\nhello world\n3\nhello world helloo', output: 'true\ntrue\nfalse' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 20, license: 'ORIGINAL', starterCode: S },
  { title: 'Intersection of Two Arrays II', slug: 'intersection-two-arrays-ii', difficulty: 'EASY', topic: 'hashing',
    statement: 'Given two integer arrays, return their intersection including duplicates (each element as many times as it appears in both). Print sorted.',
    constraints: '- `1 <= nums1.length, nums2.length <= 1000`\n- `0 <= nums1[i], nums2[i] <= 1000`',
    examples: [{ input: '4\n1 2 2 1\n4\n2 2', output: '2 2' }, { input: '5\n4 9 5 2 1\n3\n9 4 9', output: '4 9' }],
    hints: ['Use a frequency map for nums1. For each element in nums2, if exists in map, add to result and decrement.'],
    tags: ['Array', 'Hash Table', 'Two Pointers', 'Binary Search', 'Sorting'], companies: ['Amazon', 'Adobe'],
    visibleTests: [{ input: '4\n1 2 2 1\n4\n2 2', output: '2 2' }, { input: '5\n4 9 5 2 1\n3\n9 4 9', output: '4 9' }],
    hiddenTests: [{ input: '3\n1 2 3\n3\n4 5 6', output: '' }, { input: '3\n1 1 1\n3\n1 1 1', output: '1 1 1' }, { input: '4\n1 2 3 4\n4\n4 3 2 1', output: '1 2 3 4' }, { input: '2\n0 0\n2\n0 0', output: '0 0' }, { input: '5\n1 2 3 4 5\n5\n5 4 3 2 1', output: '1 2 3 4 5' }, { input: '3\n1 2 2\n3\n2 2 3', output: '2 2' }, { input: '1\n5\n1\n5', output: '5' }, { input: '3\n10 20 30\n3\n20 30 40', output: '20 30' }, { input: '5\n1 1 2 2 3\n5\n2 2 3 3 4', output: '2 2 3' }, { input: '4\n2 2 2 2\n4\n2 2 2 2', output: '2 2 2 2' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 10, license: 'ORIGINAL', starterCode: S },
]);

merge('arrays.json', [
  { title: 'Find All Disappeared Numbers', slug: 'find-all-disappeared-numbers', difficulty: 'EASY', topic: 'arrays',
    statement: 'Given an array of `n` integers in range `[1, n]`, find all numbers in `[1, n]` that do not appear. Print them sorted.',
    constraints: '- `n == nums.length`\n- `1 <= n <= 10^5`\n- `1 <= nums[i] <= n`',
    examples: [{ input: '8\n4 3 2 7 8 2 3 1', output: '5 6' }, { input: '4\n1 1 2 2', output: '3 4' }],
    hints: ['Negate nums[abs(nums[i])-1] for each element.', 'Positive indices after pass are missing.'],
    tags: ['Array', 'Hash Table'], companies: ['Amazon', 'Adobe'],
    visibleTests: [{ input: '8\n4 3 2 7 8 2 3 1', output: '5 6' }, { input: '4\n1 1 2 2', output: '3 4' }],
    hiddenTests: [{ input: '5\n1 2 3 4 5', output: '' }, { input: '5\n1 1 1 1 1', output: '2 3 4 5' }, { input: '6\n3 3 3 3 3 3', output: '1 2 4 5 6' }, { input: '3\n2 3 1', output: '' }, { input: '5\n5 4 3 2 1', output: '' }, { input: '5\n1 2 3 4 4', output: '5' }, { input: '4\n4 4 4 4', output: '1 2 3' }, { input: '6\n1 2 3 1 2 3', output: '4 5 6' }, { input: '4\n1 1 1 1', output: '2 3 4' }, { input: '5\n2 2 2 2 2', output: '1 3 4 5' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 12, license: 'ORIGINAL', starterCode: S },
  { title: 'Minimum Size Subarray with Product Less Than K', slug: 'min-subarray-product-less-k', difficulty: 'MEDIUM', topic: 'arrays',
    statement: 'Given an array of positive integers and integer `k`, find the length of the shortest contiguous subarray whose product is less than `k`. If no such subarray, return 0.',
    constraints: '- `1 <= nums.length <= 3 * 10^4`\n- `1 <= nums[i] <= 1000`\n- `0 <= k <= 10^6`',
    examples: [{ input: '4\n10 5 2 6\n100', output: '2' }, { input: '3\n1 2 3\n0', output: '0' }],
    hints: ['Sliding window: expand right, when product >= k shrink left.', 'Track minimum window length.'],
    tags: ['Array', 'Sliding Window', 'Binary Search'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '4\n10 5 2 6\n100', output: '2' }, { input: '3\n1 2 3\n0', output: '0' }],
    hiddenTests: [{ input: '3\n1 2 3\n100', output: '1' }, { input: '5\n1 1 1 1 1\n2', output: '1' }, { input: '4\n3 1 2 4\n10', output: '2' }, { input: '3\n10 10 10\n10', output: '0' }, { input: '2\n5 2\n10', output: '2' }, { input: '5\n2 2 2 2 2\n8', output: '1' }, { input: '4\n1 1 1 1\n2', output: '1' }, { input: '3\n100 100 100\n1000000', output: '1' }, { input: '5\n1 2 3 4 5\n5', output: '1' }, { input: '4\n6 7 8 9\n100', output: '2' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 20, license: 'ORIGINAL', starterCode: S },
]);

merge('trees.json', [
  { title: 'Symmetric Tree Check', slug: 'symmetric-tree-check', difficulty: 'EASY', topic: 'trees',
    statement: 'Given a binary tree in level-order format, determine if it is symmetric around its center. Return `true` or `false`.',
    constraints: '- `1 <= nodes <= 1000`\n- `-100 <= val <= 100`',
    examples: [{ input: '7\n1 2 2 3 4 4 3', output: 'true' }, { input: '5\n1 2 2 -1 3', output: 'false' }],
    hints: ['Compare left subtree with mirrored right subtree recursively.'],
    tags: ['Tree', 'DFS', 'BFS', 'Binary Tree'], companies: ['Amazon', 'Microsoft', 'Google'],
    visibleTests: [{ input: '7\n1 2 2 3 4 4 3', output: 'true' }, { input: '5\n1 2 2 -1 3', output: 'false' }],
    hiddenTests: [{ input: '1\n1', output: 'true' }, { input: '3\n1 2 2', output: 'true' }, { input: '3\n1 2 3', output: 'false' }, { input: '7\n1 2 2 -1 3 3 -1', output: 'true' }, { input: '7\n1 2 2 3 -1 -1 3', output: 'true' }, { input: '3\n1 -1 2', output: 'false' }, { input: '7\n0 0 0 0 0 0 0', output: 'true' }, { input: '5\n2 1 1 2 2', output: 'false' }, { input: '7\n1 2 2 3 4 4 3', output: 'true' }, { input: '5\n5 3 3 -1 -1', output: 'false' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 15, license: 'ORIGINAL', starterCode: S },
  { title: 'Cousin Nodes in Binary Tree', slug: 'cousin-nodes-binary-tree', difficulty: 'EASY', topic: 'trees',
    statement: 'Two nodes are cousins if they are at the same depth but have different parents. Given a binary tree (level-order) and two values `x` and `y`, return `true` if they are cousins.',
    constraints: '- `2 <= nodes <= 100`\n- `1 <= val, x, y <= 100`\n- `x != y`\n- All values unique.',
    examples: [{ input: '3\n1 2 3\n2\n3', output: 'false' }, { input: '7\n1 2 3 4 5 6 7\n4\n7', output: 'false' }],
    hints: ['BFS to find depth and parent of each node.', 'Same depth and different parent = cousins.'],
    tags: ['Tree', 'DFS', 'BFS', 'Binary Tree'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '3\n1 2 3\n2\n3', output: 'false' }, { input: '7\n1 2 3 4 5 6 7\n4\n7', output: 'false' }],
    hiddenTests: [{ input: '7\n1 2 3 4 5 6 7\n4\n6', output: 'true' }, { input: '5\n1 2 3 -1 4\n2\n3', output: 'false' }, { input: '7\n1 2 3 -1 -1 4 5\n4\n5', output: 'false' }, { input: '7\n1 2 3 4 -1 -1 5\n4\n5', output: 'true' }, { input: '9\n1 2 3 4 5 6 7 8 -1\n5\n6', output: 'true' }, { input: '5\n1 2 3 4 -1\n4\n3', output: 'false' }, { input: '7\n1 2 3 4 5 -1 -1\n4\n5', output: 'false' }, { input: '9\n1 2 3 4 5 6 7 -1 8\n4\n7', output: 'true' }, { input: '5\n1 2 3 -1 5\n5\n3', output: 'false' }, { input: '7\n1 2 3 4 5 6 7\n5\n6', output: 'true' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 15, license: 'ORIGINAL', starterCode: S },
]);

merge('stack.json', [
  { title: 'Min Deletions for Valid Brackets', slug: 'min-deletions-valid-brackets', difficulty: 'MEDIUM', topic: 'stack',
    statement: 'Given a string of `(` and `)`, return the minimum number of parentheses to remove to make it valid.',
    constraints: '- `1 <= s.length <= 10^5`\n- `s[i]` is `(` or `)`.',
    examples: [{ input: '())((' , output: '3' }, { input: '()()', output: '0' }],
    hints: ['Count unmatched open and close brackets separately.', 'Traverse: if ) and no open pending, increment close; else decrement open.'],
    tags: ['String', 'Stack', 'Greedy'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '())((' , output: '3' }, { input: '()()', output: '0' }],
    hiddenTests: [{ input: '(', output: '1' }, { input: ')', output: '1' }, { input: '()', output: '0' }, { input: ')(', output: '2' }, { input: '((((', output: '4' }, { input: '))))', output: '4' }, { input: '(())', output: '0' }, { input: '(()(((' , output: '4' }, { input: ')))((((' , output: '6' }, { input: '()(())(', output: '1' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 15, license: 'ORIGINAL', starterCode: S },
]);

merge('greedy.json', [
  { title: 'Minimum Operations to Increase Array', slug: 'min-ops-to-increase-array', difficulty: 'EASY', topic: 'greedy',
    statement: 'Given an integer array `nums`, return the minimum number of increments (each +1 to one element) to make it strictly increasing.',
    constraints: '- `1 <= nums.length <= 5000`\n- `1 <= nums[i] <= 10^9`',
    examples: [{ input: '4\n1 1 1 1', output: '6' }, { input: '3\n1 5 2', output: '3' }],
    hints: ['If nums[i] <= nums[i-1], add (nums[i-1]+1 - nums[i]) to ops and update nums[i].'],
    tags: ['Array', 'Greedy'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '4\n1 1 1 1', output: '6' }, { input: '3\n1 5 2', output: '3' }],
    hiddenTests: [{ input: '1\n5', output: '0' }, { input: '3\n1 2 3', output: '0' }, { input: '3\n3 2 1', output: '3' }, { input: '5\n1 2 2 2 2', output: '6' }, { input: '4\n5 3 2 1', output: '6' }, { input: '3\n1 1 2', output: '1' }, { input: '5\n10 1 1 1 1', output: '10' }, { input: '4\n0 0 0 0', output: '6' }, { input: '4\n2 3 3 2', output: '2' }, { input: '5\n5 5 5 5 5', output: '10' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 12, license: 'ORIGINAL', starterCode: S },
]);

merge('simulation.json', [
  { title: 'Count Students Unable to Eat Lunch', slug: 'count-students-unable-to-eat', difficulty: 'EASY', topic: 'simulation',
    statement: 'Students prefer 0 or 1 sandwiches. Sandwiches are in a stack. A student takes the top if they want it, else goes to back. Count students who cannot eat.',
    constraints: '- `1 <= students.length == sandwiches.length <= 100`\n- `students[i]` and `sandwiches[i]` are 0 or 1.',
    examples: [{ input: '4\n1 1 0 0\n0 1 0 1', output: '0' }, { input: '3\n1 1 1\n0 0 1', output: '3' }],
    hints: ['Count 0-students and 1-students. Process sandwiches; if no student wants current sandwich, stop.'],
    tags: ['Array', 'Stack', 'Queue', 'Simulation'], companies: ['Amazon', 'Adobe'],
    visibleTests: [{ input: '4\n1 1 0 0\n0 1 0 1', output: '0' }, { input: '3\n1 1 1\n0 0 1', output: '3' }],
    hiddenTests: [{ input: '4\n0 0 0 1\n0 0 1 0', output: '1' }, { input: '4\n1 0 1 0\n1 0 1 0', output: '0' }, { input: '1\n0\n0', output: '0' }, { input: '1\n1\n0', output: '1' }, { input: '5\n0 0 0 0 0\n1 1 1 1 1', output: '5' }, { input: '5\n1 1 1 1 1\n0 0 0 0 0', output: '5' }, { input: '4\n0 1 0 1\n0 0 1 1', output: '0' }, { input: '3\n0 1 1\n1 0 1', output: '2' }, { input: '6\n1 0 1 0 1 0\n0 1 0 1 0 1', output: '0' }, { input: '4\n1 1 0 0\n0 0 0 1', output: '1' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 12, license: 'ORIGINAL', starterCode: S },
  { title: 'Design Parking System', slug: 'design-parking-system', difficulty: 'EASY', topic: 'simulation',
    statement: 'Design a parking system with `big`, `medium`, and `small` spaces. Process `q` queries: each is a car type (1=big, 2=medium, 3=small). Print `true` if parked, `false` if no space.',
    constraints: '- `0 <= big, medium, small <= 1000`\n- `1 <= q <= 1000`\n- `carType` is 1, 2, or 3.',
    examples: [{ input: '1 1 0\n3\n1\n2\n3', output: 'true\ntrue\nfalse' }],
    hints: ['Decrement the corresponding counter. If counter was 0, return false.'],
    tags: ['Design', 'Simulation', 'Counting'], companies: ['Amazon', 'Adobe'],
    visibleTests: [{ input: '1 1 0\n3\n1\n2\n3', output: 'true\ntrue\nfalse' }],
    hiddenTests: [{ input: '0 0 0\n1\n1', output: 'false' }, { input: '2 1 1\n4\n1\n1\n2\n3', output: 'true\ntrue\ntrue\ntrue' }, { input: '2 0 0\n3\n1\n1\n1', output: 'true\ntrue\nfalse' }, { input: '1 1 1\n3\n1\n2\n3', output: 'true\ntrue\ntrue' }, { input: '0 1 0\n2\n1\n2', output: 'false\ntrue' }, { input: '5 0 0\n5\n1\n1\n1\n1\n1', output: 'true\ntrue\ntrue\ntrue\ntrue' }, { input: '1 1 1\n4\n1\n2\n3\n1', output: 'true\ntrue\ntrue\nfalse' }, { input: '0 0 5\n3\n3\n3\n3', output: 'true\ntrue\ntrue' }, { input: '1 0 0\n2\n2\n1', output: 'false\ntrue' }, { input: '3 3 3\n6\n1\n2\n3\n1\n2\n3', output: 'true\ntrue\ntrue\ntrue\ntrue\ntrue' }],
    timeLimit: 1000, memoryLimit: 256, xp: 10, estimatedTime: 10, license: 'ORIGINAL', starterCode: S },
]);

merge('strings.json', [
  { title: 'String to Integer', slug: 'string-to-integer-atoi', difficulty: 'MEDIUM', topic: 'strings',
    statement: 'Implement `atoi`: skip leading whitespace, read optional sign, read digits, clamp to 32-bit signed integer range `[-2^31, 2^31-1]`.',
    constraints: '- `0 <= s.length <= 200`\n- `s` consists of printable ASCII characters.',
    examples: [{ input: '42', output: '42' }, { input: '-91283472332', output: '-2147483648' }],
    hints: ['Strip whitespace. Read sign. Accumulate digits. Stop at non-digit. Clamp result.'],
    tags: ['String'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: '42', output: '42' }, { input: '-91283472332', output: '-2147483648' }],
    hiddenTests: [{ input: '  -42', output: '-42' }, { input: '4193 with words', output: '4193' }, { input: 'words and 987', output: '0' }, { input: '', output: '0' }, { input: '+1', output: '1' }, { input: '2147483646', output: '2147483646' }, { input: '2147483648', output: '2147483647' }, { input: '-2147483648', output: '-2147483648' }, { input: '-2147483649', output: '-2147483648' }, { input: '  +  413', output: '0' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 15, license: 'ORIGINAL', starterCode: S },
  { title: 'Bulls and Cows', slug: 'bulls-and-cows', difficulty: 'MEDIUM', topic: 'strings',
    statement: 'Given a secret number and a guess (same-length digit strings), return `xAyB` where x=bulls (correct digit, correct position) and y=cows (correct digit, wrong position).',
    constraints: '- `1 <= secret.length == guess.length <= 1000`\n- Both strings consist of digits.',
    examples: [{ input: '1807\n7810', output: '1A3B' }, { input: '1123\n0111', output: '1A1B' }],
    hints: ['First pass: count exact matches (bulls). Second pass: use freq maps for non-bull positions.'],
    tags: ['Hash Table', 'String', 'Counting'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '1807\n7810', output: '1A3B' }, { input: '1123\n0111', output: '1A1B' }],
    hiddenTests: [{ input: '1\n1', output: '1A0B' }, { input: '1\n2', output: '0A0B' }, { input: '1122\n2211', output: '0A4B' }, { input: '1122\n1122', output: '4A0B' }, { input: '1234\n4321', output: '0A4B' }, { input: '0000\n1111', output: '0A0B' }, { input: '1111\n0100', output: '1A0B' }, { input: '1234\n1234', output: '4A0B' }, { input: '1234\n0000', output: '0A0B' }, { input: '1111\n1111', output: '4A0B' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 20, license: 'ORIGINAL', starterCode: S },
]);

merge('linked-list.json', [
  { title: 'Maximum Twin Sum in Linked List', slug: 'max-twin-sum-linked-list', difficulty: 'MEDIUM', topic: 'linked-list',
    statement: 'In a linked list of even length `n`, the twin of node `i` is node `n-1-i`. Given as array, find the maximum twin sum (nums[i] + nums[n-1-i]).',
    constraints: '- `2 <= n <= 10^5`\n- `n` is even\n- `1 <= node.val <= 10^5`',
    examples: [{ input: '4\n5 4 2 1', output: '6' }, { input: '4\n4 2 2 3', output: '7' }],
    hints: ['Find middle, reverse second half, compute twin sums with two pointers.'],
    tags: ['Linked List', 'Two Pointers', 'Stack'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '4\n5 4 2 1', output: '6' }, { input: '4\n4 2 2 3', output: '7' }],
    hiddenTests: [{ input: '2\n1 1', output: '2' }, { input: '6\n1 2 3 4 5 6', output: '7' }, { input: '4\n5 5 5 5', output: '10' }, { input: '6\n5 4 3 2 1 6', output: '11' }, { input: '4\n100 1 1 100', output: '200' }, { input: '8\n1 2 3 4 5 6 7 8', output: '9' }, { input: '4\n1 1000 1000 1', output: '1001' }, { input: '6\n3 1 4 1 5 9', output: '12' }, { input: '4\n0 1 2 3', output: '3' }, { input: '6\n10 20 30 30 20 10', output: '40' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 15, license: 'ORIGINAL', starterCode: S },
]);

// Final tally
let grand = 0;
fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    grand += d.length;
    console.log(`  ${f}: ${d.length} problems`);
  } catch(e) { console.warn(`  SKIP ${f}: ${e.message.slice(0,50)}`); }
});
console.log('\n📚 GRAND TOTAL:', grand, 'problems');
