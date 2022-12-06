const {validationResult} = require('express-validator');
const mongoose = require('mongoose');
const httpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');
const fs = require('fs');

const getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid;
    let place;
    try{
      place = await Place.findById(placeId);
    }catch(error){
      const err = new httpError('Something is Wrong while fetching Place!.',500);
      return next(err);
    }
    if(!place){
      const err = new httpError('Could not find a place for the provided id.',404);
      return next(err);
    }
    res.json({place:place.toObject({getters:true})});
};

const getPlacesByUserId = async (req,res,next)=>{
    const userId = req.params.uid;
    let userPlaces;
    try{
      userPlaces = await User.findById(userId).populate('places');
    }catch(error){
      return next(new httpError('Something is Wrong while fetching Place!.',500));
    }
    if(!userPlaces){
        return next(new httpError('Could not find a place for the provided user id.',404));
    }
    res.json({userPlaces:userPlaces.places.map((place)=>{
      return place.toObject({getters:true});
    })});
};

const postNewPlace = async (req,res,next)=>{
  const error = validationResult(req);
  if(!error.isEmpty()){
    return next(new httpError("Invalid Data Entered by User",422));
  }
  const {title, description, address} = req.body;
  const createPlace = new Place({
    title,
    description,
    image:req.file.path,
    address,
    location:{
      lat: 40.7484405,
      lng: -73.9878584
    }, 
    creator:req.userData.userId
  });

  let user;
  try{
    user = await User.findById(req.userData.userId);
  }catch(err){
    const error = new httpError("Something is wrong!",500);
    return next(error);
  }

  if(!user){
    const error = new httpError("User NOt Found!",404);
    return next(error);
  }

  try{
    const sess = await mongoose.startSession();
    await sess.startTransaction();
    await createPlace.save({session:sess});
    user.places.push(createPlace);
    await user.save({session:sess});
    await sess.commitTransaction();
  }catch(error){
    return next(new httpError("Error while entering new Place!",201));
  }
  res.json({createPlace});
};

const updatePlace = async (req,res,next)=>{
  const error = validationResult(req);
  if(!error.isEmpty()){
    return next(new httpError("Invalid Data Entered by User",422));
  }
  const placeId = req.params.pid;
  const {title, description} = req.body;
  let place;
  try{
    place = await Place.findById(placeId);
  }catch(err){
    const error = new httpError("Something is wrong!",500);
    return next(error);
  }
  if(!place){
    const error = new httpError("No Data Found at " + placeId,500);
    return next(error);
  }
  if(place.creator.toString() !== req.userData.userId){
    const error = new httpError('You are not allowed to edit this Place',401);
    return next(error);
  }
  place.title = title;
  place.description = description;
  try{
    await place.save();
  }catch(err){
    const error = new httpError("Something is wrong!",500);
    return next(error);
  }
  res.status(200).json({place:place.toObject({getters:true})});
};

const deletePlace = async (req,res,next)=>{
  const placeId = req.params.pid;
  let place;
  try{
    place = await Place.findById(placeId).populate('creator');
  }catch(err){
    const error = new httpError("Something is wrong!",500);
    return next(error);
  }
  if(!place){
    const error = new httpError("No Data Found at " + placeId,500);
    return next(error);
  }
  if(place.creator.id !== req.userData.userId){
    const error = new httpError('You are not allowed to edit this Place',401);
    return next(error);
  }
  const imagePath = place.image;
  try{
    const sess = await mongoose.startSession();
    await sess.startTransaction();
    await place.remove({session:sess});
    place.creator.places.pull(place);
    await place.creator.save({session:sess});
    await sess.commitTransaction();
  }catch(err){
    const error = new httpError("Something is wrong!",500);
    return next(error);
  }
  fs.unlink(imagePath,err=>{
    console.log(err);
  })
  res.status(200).json("Delete Data Successfully!");
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.postNewPlace = postNewPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;