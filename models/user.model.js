'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Book = require('./book.model');

const UserSchema = new Schema({
    first_name:  {
        type: String
    },
    last_name:  {
        type: String
    },
    email:  {
        type: String
    },
    password:  {
        type: String
    },
    books: [{ type: Schema.Types.ObjectId, ref: 'Book' }]
})

//const users = mongoose.model('users', UserSchema);

module.exports = mongoose.model('User', UserSchema);
