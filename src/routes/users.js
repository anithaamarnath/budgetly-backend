const { STATUS_CODE_BAD_REQUEST, STATUS_CODE_INTERNAL_SERVER_ERROR, ZERO } = require('../constants');
const _ = require('lodash');
const express = require('express');
const { User, validate } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  
  
    // Validate request body
    const { error } = validate(req.body);
    
  
    if (error) return res.status(STATUS_CODE_BAD_REQUEST).send(error.details[ZERO].message);
   
    // Check for duplicate email
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(STATUS_CODE_BAD_REQUEST).send('User already registered.');

    // Check if passwords match
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(STATUS_CODE_BAD_REQUEST).send('Passwords do not match.');
    }
    
    // Save the user to the database
    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();
        console.log('3.user ==', user);

        // Generate auth token
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
    } catch (err) {
        console.error(err.message);
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).send('Server error');
    }
});

// User signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('1.login ==', req.body);

        // Validate user credentials...
        const user = await User.findOne({ email });
       
        if (!user) return res.status(400).send('Invalid email or password.');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid email or password.');

        // Generate JWT
        const token = jwt.sign(
            { _id: user._id, email: user.email, name: user.name },
            process.env.JWT_PRIVATE_KEY, 
            { expiresIn: '1h' } 
        );        
        

        res.header('x-auth-token', token).send({
            token: token,
            email: user.email,
            name: user.name,
        });

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;