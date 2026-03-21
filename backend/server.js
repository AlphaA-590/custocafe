const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/custocafe', { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware for authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, 'your_jwt_secret', (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Password strength checking function
const checkPasswordStrength = (password) => {
    const strongPasswordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/;
    return strongPasswordRegex.test(password);
};

// Email validation function
const validateEmail = (email) => {
    const emailRegex = /^[\w-\.]+@[\w-\.]+\.[a-z]{2,4}$/;
    return emailRegex.test(email);
};

// User model
const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}));

// Registration endpoint
app.post('/register', [
    body('email').isEmail().custom((value) => {
        if (!validateEmail(value)) {
            throw new Error('Invalid email');
        }
        return true;
    }),
    body('password').custom((value) => {
        if (!checkPasswordStrength(value)) {
            throw new Error('Password is not strong enough');
        }
        return true;
    }),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({ email, password: hashedPassword });
    user.save()
        .then(() => res.status(201).send('User registered'))
        .catch(err => res.status(500).send(err));
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email })
        .then(user => {
            if (!user || !bcrypt.compareSync(password, user.password)) {
                return res.status(401).send('Invalid credentials');
            }
            const token = jwt.sign({ email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });
            res.json({ token });
        })
        .catch(err => res.status(500).send(err));
});

// CRUD for glebas
const Gleba = mongoose.model('Gleba', new mongoose.Schema({
    name: String,
    description: String,
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.send('OK');
});

// GET all glebas
app.get('/glebas', (req, res) => {
    Gleba.find().then(glebas => res.json(glebas)).catch(err => res.status(500).send(err));
});

// POST create gleba
app.post('/glebas', authenticateJWT, (req, res) => {
    const { name, description } = req.body;
    const gleba = new Gleba({ name, description });
    gleba.save()
        .then(() => res.status(201).send('Gleba created'))
        .catch(err => res.status(500).send(err));
});

// GET gleba by ID
app.get('/glebas/:id', (req, res) => {
    Gleba.findById(req.params.id)
        .then(gleba => {
            if (!gleba) return res.status(404).send('Gleba not found');
            res.json(gleba);
        })
        .catch(err => res.status(500).send(err));
});

// PUT update gleba
app.put('/glebas/:id', authenticateJWT, (req, res) => {
    Gleba.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .then(updatedGleba => {
            if (!updatedGleba) return res.status(404).send('Gleba not found');
            res.json(updatedGleba);
        })
        .catch(err => res.status(500).send(err));
});

// DELETE gleba
app.delete('/glebas/:id', authenticateJWT, (req, res) => {
    Gleba.findByIdAndDelete(req.params.id)
        .then(result => {
            if (!result) return res.status(404).send('Gleba not found');
            res.send('Gleba deleted');
        })
        .catch(err => res.status(500).send(err));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
