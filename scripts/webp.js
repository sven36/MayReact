const sharp = require('sharp');
var path = require('path');
var fs = require('fs');
var _img = path.join(__dirname, './img/1.jpg');

var transformImg = function (_img) {
	var _prevSize;
	fs.readFile(_img, (err, file) => {
		_prevSize = file.length;
		sharp(_img)
			.toFile(path.join(__dirname, './out-webp/1.jpg.webp'), function (err, file) {
				if (err) throw err;

				console.log('--------------------');
				console.log('transformed');
				var _prev = Math.round(_prevSize / 1024);
				var _afer = Math.round(file.size / 1024);
				console.log('prev  ' + _prev + 'KB');
				console.log('webp  ' + _afer + 'KB');
				console.log('resized    ' + Math.round((_prev - _afer) * 100 / _prev) + '%');
			});
	})
}
// transformImg(_img);

const http = require('http');

const server = http.createServer((req, res) => {
	var isWebp = false;
	if (req && req.headers.accept && req.headers.accept.indexOf('image/webp') > 0) {
		isWebp = true;
		console.log(req.accept);
	};
	var _path;
	if (isWebp) {
		_path = path.join(__dirname, '/out-webp/jpg.webp');
	} else {
		_path = path.join(__dirname, req.url); //req.url
	}
	fs.readFile(_path, (error, file) => {
		if (isWebp) {
			res.writeHead(200, {
				"Content-Type": "image/webp"
			});
		} else {
			res.writeHead(200, {
				"Content-Type": "image/webp"
			});
		}
		if (file) {
			res.write(file);
		}
		res.end();
	});
});

server.listen(3333);


// var buffer= fs.readFile(_img,(err,data)=>{
//   sharp(data).toFile('output.webp', function(err) {
//     console.log(err);
//   // output.jpg is a 300 pixels wide and 200 pixels high image
//   // containing a scaled and cropped version of input.jpg
// });
// })

// function checkWebp() {
//   try {
//     return (document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0);
//   } catch (err) {
//     return false;
//   }
// }
// console.log(checkWebp()); // true or false