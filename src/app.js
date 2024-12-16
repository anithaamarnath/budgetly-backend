const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const users = require('./routes/users');
const auth = require('./routes/auth');
const transactions = require('./routes/transactions');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());

app.use(express.json());

// CSP 
const isDevelopment = process.env.NODE_ENV === 'development';


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: isDevelopment
                    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'chrome-extension:', "'wasm-unsafe-eval'"]
                    : ["'self'"],
                objectSrc: ["'none'"], 
                upgradeInsecureRequests: [], 
            },
        },
    })
);



  

// Routes
app.use('/api/register', users);
app.use('/api/signin', users);

app.use('/api/auth', auth);
app.use('/api/user', transactions);

app.get('/', (req,res) => {
    console.log('Backend to front')
    res.json({message: 'Hello from the backend!'});
})

// Connect to DB
connectDB();

module.exports = app;
