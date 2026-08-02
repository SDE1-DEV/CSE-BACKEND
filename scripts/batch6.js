'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'datasets', 'problems');
const S = { python: 'pass', javascript: '// code', java: '// code', cpp: '// code' };
function merge(file, probs) {
  const fp = path.join(DIR, file); let ex = [];
  if (fs.existsSync(fp)) try { ex = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) {}
  const slugs = new Set(ex.map(p => p.slug));
  const add = probs.filter(p => !slugs.has(p.slug));
  fs.writeFileSync(fp, JSON.stringify([...ex, ...add], null, 2));
  console.log(`${file}: +${add.length} = ${ex.length + add.length}`);
}

merge('prefix-sum.json', [
  { title: 'Maximum Average Subarray II', slug: 'max-average-subarray-ii', difficulty: 'MEDIUM', topic: 'prefix-sum',
    statement: 'Given an integer array `nums` and integer `k`, find the maximum average of a contiguous subarray of length **at least** `k`. Print with 5 decimal places.',
    constraints: '- `1 <= k <= n <= 10^4`\n- `-10^4 <= nums[i] <= 10^4`',
    examples: [{ input: '8 4\n1 12 -5 -6 50 3 -7 2', output: '12.75000' }],
    hints: ['Binary search on the answer (average value).', 'Check if a subarray of length >= k has avg >= mid using prefix sums.'],
    tags: ['Array', 'Binary Search', 'Prefix Sum'], companies: ['Amazon', 'Google'],
    visibleTests: [{ input: '8 4\n1 12 -5 -6 50 3 -7 2', output: '12.75000' }],
    hiddenTests: [{ input: '5 1\n1 2 3 4 5', output: '5.00000' }, { input: '5 5\n1 2 3 4 5', output: '3.00000' }, { input: '3 2\n3 1 2', output: '2.00000' }, { input: '4 2\n10 20 30 40', output: '35.00000' }, { input: '5 2\n-1 -2 -3 -4 -5', output: '-1.50000' }, { input: '6 3\n5 5 5 5 5 5', output: '5.00000' }, { input: '5 3\n1 2 3 4 5', output: '4.00000' }, { input: '5 4\n-3 -2 -1 0 1', output: '0.00000' }, { input: '4 1\n100 -100 100 -100', output: '100.00000' }, { input: '5 2\n1 1 1 1 10', output: '5.50000' }],
    timeLimit: 3000, memoryLimit: 256, xp: 20, estimatedTime: 30, license: 'ORIGINAL', starterCode: S },
]);

merge('sorting.json', [
  { title: 'Minimum Swaps to Sort', slug: 'minimum-swaps-to-sort', difficulty: 'MEDIUM', topic: 'sorting',
    statement: 'Given an array of `n` distinct integers, find the minimum number of swaps to sort the array in ascending order.',
    constraints: '- `1 <= n <= 10^5`\n- `1 <= nums[i] <= 10^9`\n- All elements are distinct.',
    examples: [{ input: '5\n4 3 2 1 5', output: '2' }, { input: '4\n3 4 2 1', output: '3' }],
    hints: ['Map each value to its target index.', 'Count cycles in the permutation. Swaps = n - number_of_cycles.'],
    tags: ['Array', 'Sorting', 'Graph', 'Union Find'], companies: ['Amazon', 'Google', 'Flipkart'],
    visibleTests: [{ input: '5\n4 3 2 1 5', output: '2' }, { input: '4\n3 4 2 1', output: '3' }],
    hiddenTests: [{ input: '1\n1', output: '0' }, { input: '3\n1 2 3', output: '0' }, { input: '3\n3 2 1', output: '1' }, { input: '4\n4 3 2 1', output: '2' }, { input: '5\n5 4 3 2 1', output: '2' }, { input: '6\n1 5 4 3 2 6', output: '2' }, { input: '5\n2 3 4 5 1', output: '4' }, { input: '4\n2 1 4 3', output: '2' }, { input: '6\n3 1 2 6 4 5', output: '3' }, { input: '5\n1 2 3 5 4', output: '1' }],
    timeLimit: 2000, memoryLimit: 256, xp: 20, estimatedTime: 25, license: 'ORIGINAL', starterCode: S },
]);

