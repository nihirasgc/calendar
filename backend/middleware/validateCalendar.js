// backend/middleware/validateCalendar.js

const validateCalendar = (req, res, next) => {
  const { name, description } = req.body;

  // Check for required fields
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Validate name length
  if (name.length > 50) {
    return res.status(400).json({ error: 'Name should not exceed 50 characters' });
  }

  // Validate description length
  if (description && description.length > 200) {
    return res.status(400).json({ error: 'Description should not exceed 200 characters' });
  }

  next();
};

module.exports = validateCalendar;
