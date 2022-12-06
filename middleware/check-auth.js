const httpError = require("../models/http-error");
const jwt = require('jsonwebtoken');

module.exports = (req,res,next) => {
    if(req.method === 'OPTIONS'){
        return next();
    }
    try{
        const token = req.headers.authorization.split(' ')[1];
        if(!token){
            throw new Error("Something went wrong!");
        }
        const decodedToken = jwt.verify(token,process.env.JWT_KEY);
        req.userData = {userId:decodedToken.userId};
        next();
    }catch(err){
        const error = new httpError('Something went wrong!',500);
        return next(error);
    }
}