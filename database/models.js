module.exports = (db, DataTypes) => {

    const User = db.define('User', {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      userVersion: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    });
  
    const Chat = db.define('Chat', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  
    const UserChat = db.define('UserChat', {
      ChatId: {
        type: DataTypes.INTEGER,
        references: {
          model: Chat,
          key: 'id',
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        references: {
          model: User,
          key: 'id',
        },
      },
    });
  
    const Message = db.define('Message', {
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    });
  
    Chat.belongsToMany(User, { through: UserChat });
    User.belongsToMany(Chat, { through: UserChat });
    UserChat.belongsTo(User);
    UserChat.belongsTo(Chat);
    Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
    Message.belongsTo(Chat);

    Message.prototype.setSender = async function (senderId) {
        const sender = await User.findByPk(senderId);
        if (sender) {
          this.senderId = senderId;
          await this.save();
        } else {
          throw new Error('Пользователь не найден');
        }
      };
      
      Message.prototype.setChat = async function (chatId) {
        this.ChatId = chatId;
        await this.save();
      };
  
    return { User, Chat, UserChat, Message };
  }