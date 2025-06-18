const express = require('express');
const Event = require('../models/Event'); // Assuming you have an Event model
const router = express.Router();

// MCP query route
router.post('/query', async (req, res) => {
  const { action, data } = req.body;

  try {
    switch (action) {
      case 'createEvent':
        if (!data) return res.status(400).json({ error: 'Event data is required' });
        const newEvent = new Event(data);
        await newEvent.save();
        return res.json({ message: 'Event created successfully', event: newEvent });

      case 'listEvents':
        const events = await Event.find();
        return res.json({ events });

      case 'updateEvent':
        if (!data || !data.id) return res.status(400).json({ error: 'Event ID and data are required' });
        const updatedEvent = await Event.findByIdAndUpdate(data.id, data, { new: true });
        return res.json({ message: 'Event updated successfully', event: updatedEvent });

      case 'deleteEvent':
        if (!data || !data.id) return res.status(400).json({ error: 'Event ID is required' });
        await Event.findByIdAndDelete(data.id);
        return res.json({ message: 'Event deleted successfully' });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling MCP request:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

module.exports = router;
