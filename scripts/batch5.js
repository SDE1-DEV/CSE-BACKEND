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

merge('dynamic-programming.json', [
  { title:'Subset Sum Exists',slug:'subset-sum-exists',difficulty:'MEDIUM',topic:'dynamic-programming',
    statement:'Given an array of non-negative integers and a target, determine if any subset sums to the target. Return `true` or `false`.',
    constraints:'- `1 <= nums.length <= 200`\n- `0 <= nums[i] <= 1000`\n- `0 <= target <= 10^4`',
    examples:[{input:'6\n3 34 4 12 5 2\n9',output:'true'},{input:'6\n3 34 4 12 5 2\n30',output:'false'}],
    hints:['dp[i][s] = can we achieve sum s using first i elements.'],
    tags:['Array','Dynamic Programming'],companies:['Amazon','Google','Microsoft'],
    visibleTests:[{input:'6\n3 34 4 12 5 2\n9',output:'true'},{input:'6\n3 34 4 12 5 2\n30',output:'false'}],
    hiddenTests:[{input:'1\n0\n0',output:'true'},{input:'1\n1\n1',output:'true'},{input:'1\n1\n2',output:'false'},{input:'3\n1 2 3\n6',output:'true'},{input:'3\n1 2 3\n7',output:'false'},{input:'4\n1 1 1 1\n4',output:'true'},{input:'4\n1 1 1 1\n5',output:'false'},{input:'5\n2 4 6 8 10\n11',output:'false'},{input:'5\n2 3 7 8 10\n11',output:'true'},{input:'5\n1 2 3 4 5\n10',output:'true'}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:'ORIGINAL',starterCode:S },
]);

merge('graphs.json', [
  { title:'Minimum Spanning Tree Kruskal',slug:'minimum-spanning-tree-kruskal',difficulty:'MEDIUM',topic:'graphs',
    statement:'Given a weighted undirected graph with `V` vertices and `E` edges, find the total weight of its Minimum Spanning Tree using Kruskal\'s algorithm.',
    constraints:'- `2 <= V <= 1000`\n- `1 <= E <= 5000`\n- `1 <= weight <= 10^4`',
    examples:[{input:'4 5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4',output:'19'},{input:'3 3\n0 1 1\n1 2 2\n0 2 3',output:'3'}],
    hints:['Sort edges by weight.','Union-Find: add edge if it connects two different components.'],
    tags:['Union Find','Graph'],companies:['Amazon','Google','Microsoft'],
    visibleTests:[{input:'4 5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4',output:'19'},{input:'3 3\n0 1 1\n1 2 2\n0 2 3',output:'3'}],
    hiddenTests:[{input:'2 1\n0 1 5',output:'5'},{input:'4 4\n0 1 1\n1 2 2\n2 3 3\n3 0 4',output:'6'},{input:'5 7\n0 1 2\n0 3 6\n1 2 3\n1 3 8\n1 4 5\n2 4 7\n3 4 9',output:'16'},{input:'3 2\n0 1 100\n1 2 1',output:'101'},{input:'4 6\n0 1 5\n0 2 4\n0 3 3\n1 2 2\n1 3 1\n2 3 6',output:'8'},{input:'4 4\n0 1 3\n0 3 5\n1 2 1\n2 3 4',output:'9'},{input:'3 3\n0 1 10\n1 2 5\n0 2 8',output:'15'},{input:'5 6\n0 1 1\n0 2 2\n1 2 3\n2 3 4\n3 4 5\n1 3 6',output:'13'},{input:'4 5\n0 1 1\n1 2 1\n2 3 1\n3 0 1\n0 2 2',output:'3'},{input:'6 9\n0 1 4\n0 2 3\n1 2 1\n1 3 2\n2 4 4\n3 4 2\n3 5 3\n4 5 6\n2 3 5',output:'14'}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:'ORIGINAL',starterCode:S },
]);

merge('binary-search.json', [
  { title:'Kth Smallest in Sorted Matrix',slug:'kth-smallest-sorted-matrix',difficulty:'MEDIUM',topic:'binary-search',
    statement:'Given an n×n matrix where each row and column is sorted in ascending order, find the `k`th smallest element.',
    constraints:'- `n == matrix.length == matrix[i].length`\n- `1 <= n <= 300`\n- `-10^9 <= matrix[i][j] <= 10^9`\n- `1 <= k <= n^2`',
    examples:[{input:'3 5\n1 5 9\n10 11 13\n12 13 15',output:'13'},{input:'2 2\n-5 -4\n-4 -3',output:'-4'}],
    hints:['Binary search on value range.','Count elements <= mid to decide which half to search.'],
    tags:['Array','Binary Search','Sorting','Heap','Matrix'],companies:['Amazon','Google','Microsoft'],
    visibleTests:[{input:'3 5\n1 5 9\n10 11 13\n12 13 15',output:'13'},{input:'2 2\n-5 -4\n-4 -3',output:'-4'}],
    hiddenTests:[{input:'1 1\n1',output:'1'},{input:'2 1\n1 2\n3 4',output:'1'},{input:'2 4\n1 2\n3 4',output:'4'},{input:'3 1\n1 2 3\n4 5 6\n7 8 9',output:'1'},{input:'3 9\n1 2 3\n4 5 6\n7 8 9',output:'9'},{input:'3 5\n1 2 3\n4 5 6\n7 8 9',output:'5'},{input:'2 3\n1 3\n2 4',output:'3'},{input:'3 8\n1 5 9\n10 11 13\n12 13 15',output:'15'},{input:'4 7\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16',output:'7'},{input:'3 3\n1 2 3\n4 5 6\n7 8 9',output:'3'}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:25,license:'ORIGINAL',starterCode:S },
  { title:'First Bad Version',slug:'first-bad-version',difficulty:'EASY',topic:'binary-search',
    statement:'You have versions `1` through `n`. Given that versions from `bad` onwards are broken, find the first bad version using binary search. The API `isBad(v)` returns true if version v is bad. Simulate with: bad version is given as second input.',
    constraints:'- `1 <= bad <= n <= 2^31 - 1`',
    examples:[{input:'5 4',output:'4'},{input:'1 1',output:'1'}],
    hints:['Binary search: if isBad(mid), search left half; else search right half.'],
    tags:['Binary Search','Interactive'],companies:['Amazon','Google','Meta'],
    visibleTests:[{input:'5 4',output:'4'},{input:'1 1',output:'1'}],
    hiddenTests:[{input:'5 1',output:'1'},{input:'5 5',output:'5'},{input:'10 7',output:'7'},{input:'100 50',output:'50'},{input:'1000 999',output:'999'},{input:'2147483647 2147483647',output:'2147483647'},{input:'3 2',output:'2'},{input:'7 3',output:'3'},{input:'20 11',output:'11'},{input:'100 1',output:'1'}],
    timeLimit:1000,memoryLimit:256,xp:10,estimatedTime:10,license:'ORIGINAL',starterCode:S },
]);

merge('two-pointers.json', [
  { title:'Container With Most Water Variant',slug:'container-most-water-variant',difficulty:'MEDIUM',topic:'two-pointers',
    statement:'Given `n` walls with heights, find the maximum area of water a container can hold. Container formed by two walls at positions i and j: area = (j-i) * min(h[i], h[j]).',
    constraints:'- `2 <= n <= 10^5`\n- `0 <= height[i] <= 10^4`',
    examples:[{input:'9\n1 8 6 2 5 4 8 3 7',output:'49'},{input:'2\n1 1',output:'1'}],
    hints:['Two pointers from both ends.','Always move the pointer with the smaller height.'],
    tags:['Array','Two Pointers','Greedy'],companies:['Google','Amazon','Meta'],
    visibleTests:[{input:'9\n1 8 6 2 5 4 8 3 7',output:'49'},{input:'2\n1 1',output:'1'}],
    hiddenTests:[{input:'2\n0 5',output:'0'},{input:'4\n4 3 2 1',output:'4'},{input:'4\n1 2 3 4',output:'4'},{input:'5\n3 1 2 4 5',output:'12'},{input:'6\n1 7 2 5 4 7',output:'28'},{input:'4\n10 10 10 10',output:'30'},{input:'5\n1 1 1 1 10',output:'4'},{input:'3\n100 1 100',output:'200'},{input:'5\n0 0 0 0 0',output:'0'},{input:'4\n5 3 2 4',output:'9'}],
    timeLimit:1000,memoryLimit:256,xp:20,estimatedTime:20,license:'ORIGINAL',starterCode:S },
]);

merge('heap.json', [
  { title:'Merge K Sorted Arrays',slug:'merge-k-sorted-arrays',difficulty:'MEDIUM',topic:'heap',
    statement:'Given `k` sorted arrays, merge them into a single sorted array. Print the result.',
    constraints:'- `1 <= k <= 100`\n- `1 <= each_array.length <= 100`\n- `-10^4 <= val <= 10^4`',
    examples:[{input:'3\n1 4 5\n1 3 4\n2 6',output:'1 1 2 3 4 4 5 6'},{input:'1\n1 2 3',output:'1 2 3'}],
    hints:['Use a min-heap initialized with first element of each array.','Pop min, push next element from same array.'],
    tags:['Array','Sorting','Heap'],companies:['Amazon','Google','Microsoft'],
    visibleTests:[{input:'3\n1 4 5\n1 3 4\n2 6',output:'1 1 2 3 4 4 5 6'},{input:'1\n1 2 3',output:'1 2 3'}],
    hiddenTests:[{input:'2\n1 3\n2 4',output:'1 2 3 4'},{input:'2\n1\n2',output:'1 2'},{input:'3\n1\n2\n3',output:'1 2 3'},{input:'2\n5 10 15\n1 6 11',output:'1 5 6 10 11 15'},{input:'3\n1 2 3\n4 5 6\n7 8 9',output:'1 2 3 4 5 6 7 8 9'},{input:'2\n-5 -3\n-4 -2',output:'-5 -4 -3 -2'},{input:'3\n0 0\n0 0\n0 0',output:'0 0 0 0 0 0'},{input:'4\n1\n2\n3\n4',output:'1 2 3 4'},{input:'2\n100 200\n150 250',output:'100 150 200 250'},{input:'3\n1 3 5\n2 4 6\n0 7 8',output:'0 1 2 3 4 5 6 7 8'}],
    timeLimit:2000,memoryLimit:256,xp:20,estimatedTime:20,license:'ORIGINAL',starterCode:S },
]);

// Grand total
let grand = 0;
fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  try { grand += JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).length; } catch(e) {}
});
console.log('\n📚 GRAND TOTAL:', grand, 'problems');
