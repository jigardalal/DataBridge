const ProcessedData = require('../models/ProcessedData');
const { convertToCSV, filterDocuments } = require('../utils/csvExport');
const ExportService = require('../services/ExportService');

/**
 * Export processed data as CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportData = async (req, res) => {
  try {
    const {
      entityType,
      fields = [],
      filter = {},
      options = {}
    } = req.body;

    // Validate entity type
    if (!entityType) {
      return res.status(400).json({ error: 'Entity type is required' });
    }

    // Build query
    const query = { entityType };
    if (Object.keys(filter).length > 0) {
      Object.assign(query, filter);
    }

    // Fetch data from MongoDB
    const documents = await ProcessedData.find(query).lean();

    if (!documents.length) {
      return res.status(404).json({ error: 'No data found for export' });
    }

    // Filter documents if needed
    const filteredDocs = filterDocuments(documents, filter);

    // Convert to CSV
    const csv = convertToCSV(filteredDocs, fields, options);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${entityType}_export_${Date.now()}.csv`);

    // Send CSV file
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

/**
 * Get available fields for export
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAvailableFields = async (req, res) => {
  try {
    const { entityType } = req.params;

    if (!entityType) {
      return res.status(400).json({ error: 'Entity type is required' });
    }

    // Get a sample document to determine available fields
    const sample = await ProcessedData.findOne({ entityType }).lean();

    if (!sample) {
      return res.status(404).json({ error: 'No data found for entity type' });
    }

    // Get all fields from the sample document
    const fields = Object.keys(sample);

    res.json({ fields });
  } catch (error) {
    console.error('Error getting available fields:', error);
    res.status(500).json({ error: 'Failed to get available fields' });
  }
};

class ExportController {
  /**
   * Export data to CSV
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async exportToCSV(req, res) {
    try {
      const { dataType } = req.params;
      const options = req.body;

      const csvBuffer = await ExportService.exportToCSV(dataType, options);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}_export_${Date.now()}.csv`);
      res.send(csvBuffer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get export options for a data type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getExportOptions(req, res) {
    try {
      const { dataType } = req.params;
      const options = ExportService.getExportOptions(dataType);
      res.json(options);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ExportController(); 