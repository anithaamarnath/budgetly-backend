const helmet = require('helmet');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const users = require('./routes/users');
const auth = require('./routes/auth');
const transactions = require('./routes/transactions');
require('dotenv').config();



const app = express();


app.use(cors({
  origin: ['https://budgetly-frontend.vercel.app', 'https://budgetly-frontend-2emqo1kem-anithaamarnaths-projects.vercel.app'], // Allow both frontend URLs
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization'
}));

// Handle preflight requests for all routes
app.options('*', cors());


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

app.get('/test', (req,res) => {
    res.json({message: 'Hello from the backend!'});
})
// Your existing routes here
app.post('/api/users/signin', (req, res) => {
  res.json({ message: "Sign-in successful!" });
});


connectDB();

module.exports = app;
