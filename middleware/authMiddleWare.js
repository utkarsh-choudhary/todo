import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const isAuthenticated = async(req,res,next)=>{
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(400).json({
                message:"user not authorized",
                success:false
            })
        }
        
        const token = authHeader.split(' ')[1];
        if(!token){
            return res.status(400).json({
                message:"user not authorized",
                success:false
            })
        }

        const decode = await jwt.verify(token,process.env.ACCESS_TOKEN);
        if(!decode){
            return res.status(400).json({
                message:"Invalid token",
                success:false
            })
        }

        // Find the user and attach to request
        const user = await User.findById(decode.userId);
        if (!user) {
            return res.status(400).json({
                message:"User not found",
                success:false
            })
        }
        req.user = user;
        next();
    } catch (error) {
        console.log('Auth middleware error:', error);
        return res.status(400).json({
            message:"Authentication failed",
            success:false,
            error: error.message
        })
    }
}

export default isAuthenticated;