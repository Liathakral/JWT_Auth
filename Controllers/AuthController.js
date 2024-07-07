const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const randomstring  = require('randomstring');
const nodemailer = require('nodemailer');
require('dotenv').config();
const UserModel = require("../Models/User");
const presetRoles = ['Buyer', 'Tenant', 'Owner', 'User', 'Admin', 'Content Creator'];

require('dotenv').config();

const sendResetEmail = (name, email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        authMethod:'plain',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `<p>Hi ${name},</p>
               <p>You requested a password reset. Please click on the following link or copy and paste it into your browser to reset your password:</p>
               <a href="${process.env.CLIENT_URL}/token=${token}">${process.env.CLIENT_URL}/token=${token}</a>
               <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending password reset email:', error);
        } else {
            console.log('Password reset email sent:', info.response);
        }
    });
}

const signup = async (req, res) => {
    try {
        const { name, email, password,role } = req.body;
        const user = await UserModel.findOne({ email });
        if (!presetRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified', success: false });
        }
        if (user) {
            return res.status(409)
                .json({ message: 'User is already exist, you can login', success: false });
        }
        const userModel = new UserModel({ name, email, password,role });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();
        res.status(201)
            .json({
                message: "Signup successfully",
                success: true
            })
    } catch (err) {
        res.status(500)
            .json({
                message: "Internal server errror",
                success: false
            })
    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        const errorMsg = 'Auth failed email or password is wrong';
        if (!user) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.status(200)
            .json({
                message: "Login Success",
                success: true,
                jwtToken,
                email,
                name: user.name
            })
    } catch (err) {
        console.log(err)
        res.status(500)
            .json({
                
                message: "Internal server error",
                success: false
            })
    }
}

const forget_password = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        user.token = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        sendResetEmail(user.name, user.email, resetToken);

        res.status(200).json({ message: 'Password reset email sent', success: true });

    } catch (err) {
        console.error('Error during password reset:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

const resetpassword = async (req, res) => {
    try {
        const token = req.query.token;
        console.log('Reset password token:', token); // Check token value

        const tokendata = await UserModel.findOne({ token });
        console.log('User data found:', tokendata); // Check if user data is found

        if (!tokendata) {
            return res.status(404).json({ message: 'User not found or token expired', success: false });
        }

        const password = req.body.password;
        const hashedpassword = await bcrypt.hash(password, 10);
        const userdata = await UserModel.findByIdAndUpdate({ _id: tokendata._id }, { $set: { password: hashedpassword, token: '' } }, { new: true });

        if (!userdata) {
            return res.status(404).json({ message: 'User not found or token expired', success: false });
        }

        res.status(200).json({ msg: 'Password reset successful', success: true, data: userdata });
    } catch (err) {
        console.error('Error resetting password:', err);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
};

module.exports = {
    signup,
    login,
    forget_password,
    resetpassword
}