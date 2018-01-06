//    程序依赖谷歌官方webp转换工具cwebp
//	  mac下安装 brew install webp

const chokidar = require('chokidar');
const process = require('child_process');
const fs = require('fs');
var quality = 75;
var imgDir = 'img';
const ignoreFiles = /(^\..+)|(.+[\/\\]\..+)|(.+?\.webp$)/; // 忽略文件.开头和.webp结尾的
const log = console.log.bind(console);

// 监控文件夹
var watcher = chokidar.watch(imgDir, {
	ignored: path => {
		return ignoreFiles.test(path);
	},
	persistent: true // 保持监听状态
});

// 得到对应的webp格式的文件名，默认为文件名后加上.webp
function getWebpImgName(path) {
	return `${path}.webp`;
}

// 得到shell命令
function getShellCmd(path) {
	var com = `cwebp -q ${quality} ${path} -o ${getWebpImgName(path)}`;
	console.log(com);
	return com;
}



// 监听增加，修改，删除文件的事件
watcher.on('all', (event, path) => {
	switch (event) {
		case 'add':
		case 'change':
			generateWebpImg(path, (status) => {
				log('生成图片' + getWebpImgName(path) + status);
			});
			break;
		case 'unlink':
			deleteWebpImg(getWebpImgName(path), (status) => {
				log('删除图片' + getWebpImgName(path) + status);
			});
			break;
		default:
			break;
	}
});

function generateWebpImg(path, cb) {
	process.exec(getShellCmd(path), err => {
		if (err !== null) {
			cb('失败');
			log('请先运行cwebp -h命令检查cwebp是否安装ok。')
			log(err);
		} else {
			cb('成功');
		}
	});
}

function deleteWebpImg(path, cb) {
	fs.unlink(path, (err) => {
		if (err) {
			cb('失败');
			log(err)
		} else {
			cb('成功');
		};
	});
}