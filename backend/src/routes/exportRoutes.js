const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authenticate = require('../middleware/auth');

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
router.post('/', authenticate, exportController.exportData);

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
 *     responses:
 *       200:
 *         description: List of available fields
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No data found
 *       500:
 *         description: Server error
 */
router.get('/fields/:entityType', authenticate, exportController.getExportOptions);

/**
 * @swagger
 * /api/export/csv:
 *   post:
 *     summary: Export data to CSV
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 description: Data to export
 *               options:
 *                 type: object
 *                 description: CSV export options
 *     responses:
 *       200:
 *         description: CSV file
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/csv', authenticate, exportController.exportToCSV);

module.exports = router;
