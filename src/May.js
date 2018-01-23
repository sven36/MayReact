import {
    createElement
} from './MayElement';
import {
    Component
} from './Component';
import {
    cloneElement
} from './cloneElement';
import {
    Children
} from './Children';

var May = {
    createElement: createElement,
    Component: Component,
    cloneElement: cloneElement,
    Children: Children
}
export {
    createElement,
    Component
}
//ios9 andriod5 支持http2
//m端 并行请求 减少域的链接
//ios下浏览器只允许4个域名链接(待查)
//处理卡顿 动画卡顿（chromedevtap 查看动画帧数 css3 transform代替dom操作
// 开启GPU硬件加速-webkit-trans） 交互卡顿（）
//平台兼容性 safari兼容性 UC特供 X5内核（微信QQ）
//有限的缓存 APP一般给页面的大小<20M 每个页面平均400K
//localStrorge 版本控制 和清除旧缓存 存储满时的边界条件 旧浏览器的处理
//代码集成circleci  travisci  arthur http://fe.58corp.com
export default May;