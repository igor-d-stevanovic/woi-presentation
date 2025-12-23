/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

console.log('Test file loading...'); 

// Load HTML
const htmlContent = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
const html = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
console.log('HTML loaded');

// Set innerHTML BEFORE requiring TodoApp
document.documentElement.innerHTML = html;
console.log('DOM set');

const TodoApp = require('./script.js');
console.log('TodoApp loaded');

test('simple test', () => {
  expect(true).toBe(true);
});
