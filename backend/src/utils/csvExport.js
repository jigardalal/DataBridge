const { Transform } = require('stream');
const { Parser } = require('json2csv');

/**
 * Converts MongoDB documents to CSV format
 * @param {Object[]} documents - Array of MongoDB documents
 * @param {string[]} fields - Array of field names to include in CSV
 * @param {Object} options - Additional options for CSV generation
 * @returns {string} CSV formatted string
 */
function convertToCSV(documents, fields = [], options = {}) {
  if (!documents || !Array.isArray(documents)) {
    throw new Error('Invalid documents array provided');
  }

  // If no fields specified, use all fields from first document
  if (fields.length === 0 && documents.length > 0) {
    fields = Object.keys(documents[0]);
  }

  const parser = new Parser({
    fields,
    ...options
  });

  try {
    return parser.parse(documents);
  } catch (error) {
    throw new Error(`Failed to convert documents to CSV: ${error.message}`);
  }
}

/**
 * Creates a transform stream for converting MongoDB documents to CSV
 * @param {string[]} fields - Array of field names to include in CSV
 * @param {Object} options - Additional options for CSV generation
 * @returns {Transform} Transform stream
 */
function createCSVStream(fields = [], options = {}) {
  let isFirstChunk = true;
  let parser;

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        if (isFirstChunk) {
          // Initialize parser with fields from first document if not specified
          if (fields.length === 0) {
            fields = Object.keys(chunk);
          }
          parser = new Parser({ fields, ...options });
          isFirstChunk = false;
        }

        const csv = parser.parse([chunk]);
        callback(null, csv);
      } catch (error) {
        callback(new Error(`Failed to convert document to CSV: ${error.message}`));
      }
    }
  });
}

/**
 * Filters documents based on criteria
 * @param {Object[]} documents - Array of MongoDB documents
 * @param {Object} filter - Filter criteria
 * @returns {Object[]} Filtered documents
 */
function filterDocuments(documents, filter = {}) {
  if (!documents || !Array.isArray(documents)) {
    throw new Error('Invalid documents array provided');
  }

  return documents.filter(doc => {
    return Object.entries(filter).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.includes(doc[key]);
      }
      return doc[key] === value;
    });
  });
}

module.exports = {
  convertToCSV,
  createCSVStream,
  filterDocuments
}; 