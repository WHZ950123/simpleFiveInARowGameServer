const ws = require('nodejs-websocket')
const arr = {} //方便管理连接
const userArr = [] //记录连接用户的用户名,每次只允许2个用户连接
let reBeginNum = 0
let times = 0
const colorArr1 = ['black', 'white']
const colorArr2 = ['white', 'black']

function getColorArr () {
  times++ //盘数
  if (times % 2 === 1) {
    return colorArr1
  } else {
    return colorArr2
  }
}

const server = ws.createServer(function(socket) {
  socket.on('text', function(str) { //nodejs-websocket框架监听的是text
    let data = JSON.parse(str)
    console.log('服务器收到了来自', data.username, '的消息:', data.mes)
    if (arr[data.username]) {
      if (data.mes === 'close') { //如果是关闭连接的消息,就从数组删除该用户
        userArr.forEach((user, index) => {
          if (user === data.username) {
            userArr.splice(index, 1)
          }
        })
        delete arr[data.username]
        return
      }
      if (data.mes === 'reBegin') { //重新开始一局
        reBeginNum++
        if (reBeginNum === 2) { //如果2个用户都点击了重新开始
          let colorArr = getColorArr()
          for (let i = 0; i < userArr.length; i++) {
            let name = userArr[i]
            arr[name].sendText(JSON.stringify({
              code: 202, //设置发送对手名字和棋子颜色的code为202
              username: '',
              text: userArr[1 - i], //对手的名字
              qz: colorArr[i]
            }))
          }
          reBeginNum = 0
        }
        return
      }
      for (let item in arr) {
        arr[item].sendText(JSON.stringify({ //发消息只能是字符串或者buffer
          code: 204,  //发送棋子位置设为204
          username: data.username,
		      text: data.mes
        }))
      }
    } else { //第一次连接
      if (userArr.length < 2) {
        arr[data.username] = socket
        userArr.push(data.username) //把用户名字放进userArr数组
        socket.sendText(JSON.stringify({ //发送连接成功字符串
          code: 200,
          username: data.username,
          text: '连接成功'
        }))
        if (userArr.length === 2) { //如果2个用户齐了,就通知另一个用户
          let colorArr = getColorArr()
          for (let i = 0; i < userArr.length; i++) {
            let name = userArr[i]
            arr[name].sendText(JSON.stringify({
              code: 202, //设置发送对手名字和棋子颜色的code为202
              username: '',
              text: userArr[1 - i], //对手的名字
              qz: colorArr[i]
            }))
          }
        }
      } else {
        console.log('连接的人太多啦!一次只能连2个人哟')
        socket.sendText(JSON.stringify({ //发送字符串
          code: 500,
          username: data.username,
          text: '连接失败,每次只能连接2个用户'
        }))
      }
    }
    console.log('连接的用户:', userArr)
  })

  socket.on('close', function (code, reason) {
    console.log("关闭连接")
    console.log('连接的用户:', userArr)
  })

  socket.on('error', function (code, reason) {
    console.log("异常关闭")
    console.log('连接的用户:', userArr)
  })
}).listen(4000)