//app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/signup-login-db', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define schema for user
const userSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    email: String,
    password: String,
    securityQuestion: String, // New field for security question
    securityAnswer: String   // New field for security answer
});

// Create model for user
const User = mongoose.model('User', userSchema);

// Define schema for contact
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: String,
    address: String
}, { collection: 'contact_form' });

// Create model for contact
const Contact = mongoose.model('Contact', contactSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Signup route
app.post('/signup', (req, res) => {
    const { name, mobile, email, password, securityQuestion, securityAnswer } = req.body;
    
    // Check if email already exists
    User.findOne({ email: email }).exec()
    .then(user => {
        if (user) {
            res.status(400).send('Email already exists');
        } else {
            // Create new user
            const newUser = new User({
                name: name,
                mobile: mobile,
                email: email,
                password: password,
                securityQuestion: securityQuestion,
                securityAnswer: securityAnswer
            });
            newUser.save()
                .then(() => {
                    // Redirect to login page after successful signup
                    res.redirect('/login');
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send('Error occurred while signing up');
                });
        }
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error occurred while checking email');
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if a user with the provided email and password exists in the database
    User.findOne({ email: email, password: password }, (err, user) => {
        if (err) {
            // Handle any errors
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else if (user) {
            // If user is found, login is successful, redirect to cms.html
            res.send('<script>window.open("/cms.html", "_blank");</script>'); // Open cms.html in a new tab
        } else {
            // If user is not found or password is incorrect, redirect back to login page
            res.redirect('/login');
        }
    });
});

// Forgot Password route
app.post('/forgot-password', (req, res) => {
    const { email, securityQuestion, securityAnswer, newPassword } = req.body;

    // Check if the provided email and security answer match the stored data
    User.findOne({ email: email, securityQuestion: securityQuestion, securityAnswer: securityAnswer })
        .then(user => {
            if (user) {
                // If security question and answer match, update the password
                user.password = newPassword;
                return user.save();
            } else {
                // If user is not found or security question/answer is incorrect
                throw new Error('Incorrect security question/answer or email');
            }
        })
        .then(() => {
            res.status(200).send('Password updated successfully');
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error occurred while updating password');
        });
});

// Add contact route
app.post('/add-contact', async (req, res) => {
    try {
        const { name, email, phoneNumber, address } = req.body;

        // Create a new contact instance
        const newContact = new Contact({
            name,
            email,
            phoneNumber,
            address
        });

        // Save the contact to MongoDB
        await newContact.save();
        
        // Send a success status without any response body
        res.sendStatus(204); // No content response

    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ error: "Failed to save contact", details: error });
    }
});


// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'forgot_password.html'));
});

// Serve cms.html
app.get('/cms.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cms.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
