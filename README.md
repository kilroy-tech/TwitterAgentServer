# TwitterAgentServer
Simple RESTful API for apps to call for Twitter scraping services

TwitterAgentServer is a straightforward express.js application that is designed as a friendly wrapper around the 
[agent-twitter-client](https://github.com/elizaOS/agent-twitter-client) library. It presents simple REST API endpoints
that can be called to perform common operations with the Twitter client API.

You will need to have an active Twitter account and use its username and password with this application for it to be able to 
interact with Twitter.

## Installing and Using TwitterAgentServer

### Using node.js version 20 or higher:
  * clone this repository
  * npm install
  * create a .env file with the necessary environment variables or pass them on the command line
  * npm start

### Using Docker and Docker Compose
  * instructions TBD (Docker version coming soon!)

### .env File Format and Environment Variables
  * ```TWITTER_USERNAME``` - set to your Twitter ID (not email, not real name)
  * ```TWITTER_PASSWORD``` - set to your Twitter account's password
  * ```HTTP_PORT``` - the TCP/IP port for the server to listen on. Defaults to 3300
  * ```DEBUG``` - optional, setting to ```'TwitterAgent:*'``` will enable debugging messages in the console

### Using TwitterAgentServer
Once the server is running, you can connect to it from any HTTP client. The server will attempt to use cookie data from its cache
if present. If not, it will attempt to authenticate with the username/password provided, and then extract the cookies from the 
session for future use. Cookies are stored in the local ```./config``` directory, in a file named ```username_cookies.json```, where
"username" matches the authenticated Twitter user.

### API Endpoints
  All API endpoint commands case-sensitive, are accessed via HTTP GET requests, and with 2 exceptions are of the form:

  ```/v1/command/arg/count/simple_flag```

  ```/v1``` is the path to the current version of the API.

  ```command``` is the name of the endpoint function being invoked. Command can be one of:

    * getLatestTweet
    * getTweets
    * getTweetsAndReplies
    * fetchListTweets

  ```count``` for commands that require a count, a numeric value. If omitted or skipped, '-' may be used.

  ```simple_flag``` is a boolean (true/false) that indicates whether a very simple JSON representation of tweets is to be returned or if the full results from Twitter will be generated. Defaults to false, returning full JSON.

  There are two additional endpoints:

  ```/v1/info``` returns basic info about the server version and links to docs

  ```/v1/sendTweet``` is a HTTP POST endpoint that accepts a text/plain body containing the text of a Tweet to post to Twitter


## Examples of Use

The following ```curl``` commands illustrate how to use the various API endpoints:

| Command | curl syntax |
| -------- | -------- |
| **getLatestTweet** - Gets the most recent tweet as full JSON from Tastykake| ```curl http://localhost:3300/v1/getLatestTweet/Tastykake``` |
| **getTweets** - Gets the last 3 tweets from b05crypto | ```curl http://localhost:3300/v1/getTweets/b05crypto/3``` |
| **getTweetsAndReplies** - Gets 5 tweets and replies from Tastykake in simplified JSON format | ```curl http://localhost:3300/v1/getTweetsAndReplies/Tastykake/5/true``` |
| **fetchListTweets** - Fetch first page of tweets from the list (Sonic) in simple JSON form | ```curl http://localhost:3300/v1/fetchListTweets/1491981766466293761/1/true``` |
| **sendTweet** - POST request to send the text as a tweet | ```curl -XPOST -i -H "Content-type: text/plain" --data "Hello World!" http://localhost:3300/v1/sendTweet``` |
| **info** - Retrieves basic server info. Can be used for health checks.| ```curl http://localhost:3300/v1/info``` |

## Contributing
While this application was designed initially to provide an easy interface between the Kilroy automation platform and Twitter, it's available for use by anyone needing a simple REST API for interacting with Twitter. If you have suggestions, issues, or enhancements, please contribute
to this Github project.
