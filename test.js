const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: serviceAccount.databaseURL
});

// Endpoint cho người dùng post lên
app.post("/api/order_new", function (req, res) {
  // Lấy thông tin từ request của người dùng
  const { userEmail, orderId } = req.body;

  // Gửi thông báo đến admin về đơn hàng mới
  getAdminTokensFromFirebase()
    .then(adminTokens => {
      adminTokens.forEach(token => {
        //Tạo message cho từng target token
        const notificationMessage = {
          token: token,
          notification: {
            title: "Đơn hàng mới",
            body: "Bạn có đơn hàng mới,\nID " + orderId + "\nNgười đặt: " + userEmail
          },
          data: {
            typeFor: "1",
            email: userEmail,
            orderId: orderId
          }
        }
        console.log("order_new: title = ", notificationMessage.notification.title);
        console.log("order_new: body = ", notificationMessage.notification.body);
        console.log("order_new: typeFor = ", notificationMessage.data.typeFor);
        console.log("order_new: email = ", notificationMessage.data.email);
        console.log("order_new: orderId = ", notificationMessage.data.orderId);

        sendNotification(notificationMessage);
      });
      res.status(200).json({ message: "Notification sent to admin successfully" });
    })
    .catch(error => {
      console.error("Error getting admin tokens from Firebase:", error);
      res.status(500).json({ error: "Failed to get admin tokens from Firebase" });
    });
});

app.post("/api/order_cancel", function (req, res) {
  // Lấy thông tin từ request của người dùng
  const { userEmail, orderId, reason } = req.body;

  // Gửi thông báo đến admin về đơn hàng bị hủy
  getAdminTokensFromFirebase()
    .then(adminTokens => {
      adminTokens.forEach(token => {
        //Tạo message cho từng target token
        const notificationMessage = {
          token: token,
          notification: {
            title: "Đơn hàng bị hủy",
            body: "Đơn hàng ID " + orderId + " đã bị hủy.\nLý do: " + reason
          },
          data: {
            typeFor: "1",
            email: userEmail,
            orderId: orderId,
            reason: reason
          }
        }
        console.log("order_cancel: title = ", notificationMessage.notification.title);
        console.log("order_cancel: body = ", notificationMessage.notification.body);
        console.log("order_cancel: typeFor = ", notificationMessage.data.typeFor);
        console.log("order_cancel: email = ", notificationMessage.data.email);
        console.log("order_cancel: orderId = ", notificationMessage.data.orderId);
        console.log("order_cancel: reason = ", notificationMessage.data.reason);

        sendNotification(notificationMessage);
      });
      res.status(200).json({ message: "Notification sent to admin successfully" });
    })
    .catch(error => {
      console.error("Error getting admin tokens from Firebase:", error);
      res.status(500).json({ error: "Failed to get admin tokens from Firebase" });
    });
});

// Endpoint cho admin post lên
app.post("/api/order_accept", function (req, res) {
  // Lấy thông tin từ request của admin
  const { userEmail, orderId } = req.body;

  // Gửi thông báo cho người dùng: đơn hàng đã được chấp nhận
  getUserTokensFromFirebase()
    .then(userTokens => {
      userTokens.forEach(token => {
        const notificationMessage = {
          token: token,
          notification: {
            title: "Đơn hàng đã được chấp nhận",
            body: "Đơn hàng ID " + orderId + " đã được chấp nhận"
          },
          data: {
            typeFor: "2",
            email: userEmail,
            orderId: orderId
          }
        }
        console.log("order_accept: title = ", notificationMessage.notification.title);
        console.log("order_accept: body = ", notificationMessage.notification.body);
        console.log("order_accept: typeFor = ", notificationMessage.data.typeFor);
        console.log("order_accept: email = ", notificationMessage.data.email);
        console.log("order_accept: orderId = ", notificationMessage.data.orderId);

        sendNotification(notificationMessage);
      });
      res.status(200).json({ message: "Notifications sent to user and driver successfully" });
    })
    .catch(error => {
      console.error("Error getting user tokens from Firebase:", error);
      res.status(500).json({ error: "Failed to get user tokens from Firebase" });
    });
});

