const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
require('dotenv').config();
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const axios = require('axios');
const port = 3006;

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
  console.log("================order_new=================")
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
            body: "Đơn hàng ID " + orderId + " đã bị từ chối.\nLý do: "+ reason
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

app.get("/success", (req, res) => {
  return res.status(200).json({
      message: "Success"
  })
})

// Testing...
app.post("/api/momo_qr", async (req, res) => {

  console.log("================momo_qr=================")
  const { orderId, totalPrice} = req.body;
  // const { totalPrice } = req.body;

  const accessKey = 'F8BBA842ECF85';
  const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const orderInfo = 'Pay with MoMo';
  const partnerCode = 'MOMO';
  const redirectUrl = 'http://192.168.0.101:3006/api/redirectUrl/result';
  const ipnUrl = 'http://192.168.0.101:3006/api/ipnUrl/result';
  // const requestType = "payWithATM"; // Thanh toán bằng thẻ ATM
  const requestType = "captureWallet"; // Quét mã QR bằng momo
  const amount = totalPrice;
  const newOrderId = 'MM' + orderId; // lấy từ req.body rồi
  const requestId = newOrdearId;
  console.log("totalPrice: ", totalPrice)
  console.log("orderId posted: ", orderId)
  console.log("newOrderId: ", newOrderId)
  const extraData = '';
  const paymentCode = 'T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==';
  const orderGroupId = '';
  const autoCapture = true;
  const lang = 'vi';
  const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + newOrderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;
  const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
  const requestBody = {
      partnerCode: partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: newOrderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature
  };
  const response = await axios.post("https://test-payment.momo.vn/v2/gateway/api/create", requestBody)
  console.log(response.data);
  console.log("----------------------");
  // return res.redirect(response.data.payUrl);
  return res.redirect(response.data.qrCodeUrl);

  // return res.status(200).json(response.data);
});

// MoMo đã thanh toán xong trả về, dựa vào resultCode = 0 (thành công) để:
// Sửa status đơn orderId
// lấy email từ orderId, tự động post cái đơn mới 
app.get("/api/redirectUrl/result", (req, res) => {
  const requestUrl = req.url; // Lấy URL từ request
  console.log("result-requestUrl: ", requestUrl);
  const myURL = new URL('http://192.168.0.101:3006' + requestUrl); // Tạo một đối tượng URL
  console.log("result-myURL: ", myURL);

  const searchParams = myURL.searchParams; // Lấy các tham số truy vấn của URL
  console.log("result-searchParams: ", searchParams);
  const resultCode = searchParams.get('resultCode'); // Lấy giá trị của 'resultCode' từ query params
  console.log("result-resultCode: ", resultCode);
  const orderIdGeted = searchParams.get('orderId');
  console.log("result-orderIdGeted: ", orderIdGeted);
  let orderIdNumber = orderIdGeted.substring(2); // Lấy từ vị trí thứ 2 trở đi

  console.log(orderIdNumber); // Ví dụ orderIdGeted = "MM1714113143666" => orderIdNumber ="1714113143666" (cấu trúc MM + OrderID từ app)

  if(resultCode == 0) {
    const bookingRef = admin.database().ref("booking");
    // Sửa trạng thái trên Firebase Realtime Database: Trong node "booking" có id node con là orderIdNumber, hãy sửa "status" = 30 cho node có id orderIdNumber.
    bookingRef.child(orderIdNumber).update({
        status: 30
    }, (error) => {
        if (error) {
            // Xử lý lỗi nếu có
            console.log("Error updating status: ", error);
        } else {
            // Thành công
            console.log("Status updated successfully.");

            // Lấy Email từ mã đơn hàng và gửi thông báo đến admin về đơn hàng mới
            bookingRef.once('value', (snapshot) => {
              snapshot.forEach((childSnapshot) => {
                  // Lấy id của mỗi nút con
                  const bookingId = childSnapshot.key;
          
                  // Kiểm tra xem orderIdNumber trùng với id của nút con không
                  if (orderIdNumber === bookingId) {
                      // Nếu trùng, lấy dữ liệu của nút con
                      const bookingData = childSnapshot.val();
          
                      // Kiểm tra xem có tồn tại trường email trong dữ liệu của nút con không
                      if (bookingData && bookingData.email) {
                          // Nếu tồn tại, lấy địa chỉ email
                          const email = bookingData.email;
          
                          // Tiếp tục xử lý với địa chỉ email này, ví dụ gửi thông báo đến admin
                          const adminNotiNewOrderEndpoint = "http://192.168.0.101:3006/api/order_new";
                          const requestBody = {
                              userEmail: email,
                              orderId: orderIdNumber
                          };
          
                          // Gửi yêu cầu POST đến endpoint
                          axios.post(adminNotiNewOrderEndpoint, requestBody)
                              .then(response => {
                                  console.log("Notification sent to admin successfully");
                              })
                              .catch(error => {
                                  console.error("Error sending notification to admin:", error);
                              });
                      } else {
                          console.error("Email not found in booking data");
                      }
          
                      // Kết thúc vòng lặp nếu đã tìm thấy orderIdNumber trong danh sách booking
                      return true;
                  }
              });
          });


        }
    });
  }
  
  return res.status(200).json({
      message: "RedirectUrl Success"
  })
});


app.get("/api/ipnUrl/result", (req, res) => {
  return res.status(200).json({
      message: "IpnUrl Success"
  })
})


app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
}).on('error', (err) => {
  console.log(err);
});
