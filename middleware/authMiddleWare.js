import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

const isAuthenticated = async(req,res,next)=>{
    try {
        const token = req.cookies.token;
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
        console.log(error);
        next(error)
    }
}

export default isAuthenticated;