const _ = require('lodash');
const express = require('express');
const { User, validateUser } = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { 
    ZERO,
    STATUS_CODE_BAD_REQUEST, 
    STATUS_CODE_INTERNAL_SERVER_ERROR, 
    EXPIRES_IN_ONE_HOUR 
} = require('../constants');


router.post('/register', async (req, res) => {
  
    const { error } = validateUser(_.omit(req.body, ['token', 'isLoggedIn']));
    
    if (error) return res.status(STATUS_CODE_BAD_REQUEST).send(error.details[ZERO].message);
   
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(STATUS_CODE_BAD_REQUEST).send('User already registered.');

    
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(STATUS_CODE_BAD_REQUEST).send('Passwords do not match.');
    }
    
    user = new User(_.pick(req.body, ['name', 'email', 'password']));

    try {
  
        const salt = await bcrypt.genSalt(Number(process.env.SALT));

        user.password = await bcrypt.hash(user.password, salt);
    
        await user.save();
       
        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
    } catch (err) {
        console.error(err.message);
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).send('Server error');
    }
});


router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
       
        if (!user) return res.status(STATUS_CODE_BAD_REQUEST).send('Invalid email or password.');
       

        const validPassword = await bcrypt.compare(String(password), user.password);
      
        if (!validPassword) return res.status(STATUS_CODE_BAD_REQUEST).send('Invalid email or password.');


        const token = jwt.sign(
            { _id: user._id, email: user.email, name: user.name },
            process.env.JWT_PRIVATE_KEY, 
            { expiresIn: EXPIRES_IN_ONE_HOUR } 
        );        
        

        res.header('x-auth-token', token).send({
            token: token,
            email: user.email,
            name: user.name,
        });

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(STATUS_CODE_INTERNAL_SERVER_ERROR).send('Server error');
    }
});

module.exports = router;