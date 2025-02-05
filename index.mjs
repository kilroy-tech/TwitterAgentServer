// TwitterAgentServer, Copyright Kilroy BC, LLC
// author: cshotton
//
//----- main express.js application that instantiates an API server and prepares for Twitter scraping

import dotenv from 'dotenv';
const doterr = dotenv.config();

import Debug from "debug";
const debug = Debug ("TwitterAgent:index.mjs");
Debug.enable (process.env.DEBUG)

const __dirname = import.meta.dirname;

const HTTP_PORT = process.env.HTTP_PORT || '3300';
const API_PREFIX= '/v1'

import {TwitterAgentShutdown} from './TwitterAgentScraper.mjs';

//---------- Express Router Set-up
import createError from 'http-errors';

import express from 'express';
import * as path from 'path';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import {TwitterAgentRouter} from './TwitterAgentRouter.mjs';

const app = express();

app.use (morgan('tiny'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.text());
//app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//hook the TwitterAgent APIs into express
app.use(API_PREFIX, TwitterAgentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


//---------- HTTP Server Set-up  -------------------------
import * as http from 'http';

var port = normalizePort(process.env.PORT || HTTP_PORT);
app.set('port', port);

var server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

  // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            debug(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            debug(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

let stopping = false;
async function terminationHandler (options, err) {
    debug (`\ntermination ${JSON.stringify (err)}`);
    if (err == "SIGINT" && !stopping) {
        stopping = true;
        debug ("Shutting down...");
        await TwitterAgentShutdown ();
        debug ("All done!");
        process.exit();
    }
    else {
        debug ("...more shutdown....");
        process.exit();
    }
}

//process.on ('exit', terminationHandler.bind (null, {cleanup: true}));
// control-C
process.on( 'SIGINT', terminationHandler.bind (null, {exit:true}));
