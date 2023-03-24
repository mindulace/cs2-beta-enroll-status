import SteamUser from "steam-user";
import GlobalOffensive from "globaloffensive";
import { readRefreshToken } from "./utils/token.js";
import http from "http";
import * as dotenv from 'dotenv';

dotenv.config();

const BETA_ENROLL_MESSAGE_TYPE = 9217;

const client = new SteamUser();
const csgo = new GlobalOffensive(client);

const refreshToken = readRefreshToken();

if (!refreshToken) {
  console.error("No refresh token found. Please run `npm run login` first.");
  process.exit();
}

client.logOn({
  refreshToken,
});

client.on("loggedOn", () => {
  console.log("Logged into Steam successfully.");
  client.setPersona(SteamUser.EPersonaState.Online);
  client.gamesPlayed([730]);
});

client.on("error", (err) => {
  console.error("An error occurred:", err);
});

csgo.on("connectedToGC", () => {
  console.log("Connected to CS:GO Game Coordinator.");
});

client.on("receivedFromGC", (appid, messageType) => {
  console.log(`[message] ${appid}, ID: ${messageType}`);
  if (messageType == BETA_ENROLL_MESSAGE_TYPE) {
    console.warn(`[message] ${userName} RECEIVED BETA INVITE`);
    sendNotification();
  }
});

csgo.on("disconnectedFromGC", (reason) => {
  console.error("Disconnected from CS:GO Game Coordinator. Reason:", reason);
});

setTimeout(() => {
  client.logOff();
}, 30000);

function sendNotification() {
  if (process.env.WEBHOOK_PATH) {
    var urlparams = {
      host: 'maker.ifttt.com', //No need to include 'http://' or 'www.'
      port: 80,
      path: process.env.WEBHOOK_PATH,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json', //Specifying to the server that we are sending JSON 
      }
    };
  
    var request = http.request(urlparams, onResponse); //Create a request object.
    request.write(""); //Send off the request.
    request.end(); //End the request.
  }
}

function onResponse(response) {
  var data = '';

  response.on('data', function(chunk) {
      data += chunk; //Append each chunk of data received to this variable.
  });
  response.on('end', function() {
      console.log(data); //Display the server's response, if any.
  });
}