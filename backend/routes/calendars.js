// backend/routes/calendars.js

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const validateCalendar = require('../middleware/validateCalendar');
const Calendar = require('../models/Calendar');
const Event = require('../models/Event'); // To handle calendar-specific events

const router = express.Router();

/**
 * Create a new calendar
 */
router.post('/', authenticateToken, validateCalendar, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Create a new calendar
    const newCalendar = new Calendar({
      name,
      description,
      ownerId: req.user.id
    });

    await newCalendar.save();
    res.status(201).json(newCalendar);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all calendars for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const calendars = await Calendar.find({
      $or: [{ ownerId: req.user.id }, { sharedWith: req.user.id }]
    });

    res.json(calendars);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a specific calendar by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({
      _id: req.params.id,
      $or: [{ ownerId: req.user.id }, { sharedWith: req.user.id }]
    });

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }

    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a calendar
 */
router.put('/:id', authenticateToken, validateCalendar, async (req, res) => {
  try {
    const { name, description } = req.body;

    const calendar = await Calendar.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user.id // Only the owner can update
      },
      { name, description, updatedAt: Date.now() },
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found or unauthorized' });
    }

    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a calendar
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const calendar = await Calendar.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id // Only the owner can delete
    });

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found or unauthorized' });
    }

    // Remove associated events
    await Event.deleteMany({ calendarId: calendar._id });

    res.json({ message: 'Calendar and associated events deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Share a calendar with a user
 */
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    const calendar = await Calendar.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user.id // Only the owner can share
      },
      { $addToSet: { sharedWith: userId } }, // Prevent duplicates
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found or unauthorized' });
    }

    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Unshare a calendar with a user
 */
router.post('/:id/unshare', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    const calendar = await Calendar.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.user.id // Only the owner can unshare
      },
      { $pull: { sharedWith: userId } }, // Remove the user
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found or unauthorized' });
    }

    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
