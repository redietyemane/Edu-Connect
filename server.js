const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
function generateSecretKey() {
    return crypto.randomBytes(32).toString('hex');
}

const secretKey = generateSecretKey();
const app = express();
const port = process.env.PORT || 3000;
const host = '127.0.0.1'; // replace with your IP address

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/email-db')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
    if (req.query && req.query.token) {
        const token = req.query.token;
        try {
            const decoded = jwt.verify(token, secretKey);           
            req.user = decoded;
            next();
        } catch (error) {
            res.redirect('/');
            
        }
    } else {
        res.redirect('/');
    }
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));



// User schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }    
});

const User = mongoose.model('User', userSchema);

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    const token = jwt.sign({email, role}, secretKey, { expiresIn: '1h' });

    try {
        console.log(`Login attempt for email: ${email}`);
        const user = await User.findOne({ email, role }); // Check email and role
        if (!user) {
            console.log('User not found');
            return res.status(400).json({ success: false, message: 'Invalid email, password, or role' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(400).json({ success: false, message: 'Invalid email, password, or role' });
        }
        console.log('Login successful');
        res.json({ success: true, role: user.role, token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ success: false, message: 'Login failed', error });
    }
});

app.get('/dashboard', isLoggedIn, (req, res) => {
    console.log(req.user);
    const role = req.user.role;
    if (role === 'parent') {
        res.sendFile(path.join(__dirname, 'public', 'parent.html'));
    } else if (role === 'teacher') {
        res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
    } else if (role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.status(404).send('Page not found');
    }
});

// API route to get parent dashboard data
app.get('/api/parent/dashboard', (req, res) => {
    const data = {
        progress: 'Your child is making excellent progress in math and science.',
        attendance: 'Your child has a 95% attendance record this month.',
        events: 'Upcoming school event: Science Fair on July 20th.'
    };

    res.json(data);
});

// API route to get teacher dashboard data.
app.get('/api/teacher/dashboard', (req, res) => {
    // Dummy data for the teacher's dashboard
    const data = {
        classOverview: 'Your class has an average grade of B+.',
        studentProgress: 'Student A is excelling in math. Student B needs improvement in science.',
        events: 'Upcoming school event: Parent-Teacher Conference on July 25th.'
    };

    res.json(data);
});

// API route to get admin dashboard data
app.get('/api/admin/dashboard', (req, res) => {
    // Dummy data for the admin's dashboard
    const data = {
        schoolOverview: 'The school has a total of 500 students and 50 teachers.',
        teacherManagement: '5 teachers have pending leave requests.',
        events: 'Upcoming school event: Annual Day Celebration on August 10th.'
    };

    res.json(data);
});


// Start server
app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
