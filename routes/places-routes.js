const express = require('express');
const {check} =require('express-validator');

const placeController = require('../controller/places-controller');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

const app = express.Router();

app.get('/:pid',placeController.getPlaceById);

app.get('/user/:uid',placeController.getPlacesByUserId);

app.use(checkAuth);

app.patch('/:pid',[check('title').not().isEmpty(), check('description').isLength({min:5})],placeController.updatePlace);

app.delete('/:pid',placeController.deletePlace);

//check is a method which will validate the data coming from users. use array if want to use multiple checks..
app.post('/',fileUpload.single('image'), [check('title').not().isEmpty(), check('description').isLength({min:5})],placeController.postNewPlace);

module.exports = app;