module.exports = {
    method: "get",
    path: "/chat/:chatId",
    execute: async (req, res, next, userService) => {
    const chatId = req.params.chatId;
    const jwtToken = req.headers.jwttoken;
    const user = await userService.getChatByID(jwtToken, chatId);
    res.status(user.statusCode).send(user);
    }
  };