const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Event = require('../models/Event');
const validateEvent = require('../middleware/validate');

const router = express.Router();

// Helper function to parse dates
const parseDate = (date) => {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate)) throw new Error('Invalid date format');
  return parsedDate;
};

// Create a new event
router.post('/', authenticateToken, validateEvent, async (req, res) => {
  console.log('Request Body after Validation:', req.body); // Debugging log
  try {
    const {
      calendarId = null, // Default to null if not provided
      title,
      description = '', // Default to empty string
      location = '', // Default to empty string
      startDate,
      endDate,
      isAllDay = false, // Default to false
      recurrenceRule = '', // Default to empty string
      recurrenceExceptions = [], // Default to empty array
      status = 'confirmed', // Default to 'confirmed'
      attendees = [], // Default to empty array
    } = req.body;

    const event = new Event({
      calendarId: calendarId || null,
      ownerId: req.user.id,
      title,
      description,
      location,
      startDate: parseDate(startDate),
      endDate: endDate ? parseDate(endDate) : null,
      isAllDay: Boolean(isAllDay),
      recurrenceRule,
      recurrenceExceptions,
      status,
      attendees,
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(400).json({ error: 'Failed to create event' });
  }
});


// Get all events for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find({ ownerId: req.user.id }).sort({ startDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events by month
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    const events = await Event.find({
      ownerId: req.user.id,
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ startDate: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events by month:', error.message);
    res.status(500).json({ error: 'Failed to fetch events for the specified month' });
  }
});


// Update an event by ID
router.put('/:id', authenticateToken, validateEvent, async (req, res) => {
  try {
    const {
      calendarId,
      title,
      description,
      location,
      startDate,
      endDate,
      isAllDay,
      recurrenceRule,
      recurrenceExceptions,
      status,
      attendees,
    } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        calendarId,
        title,
        description,
        location,
        startDate: parseDate(startDate),
        endDate: endDate ? parseDate(endDate) : null,
        isAllDay: Boolean(isAllDay),
        recurrenceRule: recurrenceRule || '',
        recurrenceExceptions: recurrenceExceptions || [],
        status: status || 'confirmed',
        attendees: attendees || [],
      },
      { new: true }
    );

    if (!updatedEvent) return res.status(404).json({ error: 'Event not found' });

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(400).json({ error: 'Failed to update event' });
  }
});

// Delete an event by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) return res.status(404).json({ error: 'Event not found' });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.status(400).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
