const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const crypto = require('crypto');

const jwtKey = "FJIreusjidjf1FedffffioDJIOEsdidji3wejsidji";

module.exports = class usersService {
    constructor(db) {
        this.db = db;
    }

   async saveImage(image, chatid) {
            const randomBytes = crypto.randomBytes(32);
            const fileName = randomBytes.toString('hex');
            const filePath = `./images/${chatid}/${fileName}.png`;
            
            await fs.mkdir(`./images/${chatid}`, { recursive: true });
            await fs.writeFile(filePath, image.buffer);
            
            return fileName;
    }

   async verifyVersion(data)  {
        const user = await this.db.FindOneByID(data.id);

        if(!user) return null;

        if(data.version !== user.userVersion) return null;

        return true;
    }

    async verifyToken(jwtToken) {
        try {
          const valid = await jwt.verify(jwtToken, jwtKey);
          return valid;
        } catch (error) {
            return null;
        }
      }

    async createToken(id, username, userVersion) {
        const payload = {id, username: username, version: userVersion };
        return jwt.sign(payload, jwtKey, { expiresIn: '6h' });
      }

    async hashingPassword(password) {

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        return hash;
    }

    async verifyHash(password, hash) {
        const verify = await bcrypt.compare(password, hash);

        return verify;
    }

    isValid(input, isLogin) {

        const loginRegex = /^[a-zA-Z0-9_][a-zA-Z0-9_]{2,19}$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        const regex = isLogin ? loginRegex : passwordRegex;

        return regex.test(input);

    }

   async register(username, password) {

        if(!this.isValid(username, true)) return {status: "error", msg: "Неврный формат логина", statusCode: 400};
        if(!this.isValid(password, false)) return {status: "error", msg: "Неврный формат пароля", statusCode: 400};
        const passwordHash = await this.hashingPassword(password);

        const user = await this.db.findOrCreateUser(username, passwordHash);

        if(!user) return {status: "error", msg: "Такой пользователь уже зарегистрирован", statusCode: 409};
        
        const jwtToken = await this.createToken(user.id, user.username, user.userVersion);

        return {status: "success", msg: "Успешно зарегистрирован", jwtToken, info: {id: user.id, username: user.username}, statusCode: 200};

    }

    async login(username, password) {
        if(!this.isValid(username, true)) return {status: "error", msg: "Неврный формат логина", statusCode: 400};
        if(!this.isValid(password, false)) return {status: "error", msg: "Неврный формат пароля", statusCode: 400};

        const user = await this.db.FindOne(username);

        if(!user) return {status: "error", msg: "Логин неверный", statusCode: 400};
        
        if(!await this.verifyHash(password, user.password)) return {status: "error", msg: "Пароль неверный", statusCode: 401};

        const jwtToken = await this.createToken(user.id, user.username, user.userVersion);

        return {status: "success", msg: "Успешно авторизирован", jwtToken, info: {id: user.id, username: user.username}, statusCode: 200};
    }

    async getImageAccess (jwtToken, chatid, imagehash) {

        const jwtData = await this.verifyToken(jwtToken);

        if(!jwtData) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.verifyVersion(jwtData)) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.db.checkPrivilagesInChat(jwtData.id, chatid)) return {status: "error", msg: "Чат либо не найден, либо у тебя нет доступа к нему", statusCode: 403};

        const img = await this.db.getMessageByImage(chatid, imagehash);

        console.log(img);

        if(!img) return {status: "error", msg: "Чат не найден", statusCode: 404};

        return null;

    }

    async getChatByID (jwtToken, chatid) {

        const jwtData = await this.verifyToken(jwtToken);

        if(!jwtData) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.verifyVersion(jwtData)) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(jwtData.id == chatid) return {status: "error", msg: "Ты не можешь сам с собой общаться", statusCode: 400};

        const chat = await this.db.getOrCreatePrivateChat(jwtData.id, chatid);

        if(!chat) return {status: "error", msg: "Чат не найден", statusCode: 404};

        return {status: "success", chatId: chat.id, statusCode: 200};

    }

    async sendMessage(jwtToken, chatid, message = null, image = null, socketIO) {

        const jwtData = await this.verifyToken(jwtToken);

        if(!jwtData) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.verifyVersion(jwtData)) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.db.checkPrivilagesInChat(jwtData.id, chatid)) return {status: "error", msg: "Чат либо не найден, либо у тебя нет доступа к нему", statusCode: 403};

        let imagePath = null;

        if(image) imagePath = await this.saveImage(image, chatid);

        const createMessage = await this.db.createMessage(jwtData.id, chatid, message, imagePath);

        if(!createMessage) return {status: "error", msg: "Сообщение не создалось", statusCode: 400};

        socketIO.newMessage(chatid, message, imagePath, jwtData.username);

        return {status: "success", msg: "Сообщение успешно отправлено", statusCode: 200};
    }

    async getAllUsers(jwtToken) {

        const jwtData = await this.verifyToken(jwtToken);

        if(!jwtData) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.verifyVersion(jwtData)) return {status: "error", msg: "Не авторизован", statusCode: 403};

        const user = await this.db.FindOne(jwtData.username);

        if(user.admin === false) return {status: "error", msg: "Ты не администратор", statusCode: 403};

        const users = await this.db.findAllUsers();

        return {status: "success", users, statusCode: 200};

    }

    async getHistoryChat(jwtToken, chatid) {

        const jwtData = await this.verifyToken(jwtToken);

        if(!jwtData) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.verifyVersion(jwtData)) return {status: "error", msg: "Не авторизован", statusCode: 403};

        if(!await this.db.checkPrivilagesInChat(jwtData.id, chatid)) return {status: "error", msg: "Чат либо не найден, либо у тебя нет доступа к нему", statusCode: 403};

        // лень уже делать прогрузку просто получу 1к сообщений
        const messageHistory = await this.db.loadMessages(chatid, 1, 1000);

        if(!messageHistory) return {status: "success", messageHistory: [], statusCode: 200};

        return {status: "success", messageHistory, statusCode: 200};
    }



}