const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Event = require('../models/Event');
const validateEvent = require('../middleware/validate');

const router = express.Router();

const allowedTags = ['work', 'personal'];

// Helper function to parse dates
const parseDate = (date) => {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate)) throw new Error('Invalid date format');
  return parsedDate;
};

// Validate tags helper function
const validateTags = (tags) => {
  if (tags && (!Array.isArray(tags) || tags.some((tag) => !allowedTags.includes(tag)))) {
    throw new Error(`Invalid tag(s). Allowed tags: ${allowedTags.join(', ')}`);
  }
};

// Create a new event
router.post('/', authenticateToken, validateEvent, async (req, res) => {
  try {
    const {
      calendarId = null,
      title,
      description = '',
      location = '',
      startDate,
      endDate,
      isAllDay = false,
      recurrenceRule = '',
      recurrenceExceptions = [],
      status = 'confirmed',
      attendees = [],
      tags = [],
    } = req.body;

    validateTags(tags);

    const event = new Event({
      calendarId,
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
      attendees: attendees || [],
      tags: tags || [],
    });

    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(400).json({ error: 'Failed to create event', details: error.message });
  }
});

// Get all events for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tags } = req.query;

    const filter = { ownerId: req.user.id };
    if (tags) {
      const tagsArray = tags.split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error.message);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Get events by month
router.get('/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const { tags } = req.query;
    const filter = {
      ownerId: req.user.id,
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    };

    if (tags) {
      const tagsArray = tags.split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    const events = await Event.find(filter).sort({ startDate: 1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events by month:', error.message);
    res.status(500).json({ error: 'Failed to fetch events for the specified month', details: error.message });
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
      attendees = [],
      tags = [],
    } = req.body;

    validateTags(tags);

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
        recurrenceRule,
        recurrenceExceptions,
        status,
        attendees: attendees || [],
        tags: tags || [],
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error.message);
    res.status(400).json({ error: 'Failed to update event', details: error.message });
  }
});

// Delete an event by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error.message);
    res.status(400).json({ error: 'Failed to delete event', details: error.message });
  }
});

module.exports = router;
