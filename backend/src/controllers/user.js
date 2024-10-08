import httpStatus from "http-status";
import {User} from "../models/user.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.js";

const login = async(req, res) => {
    const {username, password} = req.body;
    if(!username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({message: "Provide username and Password"}); 
    }

    try{
        //check the user exsistance
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User Not Found!"});
        }
        // if exists, decrpt the password to compare with actual password (return true or false)
        let isPassword = bcrypt.compareSync(password, user.password); 
        if(isPassword){
            let token = crypto.randomBytes(20).toString('hex'); //generate token of 40-character hexadecimal string(1btye = 2 hexa char)
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token:token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid Password or Username"});
        }
    }catch (e){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Error: Something went wrong ${e}`});
    }
}


const register = async(req,res) => {
    const {name, username, password} = req.body;
    console.log(name, username, password);
    if(!name || !username || !password || password === " "){
        return res.status(httpStatus.BAD_REQUEST).json({message: "Enter valid credentials"});
    }
    try{
        const exsitingUser = await User.findOne({username});
        if(exsitingUser){
            return res.status(httpStatus.CONFLICT).json({message: "User already Exists"});
        }

        // new user hash password & add user to db
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("hassed password: ", hashedPassword);
        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword
        });
        await newUser.save();
        console.log(newUser);

        return res.status(httpStatus.CREATED).json({message: "User Registered Succesfully"});
    }catch(e){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong ${e}`});
    }
}

const addActivity = async(req,res) => {
    let {token, meetingCode} = req.body;
    try{
        let user = await User.findOne({token: token});
        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meetingCode
        });
        
        newMeeting.save();
        return res.status(httpStatus.CREATED).json({message: "Added meeting to the history"});
    }
    catch(e){
        return res.status(httpStatus.NOT_FOUND).json({message: `Somthing went wrong ${e}`});
    }
}


const getAllActivity = async(req,res) => {
    let {token} = req.query;
    try{
        let user = await User.findOne({token: token});
        console.log("backed user token", user.token);
        let meetings = await Meeting.find({user_id: user.username});
        res.json(meetings);
    }
    catch(e){
        res.json({message: `Something went wrong ${e}`});
    }
}

export {login, register, addActivity, getAllActivity};