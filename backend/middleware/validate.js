const validateEvent = (req, res, next) => {
  const { 
    title, 
    startDate, 
    endDate, 
    recurrenceRule, 
    status, 
    attendees, 
    isAllDay, 
    recurrenceExceptions 
  } = req.body;

  console.log('Request Body:', req.body); // Log the incoming request for debugging

  // Check for required fields
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'Title, startDate, and endDate are required' });
  }

  // Parse and validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid date format for startDate or endDate' });
  }

  if (start >= end) {
    return res.status(400).json({ error: 'startDate must be earlier than endDate' });
  }

  // Validate recurrenceRule (if provided, must be a string)
  if (recurrenceRule && typeof recurrenceRule !== 'string') {
    return res.status(400).json({ error: 'Invalid recurrenceRule format. It must be a string' });
  }

  // Validate status (if provided, must be one of the allowed values)
  const validStatuses = ['confirmed', 'tentative', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` 
    });
  }

  // Validate attendees (if provided, must be an array of strings)
  if (attendees && (!Array.isArray(attendees) || attendees.some(a => typeof a !== 'string'))) {
    return res.status(400).json({ error: 'Attendees must be an array of strings' });
  }

  // Validate isAllDay (if provided, must be a boolean)
  if (typeof isAllDay !== 'undefined' && typeof isAllDay !== 'boolean') {
    return res.status(400).json({ error: 'isAllDay must be a boolean' });
  }

  // Validate recurrenceExceptions (if provided, must be an array of valid date strings)
  if (recurrenceExceptions && 
      (!Array.isArray(recurrenceExceptions) || 
       recurrenceExceptions.some(date => isNaN(new Date(date).getTime())))) {
    return res.status(400).json({ 
      error: 'recurrenceExceptions must be an array of valid date strings' 
    });
  }

  next(); // Proceed to the next middleware or route handler if validation passes
};

module.exports = validateEvent;
