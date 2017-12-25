
// const sharp=require('sharp');
var path=require('path');
var fs=require('fs');
// sharp('/scripts/404.png')
//   .resize(300, 200)
//   .toFile('output.jpg', function(err) {
//       console.log(err);
//     // output.jpg is a 300 pixels wide and 200 pixels high image
//     // containing a scaled and cropped version of input.jpg
//   });
  const http = require('http');

  const server = http.createServer((req, res) => {
    fs.readFile(path.join(__dirname,'404.png'),'binary',(error,file)=>{
      res.writeHead(200, {"Content-Type": "image/png"});
      res.write(file, "binary");
      res.end();
    });
  });
  
  server.listen(3333);