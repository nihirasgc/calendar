require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Middleware to validate JWT
router.get('/validateToken', (req, res) => {
  const authHeader = req.headers.authorization;
  // console.log('Authorization header:', authHeader); 

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Token decoded successfully:', decoded); // Debugging
    res.status(200).json({ message: 'Token is valid', user: decoded });
  } catch (err) {
    console.error('Token verification error:', err); // Debugging
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});



// Register Route
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
// Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash the password before saving
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password });

    //const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.error("User not found");
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    //console.log("User from DB:", user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    //console.log("Is Password Valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;