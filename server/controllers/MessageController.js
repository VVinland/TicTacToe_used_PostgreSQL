import { Message } from "../models/model.js"
import {sequelize} from '../db.js';
class MessageController {

    async create(message, idName) {
        const mes = await Message.create({
            name: message.name,
            text: message.text,
            idName
        })
        return mes;
    }

    async getAll() {
        const messages = await Message.findAll();
        return messages;
    }

    async removeAll() {
      await Message.destroy({where:{},truncate:true});
    }
}

export default new MessageController();