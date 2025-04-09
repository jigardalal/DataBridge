const XLSX = require('xlsx');
const FileData = require('../models/FileData');

const isRowEmpty = (row) => {
  // Check if row is undefined or null
  if (!row) return true;
  
  // Check if all values in the row are empty
  return row.every(value => 
    value === undefined || 
    value === null || 
    value === '' || 
    String(value).trim() === ''
  );
};

const parseFile = async (req, res) => {
  try {
    console.log('File upload request received');
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Get file extension
    const fileType = req.file.originalname.split('.').pop().toLowerCase();
    
    // Parse file based on type
    let workbook;
    try {
      if (fileType === 'csv') {
        workbook = XLSX.read(req.file.buffer.toString(), { type: 'string' });
      } else {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      }
      console.log('File parsed successfully');
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return res.status(400).json({ error: 'Error parsing file. Please ensure it is a valid Excel/CSV file.' });
    }

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`Converted to JSON. Total rows before filtering: ${jsonData.length}`);

    // Filter out empty rows
    const filteredData = jsonData.filter(row => !isRowEmpty(row));
    console.log(`Rows after filtering empty rows: ${filteredData.length}`);

    // Validate data
    if (filteredData.length === 0) {
      console.log('File is empty after filtering blank rows');
      return res.status(400).json({ error: 'File is empty or contains no valid data' });
    }

    // Extract headers and data
    const [headers, ...data] = filteredData;
    console.log('Headers:', headers);

    // Filter out any remaining rows that might be empty after header extraction
    const validData = data.filter(row => !isRowEmpty(row));
    console.log(`Valid data rows: ${validData.length}`);

    // Create file data record
    const fileData = new FileData({
      fileName: req.file.originalname,
      fileType,
      data: validData.map(row => {
        const rowData = {};
        headers.forEach((header, index) => {
          // Only add non-empty values
          if (row[index] !== undefined && row[index] !== null && String(row[index]).trim() !== '') {
            rowData[header] = row[index];
          }
        });
        return rowData;
      }),
      rowCount: validData.length,
      columnHeaders: headers
    });

    // Save to database
    await fileData.save();
    console.log('Data saved to database. FileId:', fileData._id);

    res.status(200).json({
      message: 'File uploaded and processed successfully',
      fileId: fileData._id,
      rowCount: fileData.rowCount,
      headers: fileData.columnHeaders,
      totalRowsBeforeFiltering: jsonData.length,
      blankRowsRemoved: jsonData.length - filteredData.length
    });

  } catch (error) {
    console.error('File parsing error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
};

const getFileData = async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileData = await FileData.findById(fileId);
    
    if (!fileData) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(fileData);
  } catch (error) {
    console.error('Error retrieving file data:', error);
    res.status(500).json({ error: 'Error retrieving file data' });
  }
};

module.exports = {
  parseFile,
  getFileData
}; 