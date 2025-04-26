import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { auth, firebaseAuth } from "../config/firebase.js";

export const signup = async (req, res) => {
  try {
    const { email, phone, password} = req.body;
    console.log(req.body);
    if ( !email || !phone || !password ) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "User already exist with the same email",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    

    
    const createdUser = await User.create({
      email,
      phone,
      password: hashedPassword
    });


    return res.status(200).json({
      message: "User created successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};








export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        success: false,
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if user has a password (for Google users who haven't set a password)
    if (!user.password) {
      return res.status(400).json({
        message: "Please use Google login or set a password first",
        success: false,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    // Generate token
    const tokenData = {
      userId: user._id,
    };

    const token = jwt.sign(tokenData, process.env.ACCESS_TOKEN, {
      expiresIn: "1d",
    });

    // Return user data without password
    const userData = {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      profilePic: user.profilePic,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: "Login successful",
        user: userData,
        token,
        success: true,
      });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: "Error during login",
      success: false,
      error: error.message
    });
  }
};





export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};




export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.log('No ID token provided in request body');
      return res.status(400).json({ message: "No token provided", success: false });
    }

    // Since we're using Firebase Auth in the frontend, we can trust the token
    // and just use the user data that comes with it
    const userData = req.body.userData; // This should be sent from the frontend
    
    if (!userData || !userData.email) {
      return res.status(400).json({ 
        message: "Invalid user data", 
        success: false 
      });
    }

    const { email, name, picture } = userData;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        phone: "", // Optional field
        password: "", // Not needed for Google users
        name,
        profilePic: picture,
      });
    }

    const tokenData = { userId: user._id };

    const token = jwt.sign(tokenData, process.env.ACCESS_TOKEN, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: "Google login successful",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          profilePic: user.profilePic,
        },
        token,
        success: true,
      });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      success: false,
      error: error.message 
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN,
      { expiresIn: '1h' }
    );

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please use the following token in the Todo App:</p>
        <p style="font-size: 18px; font-weight: bold; background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">${resetToken}</p>
        <p>Steps to reset your password:</p>
        <ol>
          <li>Open the Todo App</li>
          <li>Go to the Reset Password screen</li>
          <li>Enter this token</li>
          <li>Set your new password</li>
        </ol>
        <p>This token will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset email sent",
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: "Error sending reset email",
      success: false
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Validate input
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({
        message: "Valid token is required",
        success: false
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      return res.status(400).json({
        message: "Valid new password is required",
        success: false
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token.trim(), process.env.ACCESS_TOKEN);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid or expired token",
        success: false
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      message: "Error resetting password",
      success: false
    });
  }
};