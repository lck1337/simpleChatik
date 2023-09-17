module.exports = {
    method: "get",
    path: "/chatHistory/:chatId",
    execute: async (req, res, next, userService) => {
    const chatId = req.params.chatId;
    const jwtToken = req.headers.jwttoken;
    const user = await userService.getHistoryChat(jwtToken, chatId);
    res.status(user.statusCode).send(user);
    }
  };