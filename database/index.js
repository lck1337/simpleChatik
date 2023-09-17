const { Sequelize, DataTypes } = require('sequelize');

const models = require('./models');

class db {
  constructor (data) {
    this.ip = data.ip;
    this.port = data.port;
    this.user = data.user;
    this.pass = data.pass;
    this.dbname = data.dbname;
    this.db = this.connect();
    this.models = models(this.db, DataTypes);
    this.authenticate();
  }

  connect() {
    const db = new Sequelize(`mysql://${this.user}:${this.pass}@${this.ip}:${this.port}/${this.dbname}`, {
      logging: console.log,
    });

    return db;
  }

  async authenticate() {
    try {
      await this.db.authenticate();
      await this.db.sync({ force: false });
      console.log('Приконекчен к бд.');
    } catch (error) {
      console.error(error);
    }
  }

 async findAllUsers() {

  const users = await this.models.User.findAll({
    attributes: ["id", "username"]
  });

  return users;
 }

  async findOrCreateUser(username, password) {
      const [user, created] = await this.models.User.findOrCreate({
        where: { username },
        defaults: { username, password, admin: false,  userVersion: 1},
      });
      if(!created) return null;

      return user;
  }

  async FindOneByID(id) {
      const user = await this.models.User.findOne({
        where: { id }
      });

      if(!user) return null;

      return user;
  }

  async getMessageByImage(chatId, Hash) {
      const msg = await this.models.Message.findOne({
        where: { ChatId: chatId, image:Hash }
      });

      if(!msg) return null;

      return msg;
  }
  
  async FindOne(username) {
      const user = await this.models.User.findOne({
        where: { username }
      });

      if(!user) return null;

      return user;
  }





  async loadMessages(chatId, currentPage, messagesPerPage) {
      const messages = await this.models.Message.findAll({
        where: {
          ChatId: chatId,
        },
        order: [['createdAt', 'DESC']],
        offset: (currentPage - 1) * messagesPerPage,
        limit: messagesPerPage,
        include: [
          {
            model: this.models.User,
            as: 'sender',
            attributes: ['username'],
          },
        ],
      });
  
      return messages;
  }


  async createMessage(senderId, chatId, text, image) {
      const message = await this.models.Message.create({
        text,
        image,
      });
  
      await message.setChat(chatId);
      await message.setSender(senderId);
  
      return message;
  }

  async getOrCreatePrivateChat(userId1, userId2) {
      console.log(userId1, userId2);
      const existingChat = await this.models.Chat.findOne({
        where: {
          type: 'private',
        },
        include: [
          {
            model: this.models.User,
            as: 'Users',
            where: {
              id: [userId1, userId2],
            },
            attributes: ['id', 'username'],
          },
        ],
        group: ['Chat.id']
      });
      
      console.log(existingChat);

      if (existingChat) {
        return existingChat;
      }
  
      const user1 = await this.models.User.findOne({ where: { id: userId1 } });
      const user2 = await this.models.User.findOne({ where: { id: userId2 } });
      
      if(!user1) return null;
      if(!user2) return null;

      const chatName = `Private Chat (${user1.username} & ${user2.username})`;
      const newChat = await this.models.Chat.create({
        name: chatName,
        type: 'private',
      });
  
      await this.models.UserChat.create({
        ChatId: newChat.id,
        UserId: userId1,
      });
  
      await this.models.UserChat.create({
        ChatId: newChat.id,
        UserId: userId2,
      });
  
      return newChat;
  }

  async checkPrivilagesInChat(userId, chatId) {

    const userChat = await this.models.UserChat.findOne({
      where: {
        UserId: userId,
        ChatId: chatId,
      },
    });
    console.log(userChat);
    return userChat;
  }
}

module.exports = db;