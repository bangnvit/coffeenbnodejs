import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import express, { json } from "express";
import cors from "cors";


process.env.GOOGLE_APPLICATION_CREDENTIALS;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

app.use(function(req, res, next) {
  res.setHeader("Content-Type", "application/json");
  next();
});


initializeApp({
  credential: applicationDefault(),
  projectId: 'cafeorder-f666',
});

app.post("/send", function (req, res) {
  const receivedToken = req.body.fcmToken;
  
  const message = {
    notification: {
      title: "Notification",
      body: 'This is a Test Notification'
    },
    token: "f6UaBpO-TGaFxOD3RN5G3U:APA91bERokUDEaFIjCYWdLyR0BXq5Iz0Z8Hh_CBQhqbV58X-TBVZH401vpXZOWDeuiKCPAp_uu_XPfdyPOIge7PTcYe7GxJKxZK0lT2T7IJraKz3pQsY2Et5SEe40yioZiV4AZxz7GdI"
  };
  
  getMessaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: "Successfully sent message",
        token: receivedToken,
      });
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      res.status(400);
      res.send(error);
      console.log("Error sending message:", error);
    });
  
    
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});