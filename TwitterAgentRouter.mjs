import Debug from "debug";
const debug = Debug ("TwitterAgent:Router");
import express from 'express';
import {TwitterAgentScraper} from './TwitterAgentScraper.mjs';

function MakeResponse(success, args, errors) {
    let resp = {};
    resp.success = success;
    resp.args = args;
    resp.errors = errors;
    return resp;
}

//-------------------------
// /info

function APIInfo (req, res, next) {
    //simple page for info about the server and a health check endpoint for docker
    res.render('info', { title: 'Twitter Agent Router Info' });
}

//-------------------------
//  curl -XPOST -i -H "Content-type: text/plain" --data "I think it is time for some serious business" http://localhost:3300/v1/sendTweet

function APIPost (req, res, next) {
    const cmd = {
        command: "sendTweet",
        arg: req.body,
        count: 0,
        simplified: false
    };
    debug(`cmd: ${JSON.stringify(cmd)}\nreq.body: ${JSON.stringify(req.body)}`);
    const args = TwitterAgentScraper (cmd);
    res.send (MakeResponse (true, args, {}));
}

//-------------------------
// /command

async function APIDoCommand (req, res, next) {
    debug (`command:\n${JSON.stringify (req.params, null, 4)}`);
    let args = await TwitterAgentScraper (req.params);
    let err = {};
    if (args == null) {
        err.msg="Bad request. No results returned.";
    }
    res.send (MakeResponse (true, args, err));
}

const TwitterAgentRouter = express.Router();

TwitterAgentRouter.get('/info', APIInfo);
TwitterAgentRouter.post('/sendTweet', APIPost);
TwitterAgentRouter.get('/:command/:arg/:count?/:simplified?', APIDoCommand);

export {TwitterAgentRouter};