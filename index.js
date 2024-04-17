const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
// require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// $env:GOOGLE_APPLICATION_CREDENTIALS="D:\Mobile\KotlinAndroid\DATN\coffeenbnode\cafeorder-f666-firebase-adminsdk-zanc5-03db1fdb0e.json"

// const serviceAccount = require("D:\Mobile\KotlinAndroid\DATN\coffeenbnode\cafeorder-f666-firebase-adminsdk-zanc5-03db1fdb0e.json");
const serviceAccount = require("D:\\Mobile\\KotlinAndroid\\DATN\\coffeenbnode\\cafeorder-f666-firebase-adminsdk-zanc5-03db1fdb0e.json");

// console.log("projectId: ", serviceAccount.project_id);
// console.log("clientEmail: ", serviceAccount.client_email);
// console.log("privateKey: ", serviceAccount.private_key);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.post("/send", function (req, res) {
  const receivedToken = req.body.fcmToken;
  
  const message = {
    notification: {
      title: "Notification",
      body: 'This is a Test Notification'
    },
    token: receivedToken // Đây là token FCM bạn muốn gửi thông báo đến
  };
  
  admin.messaging()
    .send(message)
    .then((response) => {
      res.status(200).json({
        message: "Successfully sent message",
        token: receivedToken,
      });
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      res.status(400).json({ error: error.message });
      console.log("Error sending message:", error);
    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
