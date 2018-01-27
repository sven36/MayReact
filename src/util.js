import {
    addEvent,
    getBrowserName,
    eventHooks
} from './event';

import {
    reRender
} from './MayDom'

//mayQueue 保存render过程中的各种事件队列 
export var mayQueue = {
    dirtyComponentsQueue: [], //setState 需要diff的component队列
    callbackQueue: [], //回调队列 setState 中的事件回调
    lifeCycleQueue: [], //生命周期过程中的回调队列 DidUpdate DidMount ref回调
    isInEvent: false, //是否在触发事件 回调事件中的setstate合并触发
    clearQueue: clearQueue,
    flushUpdates: flushUpdates,
}
/**
 * 清空回调队列
 * @param {*} mayQueue 
 */
function clearQueue() {
    //ComponentDidMount
    clearLifeCycleQueue();
    //如有有dirty Component diff
    flushUpdates();
    //setState传入的回调函数
    clearCallbackQueue();
}
function flushUpdates() {
    var c;
    //如果在当前生命周期的DidMount调用setState 放到下一生命周期处理
    mayQueue.dirtyComponentsQueue = mayQueue.dirtyComponentsQueue.sort(sortComponent);
    while (c = mayQueue.dirtyComponentsQueue.shift()) {
        reRender(c);
    }
    //ComponentDidUpdate
    clearLifeCycleQueue();
}
function clearLifeCycleQueue() {
    //先清空 生命周期 ref 的回调函数
    if (mayQueue.lifeCycleQueue && mayQueue.lifeCycleQueue.length > 0) {
        var lifeCallback;
        // mayQueue.lifeCycleQueue = mayQueue.lifeCycleQueue.sort(sortComponent);
        while (lifeCallback = mayQueue.lifeCycleQueue.shift()) {
            lifeCallback();
        }
    }
}
function clearCallbackQueue() {
    //再清空 setState传入的回调函数
    if (mayQueue.callbackQueue && mayQueue.callbackQueue.length > 0) {
        var callback;
        mayQueue.callbackQueue = mayQueue.callbackQueue.sort(sortComponent);
        while (callback = mayQueue.callbackQueue.shift()) {
            callback();
        }
    }
}

function sortComponent(a, b) {
    return a._mountOrder - b._mountOrder;
}

//有个trim方法 兼容性需要处理
/**
 * 设置DOM属性
 * @param {*} dom 
 * @param {*} props 
 */
export function setDomAttr(dom, props) {
    var nodeType = dom.nodeType;
    // Don't get/set attributes on text, comment and attribute nodes
    if (nodeType === 3 || nodeType === 8 || nodeType === 2) {
        return;
    }
    for (const key in props) {
        if (!isEvent(key)) {
            switch (key) {
                case 'children':
                case 'style':
                case 'key':
                    break;
                case 'className':
                    dom.setAttribute('class', props['className']);
                    break;
                case 'dangerouslySetInnerHTML':
                    var html = props[key] && props[key].__html;
                    dom.innerHTML = html;
                    break;
                default:
                    if (dom.nodeName !== 'INPUT') {
                        if (props[key] !== null && props[key] !== false) {
                            //attribute 永远是字符串
                            dom.setAttribute(key, props[key] + '');
                        } else {
                            //如果是null 或 false 不必添加
                            dom.removeAttribute(key);
                        }
                    } else { //input value是property属性 直接赋值即可
                        dom[key] = props[key];
                    }
                    break;
            }

        } else {
            var e = key.substring(2).toLowerCase();
            var eventName = getBrowserName(key);
            addEvent(eventName);
            //input的change等特殊事件需要特殊处理
            var hook = eventHooks[eventName];
            if (hook) {
                hook(dom, eventName);
            }
            var listener = dom._listener || (dom._listener = {});
            listener[e] = props[key];
        }
    }
    if (props['style']) {
        var _obj = props['style'];
        var _style = '';
        for (var name in _obj) {
            if (_obj[name] !== null) {
                //backgroundColor 替换为 background-color Webkit替换为-webkit-   ms单独替换一次
                _style += name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/i, '-ms-') + ':';

                var _type = typeof _obj[name];
                switch (_type) {
                    case 'string':
                        _style += _obj[name].trim() + ';';
                        break;
                    case 'number':
                        _style += _obj[name];
                        if (cssSuffix[name]) {
                            _style += _obj[name] !== 0 ? +cssSuffix[name] : '';
                        }
                        _style += ';';
                        break;
                    default:
                        _style += _obj[name] + ';';
                        break;
                }
                dom.setAttribute('style', _style);
            }
        }
    }

}
export function removeDomAttr(dom, props, key) {
    var nodeType = dom.nodeType;
    // Don't get/set attributes on text, comment and attribute nodes
    if (nodeType === 3 || nodeType === 8 || nodeType === 2) {
        return;
    }
    if (!isEvent(key)) {
        switch (key) {
            case 'dangerouslySetInnerHTML':
                dom.innerHTML = '';
            case 'className':
                dom.removeAttribute('class');
                break;
            default:
                if (dom.nodeName !== 'INPUT') {
                    dom.removeAttribute(key);
                } //input 标签如果去掉其value 会把受控组件转为非受控组件 不推荐
                break;
        }
    } else {
        var e = key.substring(2).toLowerCase();
        if (dom._listener && dom._listener[e]) {
            delete dom._listener[e];
        }
    }


}
export function mergeState(instance) {
    var newState;
    var prevState = instance.state;
    if (instance._mergeStateQueue) {
        var newState = Object.assign({}, prevState);
        var c;
        while (c = instance._mergeStateQueue.shift()) {
            newState = Object.assign(newState, c);
        }
    } else {
        newState = prevState;
    }
    return newState;
}

