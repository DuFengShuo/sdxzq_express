const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split("localhost:3306");

const sequelize = new Sequelize("sdxzq", "root", "Dushuo123", {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
},
);


// 定义 User 模型
const User = sequelize.define('User', {
  // 用户账号
  account: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // 用户密码
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //用户OpenId
  openId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //用户类型  0普通用户 1月卡，2季卡，3年卡，4终身
  user_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue:0,
  },
  //开始使用时间
  startDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //到期时间
  endDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //使用次数
  useCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue:0,
  },
   //userId
   useId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  //主键id
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, // 设置为自增
  },
  //用户名
  userName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //用户头像
  imgUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  //用户token
  userToken: {
    type: DataTypes.STRING,
    allowNull: true
  },

}, 

);


// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
}

//userInt
async function userInit() {
  await User.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  userInit,
  User
};