// Cái này nốt công viết thì viết chứ sẽ không được dùng - theo yêu cầu của thầy
app.post("/api/order_refuse", function (req, res) {
  // Lấy thông tin từ request của admin
  const { userEmail, orderId, reason } = req.body;

  // Gửi thông báo cho người dùng: đơn hàng đã bị từ chối
  getUserTokensFromFirebase()
    .then(userTokens => {
      userTokens.forEach(token => {
        const notificationMessage = {
          token: token,
          notification: {
            title: "Đơn hàng đã bị từ chối",
            body: "Đơn hàng ID " + orderId + " đã bị từ chối"
          },
          data: {
            typeFor: "2",
            email: userEmail,
            orderId: orderId,
            reason: reason
          }
        }
        console.log("order_refuse: title = ", notificationMessage.notification.title);
        console.log("order_refuse: body = ", notificationMessage.notification.body);
        console.log("order_refuse: typeFor = ", notificationMessage.data.typeFor);
        console.log("order_refuse: email = ", notificationMessage.data.email);
        console.log("order_refuse: orderId = ", notificationMessage.data.orderId);
        console.log("order_refuse: reason = ", notificationMessage.data.reason);

        sendNotification(notificationMessage);
      });
      res.status(200).json({ message: "Notifications sent to user and driver successfully" });
    })
    .catch(error => {
      console.error("Error getting user tokens from Firebase:", error);
      res.status(500).json({ error: "Failed to get user tokens from Firebase" });
    });
});

app.post("/api/order_send", function (req, res) {
  // Lấy thông tin từ request của admin
  const { userEmail, orderId } = req.body;

  // Cần làm thêm: liên kết bên vận chuyển
  // Hoặc là làm 1 cái bên khác cũng được
  // cái kia gọi xong ok thì xử lý: post đến cái này để thông báo cho người dùng

  // Gửi thông báo cho người dùng: đơn hàng đang được vận chuyển
  getUserTokensFromFirebase()
    .then(userTokens => {
      userTokens.forEach(token => {
        const notificationMessage = {
          token: token,
          notification: {
            title: "Đơn hàng đang vận chuyển",
            body: "Đơn hàng ID " + orderId + " đang được vận chuyển."
          },
          data: {
            typeFor: "2",
            email: userEmail,
            orderId: orderId
          }
        }
        console.log("order_send: title = ", notificationMessage.notification.title);
        console.log("order_send: body = ", notificationMessage.notification.body);
        console.log("order_send: typeFor = ", notificationMessage.data.typeFor);
        console.log("order_send: email = ", notificationMessage.data.email);
        console.log("order_send: orderId = ", notificationMessage.data.orderId);

        sendNotification(notificationMessage);
      });
      res.status(200).json({ message: "Notifications sent to user and driver successfully" });
    })
    .catch(error => {
      console.error("Error getting user tokens from Firebase:", error);
      res.status(500).json({ error: "Failed to get user tokens from Firebase" });
    });
});

// // Endpoint cho tài xế post lên ==== CHÚ Ý: chỗ này cần sửa cả "status" trên Realtime Database luôn bằng server này
// app.post("/api/order_complete", function (req, res) {
//   // Lấy thông tin từ request của tài xế
//   const { orderId, driverEmail } = req.body;

