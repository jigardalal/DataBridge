const express = require('express');
const router = express.Router();
const exportController = require('../controllers/ExportController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/export:
 *   post:
 *     summary: Export processed data as CSV
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityType:
 *                 type: string
 *                 description: Type of entity to export (e.g., 'customer', 'driver')
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Fields to include in export
 *               filter:
 *                 type: object
 *                 description: Filter criteria
 *               options:
 *                 type: object
 *                 description: Additional CSV options
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No data found
 *       500:
 *         description: Server error
 */
router.post('/', exportController.exportData);

/**
 * @swagger
 * /api/export/fields/{entityType}:
 *   get:
 *     summary: Get available fields for export
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of entity
 *     responses:
 *       200:
 *         description: Available fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No data found
 *       500:
 *         description: Server error
 */
router.get('/fields/:entityType', exportController.getAvailableFields);

// Export routes
router.get('/:dataType/options', authenticate, exportController.getExportOptions);
router.post('/:dataType/csv', authenticate, exportController.exportToCSV);

module.exports = router; 