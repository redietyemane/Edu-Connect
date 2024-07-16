const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/email-db', { useNewUrlParser: true, useUnifiedTopology: true }) // replace with your IP address
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// User schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true } // Adding role field
});

const User = mongoose.model('User', userSchema);

// Function to add dummy user
const addDummyUser = async () => {
    const users = [
        { email: 'parent@example.com', password: 'password123', role: 'parent' },
        { email: 'teacher@example.com', password: 'password123', role: 'teacher' },
        { email: 'admin@example.com', password: 'password123', role: 'admin' }
    ];

    try {
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const newUser = new User({ email: user.email, password: hashedPassword, role: user.role });
            await newUser.save();
        }
        console.log('Dummy users added');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error adding dummy users:', error);
        mongoose.disconnect();
    }
};

// Call the function to add dummy users
addDummyUser();