//   // Gửi thông báo cho người dùng về việc đơn hàng đã hoàn thành
//   getUserTokensFromFirebase()
//     .then(userTokens => {
//       userTokens.forEach(token => {
//         // sendNotification(token, "Đơn hàng đã hoàn thành", `Đơn hàng ${orderId} đã hoàn thành`);
//         sendNotification(token, "Đơn hàng đã hoàn thành", `Đơn hàng đã hoàn thành`);
//       });
//       // Gửi thông báo cho admin về việc đơn hàng đã hoàn thành
//       getAdminTokensFromFirebase()
//         .then(adminTokens => {
//           adminTokens.forEach(token => {
//             // sendNotification(token, "Đơn hàng đã hoàn thành", `Đơn hàng ${orderId} đã hoàn thành bởi tài xế ${driverEmail}`);
//             sendNotification(token, "Đơn hàng đã hoàn thành", `Đơn hàng đã hoàn thành`);
//           });
//           res.status(200).json({ message: "Notifications sent to user and admin successfully" });
//         })
//         .catch(error => {
//           console.error("Error getting admin tokens from Firebase:", error);
//           res.status(500).json({ error: "Failed to get admin tokens from Firebase" });
//         });
//     })
//     .catch(error => {
//       console.error("Error getting user tokens from Firebase:", error);
//       res.status(500).json({ error: "Failed to get user tokens from Firebase" });
//     });
// });

// app.post("/api/order_notcomplete", function (req, res) {
//   // Lấy thông tin từ request của tài xế
//   const { orderId, userEmail, reason } = req.body;

//   // Gửi thông báo cho người dùng về việc đơn hàng không hoàn thành
//   getUserTokensFromFirebase()
//     .then(userTokens => {
//       userTokens.forEach(token => {
//         // sendNotification(token, "Đơn hàng không hoàn thành", `Đơn hàng ID ${orderId} của bạn không hoàn thành. Lý do: ${reason}. \nLiên hệ cửa hàng ở phần Liên hệ nếu cần được giải quyết`);
//         sendNotification(token, "Đơn hàng không hoàn thành", `Đơn hàng của bạn không hoàn thành`);
//       });
//       // Gửi thông báo cho admin về việc đơn hàng không hoàn thành
//       getAdminTokensFromFirebase()
//         .then(adminTokens => {
//           adminTokens.forEach(token => {
//             // sendNotification(token, "Đơn hàng không hoàn thành", `Đơn hàng ID ${orderId} đã không hoàn thành bởi ${userEmail}. Reason: ${reason}`);
//             sendNotification(token, "Đơn hàng không hoàn thành", `Có 1 đơn hàng đã không hoàn thành`);
//           });
//           res.status(200).json({ message: "Notifications sent to user and admin successfully" });
//         })
//         .catch(error => {
//           console.error("Error getting admin tokens from Firebase:", error);
//           res.status(500).json({ error: "Failed to get admin tokens from Firebase" });
//         });
//     })
//     .catch(error => {
//       console.error("Error getting user tokens from Firebase:", error);
//       res.status(500).json({ error: "Failed to get user tokens from Firebase" });
//     });
// });


// Hàm gửi thông báo
function sendNotification(notificationMessage) {

  admin.messaging().send(notificationMessage)
    .then((response) => {
      console.log("Notification sent successfully:", response);
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
    });
}

function getAdminTokensFromFirebase() {
  return new Promise((resolve, reject) => {
    const adminTokens = [];
    const usersRef = admin.database().ref("user");
    usersRef.once("value", (snapshot) => {
      snapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        if (userData.type === 1 && userData.fcmtoken) {
          Object.values(userData.fcmtoken).forEach((token) => {
            adminTokens.push(token);
          });
        }
      });
      console.log("Số phần tử trong adminTokens:", adminTokens.length);
      console.log(adminTokens);
      resolve(adminTokens);
    });
  });
}

function getUserTokensFromFirebase() {
  return new Promise((resolve, reject) => {
    const userTokens = [];
    const usersRef = admin.database().ref("user");
    usersRef.once("value", (snapshot) => {
      snapshot.forEach((userSnapshot) => {
        const userData = userSnapshot.val();
        if (userData.type === 2 && userData.fcmtoken) {
          Object.values(userData.fcmtoken).forEach((token) => {
            userTokens.push(token);
          });
        }
      });
      console.log("Số phần tử trong userTokens:", userTokens.length);
      console.log(userTokens);
      resolve(userTokens);
    });
  });
}


app.listen(3006, function () {
  console.log("Server started on port 3006");
});
