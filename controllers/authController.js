import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { auth, firebaseAuth } from "../config/firebase.js";

export const signup = async (req, res) => {
  try {
    const { email, phone, password, role } = req.body;
    console.log('Signup attempt for email:', email);
    
    if (!email || !phone || !password) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(401).json({
        message: "User already exist with the same email",
        success: false,
      });
    }

    console.log('Creating new user with role:', role);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    const createdUser = await User.create({
      email,
      phone,
      password: hashedPassword,
      role: role || 'user'
    });

    console.log('User created successfully:', createdUser.email);

    return res.status(200).json({
      message: "User created successfully",
      success: true,
      user: {
        _id: createdUser._id,
        email: createdUser.email,
        role: createdUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      message: "Error creating user",
      success: false,
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    console.log('Provided password:', password);
    
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
      console.log('User not found for email:', email);
      return res.status(400).json({
        message: "User not found",
        success: false,
      });
    }

    console.log('User found:', {
      email: user.email,
      hasPassword: !!user.password,
      storedPasswordHash: user.password
    });

    // Check if user has a password (for Google users who haven't set a password)
    if (!user.password) {
      return res.status(400).json({
        message: "Please use Google login or set a password first",
        success: false,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison details:', {
      providedPassword: password,
      storedHash: user.password,
      matchResult: isPasswordMatch
    });
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    // Generate token
    const tokenData = {
      userId: user._id,
      role: user.role
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
      role: user.role
    };

    return res.status(200).json({
      message: "Login successful",
      success: true,
      user: userData,
      token
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
    // Clear the token from the client
    res.clearCookie('token');
    
    return res.status(200).json({
      message: "Logged out successfully",
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: "Error during logout",
      success: false,
      error: error.message
    });
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
        role: 'user' // Default role for Google sign-in
      });
    }

    const tokenData = { 
      userId: user._id,
      role: user.role
    };

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
          role: user.role
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

    // Convert email to lowercase for case-insensitive search
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

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
      to: user.email, // Use the email from the database to ensure correct case
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