const XLSX = require('xlsx');
const FileData = require('../models/FileData');
const RawFile = require('../models/RawFile');

const isRowEmpty = (row) => {
  if (!row) return true;

  return row.every(value => {
    if (value === undefined || value === null) return true;
    const str = String(value).replace(/\s/g, '');
    return str === '';
  });
};

const parseFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Received file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Save raw file metadata
    const rawFile = new RawFile({
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size || 0,
      storageUrl: 'memory'
    });
    await rawFile.save();

    // Parse Excel or CSV
    let workbook;
    try {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      if (ext === 'csv') {
        workbook = XLSX.read(req.file.buffer.toString(), { type: 'string' });
      } else {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      return res.status(400).json({ error: 'Invalid file format' });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const totalRowsBeforeFiltering = jsonData.length;
    const filteredData = jsonData.filter(row => !isRowEmpty(row));
    const blankRowsRemoved = totalRowsBeforeFiltering - filteredData.length;

    if (filteredData.length === 0) {
      return res.status(400).json({ error: 'File is empty or invalid' });
    }

    const [headers, ...rows] = filteredData;

    const validRows = rows.filter(row => !isRowEmpty(row));

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const fileType = ['xlsx', 'xls', 'csv'].includes(ext) ? ext : 'xlsx';

    const fileData = new FileData({
      fileName: req.file.originalname,
      fileType,
      columnHeaders: headers,
      rowCount: validRows.length,
      totalRowsBeforeFiltering,
      blankRowsRemoved,
      data: validRows.map(row => {
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = row[idx];
        });
        return obj;
      })
    });

    await fileData.save();

    res.status(200).json({
      message: 'File uploaded and processed successfully',
      fileId: fileData._id,
      fileDataId: fileData._id,
      rawFileId: rawFile._id,
      headers,
      rowCount: validRows.length
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
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

const listFiles = async (req, res) => {
  try {
    const files = await FileData.find({}, '_id fileName createdAt updatedAt rowCount');
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Error listing files' });
  }
};

module.exports = {
  parseFile,
  getFileData,
  listFiles
};
