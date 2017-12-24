
const sharp=require('sharp');
var path=require('path');
// sharp('/scripts/404.png')
//   .resize(300, 200)
//   .toFile('output.jpg', function(err) {
//       console.log(err);
//     // output.jpg is a 300 pixels wide and 200 pixels high image
//     // containing a scaled and cropped version of input.jpg
//   });
  const http = require('http');

  const server = http.createServer((req, res) => {
    // req 是 http.IncomingMessage 的实例，这是一个 Readable Stream
    // res 是 http.ServerResponse 的实例，这是一个 Writable Stream
  
    let body = '';
    // 接收数据为 utf8 字符串，
    // 如果没有设置字符编码，将接收到 Buffer 对象。
    req.setEncoding('utf8');
  
    // 如果监听了 'data' 事件，Readable streams 触发 'data' 事件 
    req.on('data', (chunk) => {
      body += chunk;
    });
  
    // end 事件表明整个 body 都接收完毕了 
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        // 发送一些信息给用户
        res.write(typeof data);
        res.end();
      } catch (er) {
        // json 数据解析失败 
        res.statusCode = 400;
        return res.end(`error: ${er.message}`);
      }
    });
  });
  
  server.listen(3333);