import { DataTypes } from 'sequelize';
import {sequelize} from '../db.js';

const Message = sequelize.define('message', {
    id:{type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true},
    name:{type:DataTypes.STRING, allowNull:false},
    text:{type:DataTypes.STRING, allowNull:false},
    idName:{type:DataTypes.INTEGER, allowNull:false},
})

export{
    Message
}
