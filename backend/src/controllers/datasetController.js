const Dataset = require('../models/Dataset');

module.exports = {
  async listDatasets(req, res) {
    try {
      const datasets = await Dataset.find();
      res.json(datasets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
