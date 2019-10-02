'use strict'

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Joi = require('joi');

const User = require('../models/user.model');
const Book = require('../models/book.model');

process.env.SECRET_KEY = 'secret';

const schema = {
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
    password: Joi.string().regex(/^[a-zA-Z0-9]{6,16}$/).min(6).required()
};

module.exports = [
    //Register user
    {
        method: 'POST',
        path: '/register',
        handler: async function (request, h) {
            const {error} = Joi.validate(request.payload, schema);
            if (error) return h.response(error.details[0].message).code(400);

            const user = new User ({
                first_name: request.payload.first_name,
                last_name: request.payload.last_name,
                email: request.payload.email,
                password: request.payload.password
            });
            try{
                const savedUser = await user.save();
                console.log(savedUser);
                return h.response('User created!').code(201);
            }
            catch(err){
                return h.response('User not created').code(500);
            }
        }
    },
    
    //Login user
    {
        method: 'POST',
        path: '/login',
        handler: async function (request, h) {
            return User.findOne({
                email: request.payload.email
            })
                .then(user => {
                    if (user) {
                        if (bcrypt.compareSync(request.payload.password, user.password)) {
                            const payload = {
                                id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                                email: user.email
                            }

                            let token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: 1440 })
                            return token;
                        }
                        else {
                            return h.response('User does not exist!').code(404);
                        }
                    }
                    else {
                        return h.response('User does not exist!').code(404);
                    }
                })
                .catch(err => {
                    return h.response(err).code(500);
                })
        }
    },
    
    //Add user
    {
        method: 'POST',
        path: '/add',
        options: {
            validate: {
                payload: {
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    email: Joi.string().email({ minDomainAtoms: 2 }).required(),
                    password: Joi.string().regex(/^[a-zA-Z0-9]{6,16}$/).min(6).required()
                },
                failAction: (request, h, error) => {
                    return error.isJoi ? h.response(error.details[0]).takeover() : h.response(error).takeover();
                }
            }
        },
        handler: async function (request, h) {
            var decoded = jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            return User.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(decoded.id),
            })
                .then(user => {
                    if (user) {
                        let newUser = new User(request.payload); 
                        let result = newUser.save();
                        return (result);
                    } else {
                        return h.response('User is not authenticated!').code(401);
                    }
                })
                .catch(err => {
                    return h.response(err).code(500);
                })
            }
        },
    
    //View profile
    {
        method: 'GET',
        path: '/profile',
        handler: async function (request, h) {
            var decoded = jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )

            return User.findOne({
                _id: mongoose.Types.ObjectId(decoded.id)
            })
                .then(user => {
                    if (user) {
                        return user //We will do something more when I will develop front end also
                    } else {
                        return h.response('User does not exist!').code(404);
                    }
                })
                .catch(err => {
                    return h.response(err).code(500);
                })
            }
        },
            
    
    //Create new user and add
    {
        method: 'POST',
        path: '/createUser',
        options: {
            validate: {
                payload: {
                    first_name: Joi.string().required(),
                    last_name: Joi.string().required(),
                    email: Joi.string().email({ minDomainAtoms: 3 }).required(),
                    password: Joi.string().regex(/^[a-zA-Z0-9]{6,16}$/).min(6).required()
                },
                failAction: (request, h, error) => {
                    return error.isJoi ? h.response(error.details[0]).takeover() : h.response(error).takeover();
                }
            }
        },
        handler: async function (request, h) {
            var decoded = jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            return User.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(decoded.id),
            })
                .then(user => {
                    if (user) {
                        let newUser = new User(request.payload); 
                        let result = newUser.save();
                        return (result);
                    } else {
                        return h.response('User is not authenticated').code(401);
                    }
                })
                .catch(err => {
                    return h.response(err).code(500);
                })
        }
    },
    
    //Create new book
    {
        method: 'POST',
        path: '/createBook',
        options: {
            validate: {
                payload: {
                    bookname: Joi.string().required(),
                    year: Joi.string().required()
                },
                failAction: (request, h, error) => {
                    return error.isJoi ? h.response(error.details[0]).takeover() : h.response(error).takeover();
                }
            }
        },
        handler: async function (request, h) {
            const book = new Book(request.payload);
            let result = book.save();
            return (result);
        }
    },
    
    //Add book to a user
    {
        method: 'POST',
        path: '/addBooktoUser',
       handler: async function (request, h) {
        jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            const userID = request.query.userID;
            const bookID = request.query.bookID;
            
            return Book.findByIdAndUpdate(bookID, { $push: { bookholders: userID } })
            .then(book => {
                if (!book){
                    return h.response('Book not found').code(404);
                }
                else{
                    return User
                    .findByIdAndUpdate(userID, { $push: { books: bookID } })
                    .then (user => {
                        if (!user) {
                            return Book.findByIdAndUpdate(bookID, {$pull: {bookholders: userID}})
                            .then (book => {
                                return h.response('User not found').code(404);
                            })
                            .catch(err => {
                                return err;
                            })
                        }
                        else {
                            return h.response('Book added successfully').code(200);
                        }
                    })
                }
            })
        }
    },
    
    //Get all books of a user
    {
        method: 'GET',
        path: '/books',
        handler: async function (request, h) {
            var decoded = jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            return User.findOne({
                _id: mongoose.Types.ObjectId(decoded.id),
            })
            
            .populate('books')
            .then(user => {
                 if (!user) {
                     return h.response('User not found').code(404);
                    } else {
                        console.log(user.books);
                        return (user.books);
                    }
                })
                .catch(err => {
                    return 'error ' + err
                })
            }
        },      
        
    //Delete book to a user
    {
        method: 'DELETE',
        path: '/deleteBookfromUser',
        handler: async function (request, h) {
        jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            const userID = request.query.userID;
            const bookID = request.query.bookID;

            return Book.findByIdAndUpdate(bookID, { $pull: { bookholders: userID } })
            .then(book => {
                if (!book){
                    return h.response('Book not found').code(404);
                }
                else{
                    return User
                    .findByIdAndUpdate(userID, { $pull: { books: bookID } })
                    .then (user => {
                        if (!user) {
                            return Book.findByIdAndUpdate(bookID, {$push: {bookholders: userID}})
                            .then (book => {
                                return h.response('User not found').code(404);
                            })
                            .catch(err => {
                                return err;
                            })
                        }
                        else {
                            return h.response('Book deleted successfully').code(200);
                        }
                    })
                }
            })

        }
    },

    //Delete book
    {
        method: 'DELETE',
        path: '/deleteBook',
        handler: async function (request, h) {
        jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            const bookID = request.query.bookID;

            return Book
            .findById(bookID)
            .then( book => {
                if(!book) {
                    return 'Book not found'
                }
                else{
                    User.update({ }, {$pull: {books: bookID}}, {multi:true})
                    return Book.findByIdAndDelete(bookID)
                }
            })
            .catch (err => {
                return err
            })
        }
    },

    //Delete user
    {
        method: 'DELETE',
        path: '/deleteUser',
        handler: async function (request, h) {
        jwt.verify(
                request.headers.authorization,
                process.env.SECRET_KEY
            )
            const userID = request.query.userID;
    
            return User
            .findById(userID)
            .then( user => {
                if(!user) {
                    return 'User not found'
                }
                else{
                    Book.update({ }, {$pull: {bookholders: userID}}, {multi:true})
                    return User.findByIdAndDelete(userID)
                }
            })
            .catch (err => {
                return err
            })
        }
    }];

    
                  
    
        
                    
            
        
   
    
                
            
        
    
    
               
                
            
        
    
            
        
        
    
      
        

               
            

            
        
        
                    
                
   



