const { Parser } = require('json2csv');
const ProcessedData = require('../models/ProcessedData');

class ExportService {
  /**
   * Export processed data to CSV
   * @param {string} dataType - Type of data to export (e.g., 'customers', 'drivers')
   * @param {Object} options - Export options
   * @returns {Promise<Buffer>} CSV file buffer
   */
  async exportToCSV(dataType, options = {}) {
    try {
      // Get processed data from MongoDB
      const data = await ProcessedData.find({
        dataType,
        ...options.filters
      }).lean();

      if (!data.length) {
        throw new Error(`No ${dataType} data found for export`);
      }

      // Get field mapping for the data type
      const fields = this._getFieldsForDataType(dataType);
      
      // Convert to CSV
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      return Buffer.from(csv);
    } catch (error) {
      throw new Error(`Failed to export ${dataType} data: ${error.message}`);
    }
  }

  /**
   * Get field mapping for a specific data type
   * @param {string} dataType - Type of data
   * @returns {Array} Field definitions for CSV export
   */
  _getFieldsForDataType(dataType) {
    const fieldMappings = {
      customers: [
        { label: 'Customer ID', value: 'customerId' },
        { label: 'Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Address', value: 'address' },
        { label: 'Created At', value: 'createdAt' }
      ],
      drivers: [
        { label: 'Driver ID', value: 'driverId' },
        { label: 'Name', value: 'name' },
        { label: 'License Number', value: 'licenseNumber' },
        { label: 'Phone', value: 'phone' },
        { label: 'Vehicle Type', value: 'vehicleType' },
        { label: 'Status', value: 'status' }
      ],
      rates: [
        { label: 'Rate ID', value: 'rateId' },
        { label: 'Origin', value: 'origin' },
        { label: 'Destination', value: 'destination' },
        { label: 'Rate', value: 'rate' },
        { label: 'Currency', value: 'currency' },
        { label: 'Valid From', value: 'validFrom' },
        { label: 'Valid To', value: 'validTo' }
      ]
    };

    return fieldMappings[dataType] || [];
  }

  /**
   * Get available export options for a data type
   * @param {string} dataType - Type of data
   * @returns {Object} Export options
   */
  getExportOptions(dataType) {
    return {
      filters: {
        dateRange: {
          start: 'Date range start',
          end: 'Date range end'
        },
        status: ['All', 'Active', 'Inactive'],
        // Add more filter options based on data type
      },
      fields: this._getFieldsForDataType(dataType).map(field => ({
        label: field.label,
        value: field.value,
        selected: true
      }))
    };
  }
}

module.exports = new ExportService(); 