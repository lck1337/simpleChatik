module.exports = {
    method: "post",
    path: "/account/register",
    execute: async (req, res, next, userService) => {
      const user = await userService.register(req.body.username, req.body.password);
      res.status(user.statusCode).send(user);
    }
  };