import Debug from "debug";
const debug = Debug ("TwitterAgent:Scraper");
import { Scraper } from 'agent-twitter-client';

let credentials = {
    "username": process.env.TWITTER_USERNAME,
    "password": process.env.TWITTER_PASSWORD,
    "emailAddress": process.env.TWITTER_EMAIL
}

import fs from 'fs';
let cookieFilePath = `./config/cookies.json`;

const scraper = new Scraper();
let loggedIn = false;

//---------------------------------------------------------------------

async function _MakeCookieStringFromJson () {
    if (!fs.existsSync(cookieFilePath)) {
        debug (`${cookieFilePath} missing. run node savecookies.mjs first.`);
        return null;
    }
    else {
        try {
            debug (`Reading ${cookieFilePath}...`)
            let cookiesStr = fs.readFileSync (cookieFilePath);
            //debug (`Read cookies.json:\n${cookiesStr}`);

            let cookiesArray = JSON.parse (cookiesStr);
            //debug (`cookiesArray: ${JSON.stringify (cookiesArray)}`);

            let cookies = cookiesArray.map(
                (cookie) => {
                    return `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${
                    cookie.path}; ${cookie.secure ? 'Secure' : ''}; ${
                    cookie.httpOnly ? 'HttpOnly' : ''}; SameSite=${cookie.sameSite || 'Lax'}`
                }
            );
            debug (`Made cookie string: ${typeof cookies}\n${JSON.stringify(cookies)}`);
            return cookies;
        }
        catch (err) {
            debug (`ERROR reading/parsing cookies: ${err}`);
            return null;
        }
    }
}

//---------------------------------------------------------------------

async function _Init () {
    credentials = {
        "username": process.env.TWITTER_USERNAME,
        "password": process.env.TWITTER_PASSWORD,
        "emailAddress": process.env.TWITTER_EMAIL
    };
    cookieFilePath = `./config/${credentials.username}_cookies.json`;

    console.log (`_Init starting sign-in for ${credentials.username}...`);

    try {
        debug ("Making cookie string...");
        let cookies = await _MakeCookieStringFromJson ();

        if (cookies !== null) {
            debug ("signing in with cookies");
            await scraper.setCookies (cookies);
            debug ("signed in");
        }
        else {
            debug (`WARNING! No cookies to set! Signing in with username/password (${credentials.username}/${credentials.password})!`);
            await scraper.login (
                credentials.username, 
                credentials.password
            );
            debug ("Detecting cookies after login");
            const cookiesObj = await scraper.getCookies();
            //debug(`Got cookies:\n${JSON.stringify (cookiesObj, null, 4)}`);
            if (cookiesObj) {
                debug (`saving cookies to ${cookieFilePath}`);
                let fd = fs.openSync (cookieFilePath,"w");
                fs.writeSync(fd,JSON.stringify(cookiesObj,null,4));
                debug ("written!");
            }
            else {
                debug ("ERROR!! no cookies were read.");
            }
        }
    
        loggedIn = await scraper.isLoggedIn ();
        debug (`Logged in status: ${loggedIn}`);
        return true; //return loggedIn;
    }
    catch (err) {
        debug (`_Init Error: ${err}`);
        return false;
    }
}

//---------------------------------------------------------------------

function _SimplifyTweets (tlist) {
    let tweets = [];
    for (var i=0; i<tlist.length; i++) {
        let tweet = {
            username: tlist[i].username,
            text: tlist[i].text,
            timestamp: tlist[i].timestamp
        };
        tweets.push (tweet);
    }
    return tweets;
}

//---------------------------------------------------------------------

export async function TwitterAgentScraper (command) {
    try {
        if (!loggedIn) {
            debug ("Scraper not logged in.... retrying once.");
            let ok = await _Init ();
            if (!ok) {
                debug ("scraper isn't functional... request fails.");
                return null;
            }
        }

        let cmd = command.command;
        let arg = command.arg;
        let count = command.count || 0;
        let simplified = command.simplified=="true" ? true : false;

        debug (`starting...\ncmd: ${cmd}, arg: ${arg}, count: ${count}`);

        let tweets = [];

        switch (cmd) {
            case "getLatestTweet":
                tweets = [await scraper.getLatestTweet (arg)];
                debug(`Got tweets:\n${JSON.stringify (tweets, null, 4)}`);
                break;

            case "getTweets":
                for await (const tweet of scraper.getTweets (arg, count)) {
                    tweets.unshift (tweet);
                }
                break;

            case "getTweetsAndReplies":
                for await (const tweet of scraper.getTweetsAndReplies (arg, count)) {
                    tweets.unshift (tweet);
                }
                break;

            case "fetchListTweets":
                tweets = await scraper.fetchListTweets (arg, count);
                if (simplified) {
                    tweets = tweets.tweets; //pull the tweets subfield to the top and toss the cursors
                }
                break;

            case "sendTweet":
                const res = await scraper.sendTweet(arg);
                break;

            default:
                debug (`ERROR: Unsupported command: ${cmd}`);
                tweets = null;
                break;
        }

        if (simplified){
            tweets = _SimplifyTweets (tweets);
        }
        debug(`Got tweets:\n${JSON.stringify (tweets, null, 4)}`);

        return tweets;
    }
    catch (err) {
        debug (`Error: ${err}`);
        return null;
    }
}

//---------------------------------------------------------------------

export async function TwitterAgentShutdown () {
    if (loggedIn) {
        loggedIn = false;
        debug ("Logging out...");
//        await scraper.logout (); //this destroys server side session for cookies (I think...). Don't call it.
        debug ("...logged out.");
    }
}

//await _Init();