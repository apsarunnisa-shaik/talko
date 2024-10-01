import httpStatus from "http-status";
import {User} from "../models/user.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.js";

const login = async(req, res) => {
    const {userName, password} = req.body;
    if(!userName || !password){
        return res.status(httpStatus[400]).json({message: "Provide userName and Password"}); //bad req
    }

    try{
        //check the user exsistance
        const user = await User.findOne({userName});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User Not Found!"});
        }
        // if exists, decrpt the password to compare with actual password (return true or false)
        let isPassword = await bcrypt.compareSync(password, user.password); 
        if(isPassword){
            let token = crypto.randomBytes(20).toString('hex'); //generate token of 40-character hexadecimal string(1btye = 2 hexa char)
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token:token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({message: "Invalid Password or Username"});
        }
    }catch (e){
        return res.status(httpStatus[500]).json({message: `Error: Something went wrong ${e}`});
    }
}


const register = async(req,res) => {
    const {name, userName, password} = req.body;
    try{
        const exsitingUser = await User.findOne({userName});
        if(exsitingUser){
            return res.status(httpStatus.CONFLICT).json({message: "User already Exists"});
        }

        // new user hash password & add user to db
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name,
            userName: userName,
            password: hashedPassword
        });
        await newUser.save();
        return res.status(httpStatus.CREATED).json({message: "User Registered Succesfully"});
    }catch(e){
        return res.status(httpStatus[404]).json({message: `Error: Somthing went wrong ${e}`});
    }
}

const addActivity = async(req,res) => {
    let {token, meeting_code} = req.body;
    try{
        let user = User.findOne({token: token});
        const newMeeting = new Meeting({
            user_id: user.userName,
            meeting_code: meeting_code
        });

        newMeeting.save();
        return res.status(httpStatus.CREATED).json({message: "Added meeting to the history"});
    }
    catch(e){
        return res.status(httpStatus.NOT_FOUND).json({message: `Somthing went wrong ${e}`});
    }
}

const getAllActivity = async(req,res) => {
    let {token} = req.body;
    try{
        let user = User.findOne({token: token});
        let meetings = Meeting.find({user_id: user.userName});
        res.json(meetings);
    }
    catch(e){
        res.json({message: `Something went wrong ${e}`});
    }
}

export {login, register, addActivity, getAllActivity};