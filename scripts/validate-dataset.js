'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', 'datasets', 'problems');

const allSlugs = [];
const dupSlugs = [];
const missingRequired = [];
let missingVisibleTests = 0, missingHiddenTests = 0;
let total = 0, easy = 0, medium = 0, hard = 0;
let withCompany = 0, withTags = 0, withHints = 0, withStarter = 0;

fs.readdirSync(DIR).filter(f => f.endsWith('.json')).forEach(f => {
  const arr = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  arr.forEach((p, i) => {
    total++;
    if (allSlugs.includes(p.slug)) dupSlugs.push(p.slug + ' in ' + f);
    allSlugs.push(p.slug);
    if (!p.title || !p.slug || !p.difficulty || !p.topic || !p.statement) {
      missingRequired.push({ file: f, index: i, slug: p.slug });
    }
    if (!p.visibleTests || p.visibleTests.length < 2) missingVisibleTests++;
    if (!p.hiddenTests || p.hiddenTests.length < 8) missingHiddenTests++;
    if (p.difficulty === 'EASY') easy++;
    else if (p.difficulty === 'MEDIUM') medium++;
    else hard++;
    if (p.companies && p.companies.length > 0) withCompany++;
    if (p.tags && p.tags.length > 0) withTags++;
    if (p.hints && p.hints.length > 0) withHints++;
    if (p.starterCode && Object.keys(p.starterCode).length >= 4) withStarter++;
  });
});

console.log('========================================');
console.log('FPRD-19 Dataset Validation Report');
console.log('========================================');
console.log(`Total problems:      ${total}`);
console.log(`Easy:                ${easy}`);
console.log(`Medium:              ${medium}`);
console.log(`Hard:                ${hard}  (should be 0)`);
console.log(`Unique slugs:        ${allSlugs.length - dupSlugs.length}/${total}`);
console.log(`Duplicate slugs:     ${dupSlugs.length} ${dupSlugs.length > 0 ? '← PROBLEM' : '✅'}`);
console.log(`Missing required:    ${missingRequired.length} ${missingRequired.length > 0 ? '← PROBLEM' : '✅'}`);
console.log(`<2 visible tests:    ${missingVisibleTests} ${missingVisibleTests > 0 ? '← WARNING' : '✅'}`);
console.log(`<8 hidden tests:     ${missingHiddenTests} ${missingHiddenTests > 5 ? '← WARNING' : '✅'}`);
console.log(`With companies:      ${withCompany}/${total} (${Math.round(withCompany/total*100)}%)`);
console.log(`With tags:           ${withTags}/${total} (${Math.round(withTags/total*100)}%)`);
console.log(`With hints:          ${withHints}/${total} (${Math.round(withHints/total*100)}%)`);
console.log(`With starter code:   ${withStarter}/${total} (${Math.round(withStarter/total*100)}%)`);

if (dupSlugs.length > 0) {
  console.log('\nDuplicate slugs found:');
  dupSlugs.forEach(s => console.log(' -', s));
}
if (missingRequired.length > 0) {
  console.log('\nProblems missing required fields:');
  missingRequired.slice(0, 10).forEach(p => console.log(' -', p.file, 'index', p.index, 'slug:', p.slug));
}

const pass = dupSlugs.length === 0 && missingRequired.length === 0 && hard === 0 && total >= 300;
console.log('\n' + (pass ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'));
process.exit(pass ? 0 : 1);
