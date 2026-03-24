#!/usr/bin/env node

/**
 * Prerequisites Checker
 * Checks if all required services and configurations are ready
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║     Prerequisites Checker - Development Setup         ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

let allGood = true;

// Check 1: .env file
console.log(`${colors.cyan}Checking .env file...${colors.reset}`);
if (fs.existsSync('.env')) {
  console.log(`${colors.green}✓${colors.reset} .env file exists\n`);
} else {
  console.log(`${colors.red}✗${colors.reset} .env file NOT found`);
  console.log(`${colors.yellow}  Solution: Copy .env.example to .env${colors.reset}`);
  console.log(`  ${colors.yellow}cp .env.example .env${colors.reset}\n`);
  allGood = false;
}

// Check 2: node_modules
console.log(`${colors.cyan}Checking dependencies...${colors.reset}`);
if (fs.existsSync('node_modules')) {
  console.log(`${colors.green}✓${colors.reset} Dependencies installed\n`);
} else {
  console.log(`${colors.red}✗${colors.reset} Dependencies NOT installed`);
  console.log(`${colors.yellow}  Solution: Run npm install${colors.reset}\n`);
  allGood = false;
}

// Check 3: MongoDB connection
console.log(`${colors.cyan}Checking MongoDB...${colors.reset}`);
exec('mongosh --eval "db.version()" --quiet', (error, stdout, stderr) => {
  if (error) {
    console.log(`${colors.yellow}⚠${colors.reset} MongoDB not accessible via mongosh`);
    console.log(`${colors.yellow}  This is OK for development - OTPs will be logged to console${colors.reset}`);
    console.log(`${colors.yellow}  To start MongoDB:${colors.reset}`);
    console.log(`  ${colors.yellow}  - Docker: docker run -d -p 27017:27017 --name mongodb mongo${colors.reset}`);
    console.log(`  ${colors.yellow}  - Local: mongod${colors.reset}`);
    console.log(`  ${colors.yellow}  - Or use MongoDB Atlas (cloud)${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓${colors.reset} MongoDB is running (version: ${stdout.trim()})\n`);
  }

  // Check 4: Port 3000
  console.log(`${colors.cyan}Checking port 3001...${colors.reset}`);
  exec('netstat -ano | findstr :3001', (error, stdout) => {
    if (stdout && stdout.trim()) {
      console.log(`${colors.yellow}⚠${colors.reset} Port 3001 is in use`);
      console.log(`${colors.yellow}  Solution: Change PORT in .env or kill the process${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✓${colors.reset} Port 3001 is available\n`);
    }

    // Summary
    console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    if (allGood) {
      console.log(`${colors.green}✓ All critical checks passed!${colors.reset}`);
      console.log(`\n${colors.cyan}Ready to start:${colors.reset}`);
      console.log(`  npm run dev\n`);
    } else {
      console.log(`${colors.red}✗ Some checks failed${colors.reset}`);
      console.log(`\n${colors.cyan}Fix the issues above and try again${colors.reset}\n`);
    }
    console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.cyan}Documentation:${colors.reset}`);
    console.log(`  - Setup Guide: docs/DEVELOPMENT_SETUP.md`);
    console.log(`  - Troubleshooting: docs/TROUBLESHOOTING.md`);
    console.log(`  - Testing Guide: docs/POSTMAN_STEP_BY_STEP_GUIDE.md\n`);
  });
});
