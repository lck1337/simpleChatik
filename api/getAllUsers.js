module.exports = {
    method: "get",
    path: "/getAllUsers",
    execute: async (req, res, next, userService) => {
    const jwtToken = req.headers.jwttoken;
    const user = await userService.getAllUsers(jwtToken);
    res.status(user.statusCode).send(user);
    }
  };