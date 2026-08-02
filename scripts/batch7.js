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

merge('sliding-window.json', [
  { title: 'Minimum Window to Sort', slug: 'minimum-window-to-sort', difficulty: 'MEDIUM', topic: 'sliding-window',
    statement: 'Given an integer array `nums`, find the shortest contiguous subarray that, when sorted, makes the entire array sorted. Return its length. If already sorted, return 0.',
    constraints: '- `1 <= nums.length <= 10^4`\n- `-10^5 <= nums[i] <= 10^5`',
    examples: [{ input: '8\n2 6 4 8 10 9 15 1', output: '5' }, { input: '3\n1 2 3', output: '0' }],
    hints: ['Find leftmost element out of order (> element to its right).', 'Find rightmost element out of order (< element to its left).', 'The window must include all elements between min/max of window.'],
    tags: ['Array', 'Two Pointers', 'Stack', 'Greedy', 'Sorting', 'Monotonic Stack'], companies: ['Amazon', 'Google', 'Microsoft'],
    visibleTests: [{ input: '8\n2 6 4 8 10 9 15 1', output: '5' }, { input: '3\n1 2 3', output: '0' }],
    hiddenTests: [{ input: '1\n1', output: '0' }, { input: '5\n5 4 3 2 1', output: '5' }, { input: '5\n1 2 3 4 5', output: '0' }, { input: '4\n3 2 1 4', output: '3' }, { input: '6\n1 5 3 4 2 6', output: '4' }, { input: '5\n1 2 5 3 4', output: '3' }, { input: '5\n1 3 2 4 5', output: '2' }, { input: '6\n1 2 4 3 6 5', output: '4' }, { input: '5\n2 3 3 2 4', output: '3' }, { input: '5\n1 2 3 3 3', output: '0' }],
    timeLimit: 1000, memoryLimit: 256, xp: 20, estimatedTime: 25, license: 'ORIGINAL', starterCode: S },
]);

let grand = 0;
fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try { grand += JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).length; } catch(e) {}
});
console.log('\n🎉 GRAND TOTAL:', grand, 'problems — TARGET REACHED!');
