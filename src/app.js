const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const users = require('./routes/users');
const auth = require('./routes/auth');
const transactions = require('./routes/transactions');
require('dotenv').config();



const app = express();
// Allow requests from your frontend domain
const allowedOrigins = ['https://budgetly-frontend.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error('Not allowed by CORS')); // Reject the request
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

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

 

app.use('/api/users', users);
app.use('/api/auth', auth); 
app.use('/api/user', transactions);

app.get('/', (req,res) => {
    res.json({message: 'Hello from the backend!'});
})


connectDB();

module.exports = app;
