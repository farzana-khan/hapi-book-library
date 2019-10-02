'use strict'

const Hapi = require('hapi');
const mongoose = require('mongoose');

const Inert = require('inert');
const Vision = require('vision');

const route = require('./routes/users');

const server = new Hapi.server({
    host: 'localhost',
    port: 3000,
    routes: {
        cors: true
    }
})


mongoose.connect('mongodb+srv://farzanakhan:mongodb@test-muyxp.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }, (err) => {
    if (!err) { console.log('MongoDB Connection Succeeded.') }
    else { console.log(`Error in DB connection : ${err}`)}
});


const init = async() => {
    
    server.route(route);
    await server.start()
    console.log('Server running on %s', server.info.uri);
}

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();