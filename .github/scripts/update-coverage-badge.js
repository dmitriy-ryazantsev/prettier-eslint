#!/usr/bin/env node

/**
 * Script to extract coverage percentage and update README badge
 * Reads from coverage/coverage-summary.json and updates the badge in README.md
 */

const fs = require('fs');
const path = require('path');

// Read coverage summary
const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const readmePath = path.join(process.cwd(), 'README.md');

try {
  // Read coverage data
  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const coveragePercent = coverageData.total.statements.pct;
  
  // Round to 2 decimal places
  const roundedCoverage = Math.round(coveragePercent * 100) / 100;
  
  // Determine badge color based on coverage
  let color = 'red';
  if (roundedCoverage >= 80) {
    color = 'brightgreen';
  } else if (roundedCoverage >= 60) {
    color = 'yellow';
  } else if (roundedCoverage >= 40) {
    color = 'orange';
  }
  
  // Read README
  let readme = fs.readFileSync(readmePath, 'utf8');
  
  // Update badge - match any existing coverage badge
  const badgeRegex = /!\[Code Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-[^)]+\)/;
  const newBadge = `![Code Coverage](https://img.shields.io/badge/coverage-${roundedCoverage}%25-${color})`;
  
  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, newBadge);
    fs.writeFileSync(readmePath, readme, 'utf8');
    console.log(`✓ Updated coverage badge to ${roundedCoverage}%`);
  } else {
    console.error('⚠ Could not find coverage badge in README.md');
    process.exit(1);
  }
  
  // Output for GitHub Actions
  console.log(`Coverage: ${roundedCoverage}%`);
  console.log(`Color: ${color}`);
  
} catch (error) {
  console.error('Error updating coverage badge:', error.message);
  process.exit(1);
}
