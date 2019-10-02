'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('./user.model');


const BookSchema = new Schema({
    bookname: String,
    year: String,
    bookholders: { type: Schema.Types.ObjectId, ref: 'User' }
});

//const books = mongoose.model('books', BookSchema);
module.exports = mongoose.model('Book', BookSchema);