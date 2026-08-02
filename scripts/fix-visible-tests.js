'use strict';
// Fix problems with <2 visible tests by promoting first 2 hidden tests to visible
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'datasets', 'problems');
let fixed = 0;

fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  const fp = path.join(DIR, f);
  let arr = JSON.parse(fs.readFileSync(fp, 'utf8'));
  let changed = false;

  arr = arr.map(p => {
    if (!p.visibleTests || p.visibleTests.length < 2) {
      // Use examples or promote from hiddenTests
      const needed = 2 - (p.visibleTests || []).length;
      const hidden = p.hiddenTests || [];

      if (hidden.length >= needed) {
        const promoted = hidden.slice(0, needed);
        const remaining = hidden.slice(needed);
        changed = true;
        fixed++;
        return {
          ...p,
          visibleTests: [...(p.visibleTests || []), ...promoted],
          hiddenTests: remaining,
        };
      } else if (p.examples && p.examples.length >= 1) {
        // Build visible tests from examples
        const fromExamples = p.examples.slice(0, 2).map(ex => ({
          input: ex.input || '',
          output: ex.output || '',
        }));
        changed = true;
        fixed++;
        return { ...p, visibleTests: fromExamples };
      }
    }
    return p;
  });

  if (changed) fs.writeFileSync(fp, JSON.stringify(arr, null, 2));
});

console.log(`Fixed ${fixed} problems with <2 visible tests`);
