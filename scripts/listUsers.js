import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'email name role createdAt');
    console.log('\nRegistered Users:');
    console.log('-----------------');
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

listUsers(); 