const fs = require('fs');

module.exports = {
    method: "get",
    path: "/image/:chatId/:hash",
    execute: async (req, res, next, userService) => {
    const chatId = req.params.chatId;
    const jwtToken = req.headers.jwttoken;
    const hash = req.params.hash;
    const filePath = `./images/${chatId}/${hash}.png`;
  
    const user = await userService.getImageAccess(jwtToken, chatId, hash);
    if(user) res.status(user.statusCode).send(user);
  
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    }
  };