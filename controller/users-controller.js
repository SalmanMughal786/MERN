const { validationResult } = require('express-validator');
const httpError = require('../models/http-error');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getUsers = async (req,res,next)=>{
    let users;
    try{
        users = await User.find({},'-password');
    }catch(err){
        return next(new httpError("Something went wrong",500));
    }
    res.json({users:users.map(user=>{
        return user.toObject({getters:true});
    })});
};

const signup = async (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new httpError("Please Enter valid Email!",422));
    }
    const {name, email, password} = req.body;
    let isUserExist;
    try{
        isUserExist = await User.findOne({email:email});
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    if(isUserExist){
        return next(new httpError("User Alrady Exist",500));
    }
    let hashPassword;
    try{
        hashPassword = await bcrypt.hash(password,12);
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    const newUser = new User({
        name,
        email,
        password:hashPassword,
        image:req.file.path,
        places:[]
    });
    try{
        await newUser.save();
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    let token;
    try{
        token = jwt.sign({userId:newUser.id, email:newUser.email},process.env.JWT_KEY,{expiresIn:'1h'})
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    res.status(201).json({userId:newUser.id, email:newUser.email, token:token});
};

const login = async (req,res,next)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return next(new httpError("Please Enter valid Password!",422));
    }
    const {email, password} = req.body;
    let isUserExist;
    try{
        isUserExist = await User.findOne({email:email});
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    if(!isUserExist){
        return next(new httpError("Invalid user name or password",401));
    }
    isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password,isUserExist.password);
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    if(!isValidPassword){
        const error = new httpError("Invalid Password!",401);
        return next(error);
    }
    let token;
    try{
        token = jwt.sign({userId:isUserExist.id, email:isUserExist.email},process.env.JWT_KEY,{expiresIn:'1h'})
    }catch(err){
        const error = new httpError("Spmething is wrong!",500);
        return next(error);
    }
    res.status(201).json({userId:isUserExist.id, email:isUserExist.email, token:token});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;