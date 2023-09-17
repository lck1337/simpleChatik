const { Server } = require("socket.io");

module.exports = class socketIO {
    constructor(data) {
        this.io = new Server(data.server, {
            cors: {
            origin: '*',
          }
        });
        this.userService = data.userService;
        this.db = data.database;
        this.init();
    }

    newMessage(chatid, message, image, username) {
        this.io.to(chatid).emit('new_message', {message, username, image});
    }

    init() {
        this.io.on('connection', (socket) => this.connected(socket));
    }

    async verifyValidSession(jwtToken) {
        const jwtData = await this.userService.verifyToken(jwtToken);

        if (!jwtData) return null;

        if (!(await this.userService.verifyVersion(jwtData))) return null;

        return jwtData;
    }

    async connected(socket) {
        try {
            const jwtToken = socket.handshake.auth.token;
            const jwtData = await this.verifyValidSession(jwtToken);
            if (!jwtData) {
                 socket.emit('authentication_error', 'Invalid user version');
                 return socket.disconnect(true);
            }

            socket.on('join_room', (room) => this.joinRoom(socket, room));
        } catch (error) {
            console.error(error);
            socket.emit('authentication_error', 'Не авторизовован');
        }
    }

    async joinRoom(socket, room) {
        const jwtToken = socket.handshake.auth.token;
        const jwtData = await this.verifyValidSession(jwtToken);
        console.log(room);
        if (!jwtData) {
             socket.emit('authentication_error', 'Не авторизовован');
             return socket.disconnect(true);
        }
        if(!await this.db.checkPrivilagesInChat(jwtData.id, room.currentChat)) {
          return socket.emit('joinChat_error', 'Невозможно войти в чат');
        } 
        socket.join(room.currentChat.toString());
    }
}