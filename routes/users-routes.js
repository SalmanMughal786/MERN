const express = require('express');
const { check } = require('express-validator');

const userController = require('../controller/users-controller');
const fileUpload = require('../middleware/file-upload');
const app = express.Router();

app.get('/',userController.getUsers);
app.post('/signup',fileUpload.single('image'),[check('email').normalizeEmail().isEmail()],userController.signup);
app.post('/login',check('password').isLength({min:6}),userController.login);

module.exports = app;