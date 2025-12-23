#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const resultsDir = path.join(process.cwd(), 'allure-results');
const reportDir = path.join(process.cwd(), 'allure-report');
const historyDir = path.join(resultsDir, 'history');

function cleanAllure(keepHistory = false) {
  console.log('🧹 Cleaning Allure directories...');
  
  if (keepHistory && fs.existsSync(reportDir)) {
    // Preserve history before cleaning
    const reportHistoryDir = path.join(reportDir, 'history');
    const tempHistoryDir = path.join(process.cwd(), '.allure-history-temp');
    
    if (fs.existsSync(reportHistoryDir)) {
      console.log('📦 Backing up history...');
      if (fs.existsSync(tempHistoryDir)) {
        fs.rmSync(tempHistoryDir, { recursive: true, force: true });
      }
      fs.cpSync(reportHistoryDir, tempHistoryDir, { recursive: true });
    }
  }
  
  // Clean results directory
  if (fs.existsSync(resultsDir)) {
    console.log('🗑️  Removing allure-results/');
    fs.rmSync(resultsDir, { recursive: true, force: true });
  }
  
  // Clean report directory
  if (fs.existsSync(reportDir)) {
    console.log('🗑️  Removing allure-report/');
    fs.rmSync(reportDir, { recursive: true, force: true });
  }
  
  if (keepHistory) {
    // Restore history
    const tempHistoryDir = path.join(process.cwd(), '.allure-history-temp');
    if (fs.existsSync(tempHistoryDir)) {
      console.log('📥 Restoring history...');
      fs.mkdirSync(resultsDir, { recursive: true });
      fs.mkdirSync(historyDir, { recursive: true });
      fs.cpSync(tempHistoryDir, historyDir, { recursive: true });
      fs.rmSync(tempHistoryDir, { recursive: true, force: true });
      console.log('✅ History preserved');
    }
  }
  
  console.log('✨ Cleanup complete!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const keepHistory = args.includes('--keep-history') || args.includes('-k');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node clean-allure.js [options]

Options:
  --keep-history, -k    Preserve history data for trend tracking
  --help, -h            Show this help message

Examples:
  node clean-allure.js                Clean everything (fresh start)
  node clean-allure.js --keep-history Clean but preserve history for trends
`);
  process.exit(0);
}

cleanAllure(keepHistory);
