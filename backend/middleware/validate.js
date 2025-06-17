const validateEvent = (req, res, next) => {
  const {
    title,
    startDate,
    endDate,
    recurrenceRule,
    status,
    attendees,
    isAllDay,
    recurrenceExceptions,
    tags,
    location,
  } = req.body;

  //console.log('Request Body:', req.body);

  // Normalize empty or invalid fields
  req.body.tags = Array.isArray(tags)
    ? tags.filter((tag) => tag && ['work', 'personal'].includes(tag))
    : [];
  req.body.attendees = Array.isArray(attendees)
    ? attendees.filter((a) => a && typeof a === 'string')
    : [];
  req.body.recurrenceExceptions =
    recurrenceExceptions && typeof recurrenceExceptions === 'string' && recurrenceExceptions.trim() === ''
      ? []
      : Array.isArray(recurrenceExceptions)
      ? recurrenceExceptions.filter((date) => !isNaN(new Date(date).getTime()))
      : [];

  // Required fields validation
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'Title, startDate, and endDate are required.' });
  }

  // Date validation
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'startDate or endDate is not a valid date.' });
  }
  if (start >= end) {
    return res.status(400).json({ error: 'startDate must be earlier than endDate.' });
  }

  // Status validation
  const validStatuses = ['confirmed', 'tentative', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
  }

  // Location validation
  if (location && (typeof location !== 'string' || location.trim() === '')) {
    return res.status(400).json({ error: 'Location must be a non-empty string.' });
  }

  // Proceed to the next middleware or route handler
  next();
};

module.exports = validateEvent;
