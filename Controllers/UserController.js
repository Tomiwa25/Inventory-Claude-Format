const User = require('../Models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Create a new user
exports.createUser = async (req, res) => {
    try {

        // specific field validation
        const { name, email, password, gender, phone, role, hasAdminAccess } = req.body;

        if (!req.body.name || !req.body.email || !req.body.password || !req.body.gender || !req.body.phone || !req.body.role) {
            return res.status(400).json({ message: 'All fields are required' });
        }   

        //email check
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        //phone check
        const existingPhone = await User.findOne({ phone: req.body.phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }

        //encrypt the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        //create the user
        const user = new User({ name: req.body.name, email: req.body.email, password: hashedPassword, gender: req.body.gender, phone: req.body.phone, role: req.body.role, hasAdminAccess: req.body.hasAdminAccess });
        await user.save();
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
}

// login user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        //check if all required field are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        //check if user exist
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        //check if password is correct
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        //generate token
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token, user });
    }  catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// Return the currently authenticated user -- used by the frontend on page load
// to restore a session from a stored token. Requires the `protect` middleware.
exports.getMe = async (req, res) => {
    try {
        res.status(200).json({ message: 'Current user retrieved successfully', user: req.user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