function isEvent(name) {
    return /^on[A-Z]/.test(name);
}
// export function eventProxy(e) {
//     return this._listener[e.type](e);
// }
export function extend(target, src) {
    for (var key in src) {
        target[key] = src[key];
    }
    return target;
}
/**
 * 寄生组合式继承
 * @param {*} target 
 * @param {*} superClass 
 */
export function inherits(target, superClass) {
    function b() { };
    b.prototype = superClass.prototype;
    var fn = target.prototype = new b();
    fn.constructor = target;
    return fn;
}
const cssSuffix = {
    //需要加后缀如 px s(秒)等css属性摘出来
    //其实用正则更简洁一些,不过可能 可读性可维护性不如key value
    //动画属性（Animation）
    animationDelay: 's',
    //CSS 边框属性（Border 和 Outline）
    borderBottomWidth: 'px',
    borderLeftWidth: 'px',
    borderRightWidth: 'px',
    borderTopWidth: 'px',
    borderWidth: 'px',
    outlineWidth: 'px',
    borderBottomLeftRadius: 'px',
    borderBottomRightRadius: 'px',
    borderRadius: 'px',
    borderTopLeftRadius: 'px',
    borderTopRightRadius: 'px',
    //Box 属性
    rotation: 'deg',
    //CSS 尺寸属性（Dimension）
    height: 'px',
    maxHeight: 'px',
    maxWidth: 'px',
    minHeight: 'px',
    minWidth: 'px',
    width: 'px',
    //CSS 字体属性（Font） font-variant:small-caps; 段落设置为小型大写字母字体
    fontSize: 'px',
    //CSS 外边距属性（Margin）
    margin: 'px',
    marginLeft: 'px',
    marginRight: 'px',
    marginTop: 'px',
    marginBottom: 'px',
    //多列属性（Multi-column）
    columnGap: 'px',
    WebkitColumnGap: 'px',
    MozColumnGap: 'px',
    columnRuleWidth: 'px',
    WebkitColumnRuleWidth: 'px',
    MozColumnRuleWidth: 'px',
    columnWidth: 'px',
    WebkitColumnWidth: 'px',
    MozColumnWidth: 'px',
    //CSS 内边距属性（Padding）
    padding: 'px',
    paddingLeft: 'px',
    paddingRight: 'px',
    paddingTop: 'px',
    paddingBottom: 'px',
    //CSS 定位属性（Positioning）
    left: 'px',
    right: 'px',
    top: 'px',
    bottom: 'px',
    //CSS 文本属性（Text）
    letterSpacing: 'px',
    lineHeight: 'px'
}