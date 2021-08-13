const express = require("express");
const app = express();
const cors = require("cors");
const jwtDecode = require("jwt-decode");
const admin = require("firebase-admin");
const serviceAccount = require("./sso_config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-sso-15468-default-rtdb.asia-southeast1.firebasedatabase.app",
});
app.use(express.json());
app.use(cors());

async function getCustomTokenForUser(userCredentials) {
  console.log(userCredentials);
  const customToken = await admin.auth().createCustomToken(userCredentials);
  return customToken;
}

async function generateCustomTokenFromMsToken(msToken) {
  const msDetails = jwtDecode(msToken);
  try {
    const userCredentials = await admin.auth().getUserByEmail(msDetails.upn);
    const customToken = await getCustomTokenForUser(userCredentials.uid);
    return customToken;
  } catch (err) {
    console.log("cannot find the user", err);
    try {
      const userCredentials = await admin.auth().createUser({
        displayName: msDetails.name,
        email: msDetails.upn,
      });
      const customToken = await getCustomTokenForUser(userCredentials.uid);
      return customToken;
    } catch (err) {
      console.log("cannot create or find the user", err);
      return null;
    }
  }
}

app.post("/", (req, res) => {
  //I haven't verified the token, which is needed to be done I guess.....
  const msToken = req.body.token;
  generateCustomTokenFromMsToken(msToken).then((customToken) => {
    if (customToken === null) {
      //handle the case where this error has occurred....
      console.log("custom token is null");
      res.send("error has occurred");
    }
    res.send(customToken);
  });
});

app.get("/", (rew, res) => {
  res.send("working fine completley");
});

app.listen(5000, () => {
  console.log("server start on port 5000");
});
