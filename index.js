const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter, userInit: initUserDB, User } = require("./db");
const logger = morgan("tiny");
const request = require("request");
// const random = require('random-js');



//md5加密
const crypto = require('crypto');

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}



const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);
// app.use(bodyParser.json());

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//添加一个管理员用户
app.post("/api/addSuperUser", async (req, res) => {
  ///获取传入的用户名和密码
  let username = req.query.account;
  let userPwd = req.query.pwd;
  console.log(username, userPwd);
  if (username && userPwd) {
    const jane = await User.create({ account: username, password: userPwd });
    // Jane 现在存在于数据库中！
    console.log(jane instanceof User); // true
    console.log(jane.name); // "Jane"
    res.send({
      code: 200,
      data: "注册成功",
    });
  } else {
    res.send({
      code: 500,
      data: "账号密码为空",
    });
  }

});


//用户登录
app.post("/api/userLogin", async (req, res) => {
  ///获取用户的code
  let userCode = req.query.code;
  console.log(userCode);

  if (userCode) {

    let url = 'https://api.weixin.qq.com/sns/jscode2session?appid=wx26dd37776ee9f17f&secret=b00201d207b57c4885fbb137301a50e5&js_code=' + userCode + '&grant_type=authorization_code';
    request(url, async (error, response, body) => {

      console.log('statusCode:', response && response.statusCode);

      console.log("结果", body);

      var oCode = JSON.parse(body);
      console.log("结果json :", oCode.openid);

      if (!oCode.errcode) {
        console.log("到判断里了");

        const userData = await User.findOne({ where: { openId: oCode.openid } });
        if (userData == null) {
          console.log('Not found!');
          //创建一个用户
          const newUser = await User.create({ openId: oCode.openid });
          console.log(newUser instanceof User); // true
          console.log(newUser.openId); // "Jane"
          res.send({
            code: 200,
            data: "登录成功",
            myToken: newUser.openId,
          });

        } else {

          console.log('已有用户');
          console.log(userData instanceof User); // true
          console.log(userData.openId); // 'My Title'

          res.send({
            code: 200,
            data: "登录成功",
            myToken: userData.openId,
          });
        }

      } else {
        res.send({
          code: 500,
          data: "登录失败",
        });
      }

    }) .catch(error => {
      console.error('获取openId错误:', error);
      res.send({
        code: 500,
        data: "登录失败",

      });
    
    });
    
    ;

  } else {
    res.send({
      code: 500,
      data: "code为空",
    });
  }

});

//计数
app.post("/api/setUserCount", async (req, res) => {
  const userOpenId = req.query.openId; //获取到用户的token 根据token查询用户信息
  console.log("拿到的openId", userOpenId);
  const userData = await User.findOne({ where: { openId: userOpenId } }); //查询用户
  if (userData.user_type == 0) { //普通用户
    let count = userData.useCount + 1;
    //更新用户次数
    const result = await User.update(
      { useCount: count }, // 要更新的字段和值
      {
        where: {
          openId: userOpenId
        }
      }
    );
    if (result) {
      res.send({
        code: 200,
        data: "次数更新成功",
      });
    } else {
      res.send({
        code: 500,
        data: "次数更新失败",
      });
    }
  } else {
    res.send({
      code: 500,
      data: "会员不用计数",
    });
  }

});




// 获取用户类型，普通用户解析数加一
app.post("/api/getUserTypeCount", async (req, res) => {
  const userOpenId = req.query.openId; //获取到用户的token 根据token查询用户信息
  console.log("拿到的openId", userOpenId);

  const userData = await User.findOne({ where: { openId: userOpenId } }); //查询用户

  if (userData) {
    console.log(userData instanceof User); // true
    console.log(userData.openId, userData.user_type, userData.useCount); // 'My Title'

    if (userData.user_type == 0) { //普通用户

      console.log("用户次数", userData.useCount);

      // 次数到3次 拒绝解析，返回失败
      if (userData.useCount >= 3) {
        res.send({
          code: 500,
          data: "体验解析结束,请联系客服增加次数",
        });
      } else {
        res.send({
          code: 200,
          data: "已解析次数" + userData.useCount,
        });
      }

    } else {
      //判断当前是否大于会员的日期
      const dqDate = userData.endDate; //到期时间格式 "2024-11-28 20:41:00";
      if (dqDate) {
        // const aa = "2021-10-20 15:20:23";  // 过期时间
        const date = new Date(dqDate); //结束时间小与当前时间 过期
        if (date.getTime() < Date.now()) {
          console.log("过期");
          res.send({
            code: 500,
            data: "会员已到期,续期请联系客服",
          });
        } else {
          console.log("没过期"); //如果结束时间大于当前时间 没有到期
          res.send({
            code: 200,
            data: "会员到期时间" + dqDate,
          });
        }
      }

    }
  }

});



