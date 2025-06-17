// backend/models/Calendar.js

const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  description: { type: String, maxlength: 200 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Calendar owner
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Shared users
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Calendar', calendarSchema);
