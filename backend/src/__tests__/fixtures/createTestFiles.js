const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create a valid XLSX file
const validWorkbook = XLSX.utils.book_new();
const validData = [
  ['Name', 'Age', 'City'],
  ['John Doe', 30, 'New York'],
  ['Jane Smith', 25, 'Los Angeles']
];
const validSheet = XLSX.utils.aoa_to_sheet(validData);
XLSX.utils.book_append_sheet(validWorkbook, validSheet, 'Sheet1');
XLSX.writeFile(validWorkbook, path.join(__dirname, 'valid-test.xlsx'));

// Create an empty XLSX file
const emptyWorkbook = XLSX.utils.book_new();
const emptySheet = XLSX.utils.aoa_to_sheet([]);
XLSX.utils.book_append_sheet(emptyWorkbook, emptySheet, 'Sheet1');
XLSX.writeFile(emptyWorkbook, path.join(__dirname, 'empty.xlsx'));

// Create an invalid text file
fs.writeFileSync(path.join(__dirname, 'invalid.txt'), 'This is not an XLSX file');

console.log('Test files created successfully!'); 