//获取用户信息
app.post("/api/getUserInfo", async (req, res) => {

  const userOpenId = req.query.openId; //获取到用户的token 根据token查询用户信息
  console.log("拿到的openId", userOpenId);

  const userData = await User.findOne({ where: { openId: userOpenId } }); //查询用户

  if (userData) {
    console.log(userData instanceof User); // true
    console.log(userData.openId, userData.user_type, userData.useCount);
    // let randomNumber = random.int(0, 1000000000);
    // console.log(randomNumber);
    res.send({
      code: 200,
      data: { "userId": 9852374326 + userData.id, "userType": userData.user_type, "userCount": userData.useCount, "endDate": userData.endDate },
    });
  }
});


//管理员登录
app.post("/api/superManagerLogin", async (req, res) => {

  ///获取传入的用户名和密码
  let username = req.query.account;
  let userPwd = req.query.pwd;
  console.log(username, userPwd);
  if (username && userPwd) {
    const superUser = await User.findOne({ where: { account: username, password: userPwd } });
    if (superUser === null) {
      console.log('Not found!');
      res.send({
        code: 500,
        data: "无此账号",
      });
    } else {
      console.log(superUser instanceof User); // true
      console.log(superUser.account); // 'My Title'
      res.send({
        code: 200,
        data: "管理员登录成功",
      });
    }
  } else {
    res.send({
      code: 500,
      data: "账号或密码错误",
    });
  }

});

//管理员搜索用户
app.post("/api/searchUser", async (req, res) => {
  let username = req.query.account;
  let userPwd = req.query.pwd;

  const superUser = await User.findOne({ where: { account: username, password: userPwd } });
  if (superUser === null) {
    console.log('Not found!');
    res.send({
      code: 500,
      data: "无此管理员",
    });
  } else {

    let userId = req.query.userId;
    let myuserId = userId - 9852374326; // 真实id
    const aUser = await User.findOne({ where: { Id: myuserId } });
    if (aUser) {
      res.send({
        code: 200,
        data: { "userId": aUser.id, "userType": aUser.user_type, "endDate": aUser.endDate },
      });
    } else {
      res.send({
        code: 500,
        data: "无此用户",
      });
    }

  }

});

//管理员获取用户列表
app.post("/api/getUserList", async (req, res) => {
  let username = req.query.account;
  let userPwd = req.query.pwd;

  const superUser = await User.findOne({ where: { account: username, password: userPwd } });
  if (superUser === null) {
    console.log('Not found!');
    res.send({
      code: 500,
      data: "无此管理员",
    });
  } else {

    const aUser = await User.findAll();
    if (aUser) {
      res.send({
        code: 200,
        data: aUser,
      });
    } else {
      res.send({
        code: 500,
        data: "无用户",
      });
    }

  }


});



//管理员修改用户权限
app.post("/api/updateUserType", async (req, res) => {
  let username = req.query.account;
  let userPwd = req.query.pwd;
  const superUser = await User.findOne({ where: { account: username, password: userPwd } });
  if (superUser === null) {
    console.log('Not found!');
    res.send({
      code: 500,
      data: "无此管理员",
    });
  } else {
    console.log(superUser instanceof User); // true
    console.log(superUser.account); // 'My Title'
    ///获取传入的用户名和密码
    let updateUserId = req.query.userId;
    let updateUserType = req.query.type;
    let endDate = req.query.endDate;//到期时间
    let startDate = req.query.startDate; //开始时间

    let myuserId = updateUserId - 9852374326; // 真实id

    if (updateUserId && updateUserType && endDate) {
      //更新用户类型，到期时间
      const result = await User.update(
        { user_type: updateUserType, endDate: endDate, startDate: startDate }, // 要更新的字段和值
        {
          where: {
            id: myuserId
          }
        }
      );
      if (result) {
        res.send({
          code: 200,
          data: "更新成功",
        });
      } else {
        res.send({
          code: 500,
          data: "更新失败",
        });
      }
    } else {
      res.send({
        code: 500,
        data: "更新信息不全",
      });
    }


  }

});


// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  await initUserDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