merge('backtracking.json', [
  { title: 'Palindrome Partitioning', slug: 'palindrome-partitioning', difficulty: 'MEDIUM', topic: 'backtracking',
    statement: 'Given a string `s`, partition it so that every substring is a palindrome. Return the minimum number of cuts needed.',
    constraints: '- `1 <= s.length <= 2000`\n- `s` consists of lowercase English letters.',
    examples: [{ input: 'aab', output: '1' }, { input: 'a', output: '0' }],
    hints: ['dp[i] = min cuts for s[0..i].', 'Check all palindrome substrings ending at i.'],
    tags: ['String', 'Dynamic Programming', 'Backtracking'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: 'aab', output: '1' }, { input: 'a', output: '0' }],
    hiddenTests: [{ input: 'ab', output: '1' }, { input: 'aa', output: '0' }, { input: 'abc', output: '2' }, { input: 'aabb', output: '1' }, { input: 'racecar', output: '0' }, { input: 'abcba', output: '0' }, { input: 'abba', output: '0' }, { input: 'abcbc', output: '2' }, { input: 'aaaa', output: '0' }, { input: 'abcde', output: '4' }],
    timeLimit: 3000, memoryLimit: 256, xp: 20, estimatedTime: 30, license: 'ORIGINAL', starterCode: S },
]);

merge('graphs.json', [
  { title: 'Dijkstra Single Source', slug: 'dijkstra-single-source', difficulty: 'MEDIUM', topic: 'graphs',
    statement: 'Given a weighted directed graph with `V` vertices (0-indexed) and `E` edges, find the shortest distance from source vertex `0` to all other vertices. Print distances; print -1 if unreachable.',
    constraints: '- `1 <= V <= 1000`\n- `0 <= E <= 5000`\n- `1 <= weight <= 10^4`',
    examples: [{ input: '4 5\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n2 3 5', output: '0 3 1 4' }, { input: '3 2\n0 1 5\n1 2 3', output: '0 5 8' }],
    hints: ['Use a min-heap (priority queue).', 'Relax edges from the closest unvisited vertex.'],
    tags: ['Graph', 'Shortest Path', 'Heap'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: '4 5\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n2 3 5', output: '0 3 1 4' }, { input: '3 2\n0 1 5\n1 2 3', output: '0 5 8' }],
    hiddenTests: [{ input: '2 1\n0 1 7', output: '0 7' }, { input: '3 0', output: '0 -1 -1' }, { input: '4 4\n0 1 1\n0 2 4\n1 2 2\n2 3 1', output: '0 1 3 4' }, { input: '5 6\n0 1 10\n0 3 5\n1 2 1\n2 3 2\n3 1 3\n3 4 2', output: '0 8 9 5 7' }, { input: '4 3\n0 1 2\n1 2 3\n0 3 10', output: '0 2 5 10' }, { input: '3 3\n0 1 100\n1 2 100\n0 2 1', output: '0 100 1' }, { input: '4 4\n0 1 5\n0 2 3\n1 3 4\n2 3 6', output: '0 5 3 9' }, { input: '5 4\n0 1 1\n1 2 1\n2 3 1\n3 4 1', output: '0 1 2 3 4' }, { input: '3 2\n0 1 1000\n0 2 1', output: '0 1000 1' }, { input: '4 5\n0 1 1\n0 2 4\n1 3 2\n2 3 1\n3 0 3', output: '0 1 4 3' }],
    timeLimit: 3000, memoryLimit: 256, xp: 20, estimatedTime: 30, license: 'ORIGINAL', starterCode: S },
]);

merge('intervals.json', [
  { title: 'Minimum Number of Arrows', slug: 'minimum-number-of-arrows', difficulty: 'MEDIUM', topic: 'intervals',
    statement: 'Balloons on a line are represented as intervals `[start, end]`. An arrow shot at position `x` pops all balloons where `start <= x <= end`. Find the minimum number of arrows to pop all balloons.',
    constraints: '- `1 <= points.length <= 10^4`\n- `-2^31 <= start <= end <= 2^31 - 1`',
    examples: [{ input: '4\n10 16\n2 8\n1 6\n7 12', output: '2' }, { input: '3\n1 2\n3 4\n5 6', output: '3' }],
    hints: ['Sort by end. Fire at first balloon\'s end, skip overlapping ones.'],
    tags: ['Array', 'Greedy', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: '4\n10 16\n2 8\n1 6\n7 12', output: '2' }, { input: '3\n1 2\n3 4\n5 6', output: '3' }],
    hiddenTests: [{ input: '1\n1 2', output: '1' }, { input: '2\n1 2\n2 3', output: '1' }, { input: '2\n1 2\n3 4', output: '2' }, { input: '4\n1 10\n2 8\n3 6\n4 5', output: '1' }, { input: '4\n3 9\n7 12\n3 8\n6 8', output: '2' }, { input: '4\n1 4\n2 3\n3 5\n4 6', output: '2' }, { input: '3\n0 5\n5 10\n10 15', output: '1' }, { input: '5\n1 2\n3 4\n5 6\n7 8\n9 10', output: '5' }, { input: '4\n1 10\n1 10\n1 10\n1 10', output: '1' }, { input: '3\n-10 -5\n-5 0\n0 5', output: '1' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 20, license: 'ORIGINAL', starterCode: S },
]);

let grand = 0;
fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try { grand += JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).length; } catch(e) {}
});
console.log('\n📚 GRAND TOTAL:', grand, 'problems');
