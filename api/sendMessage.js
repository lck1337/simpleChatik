const multer = require('multer');
const upload = multer();

module.exports = {
    method: "post",
    path: "/chat/sendmessage",
    execute: async (req, res, next, userService, socketIO) => {

        upload.single('image')(req, res, async (err) => {
            if (err) {
              return res.status(400).json({status: "error", msg: "Сообщение не создалось"});
            }

            const jwtToken = req.headers.jwttoken;
            const chatId = req.body.chatId;
            const message = req.body.message || null;
            const image = req.file || null;
            console.log(image);
      
            const user = await userService.sendMessage(jwtToken, chatId, message, image, socketIO);
             res.status(user.statusCode).send(user);
          });

    }
  };