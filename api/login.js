module.exports = {
    method: "post",
    path: "/account/login",
    execute: async (req, res, next, userService) => {
      const user = await userService.login(req.body.username, req.body.password);
      res.status(user.statusCode).send(user);
    }
  };