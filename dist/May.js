'use strict';

/**
 * 
 * @param {*} type dom类型或func
 * @param {*} props dom属性
 * @param {*} children 子节点
 */
function createElement(type, config, children) {

    var props = {};
    var key = null;
    var ref = null;
    var mtype = null;
    var getContext = null;
    var len = arguments.length - 2;
    //0代表没有ref 1代表ref为func 2为string
    var refType = 0;
    //既然render的时候都需要判断下type 是fun或string
    //那把这一步提前 比render循环里判断更好些;
    var _type = typeof type;
    switch (_type) {
        case 'string': //HtmlElement 1  SVG 3
            mtype = type !== 'svg' ? 1 : 3;
            break;
        case 'function': //component 或statelessComponent
            mtype = 2;
            //如果有contextTypes代表该组件可以取context
            type.contextTypes && (getContext = true);
            break;
    }
    if (config) {
        key = config.key !== void 0 ? ('' + config.key) : null;
        ref = config.ref || null;
        if (typeof ref === 'number') {
            ref = '' + ref;
        }
        if (ref) {
            var _refType = typeof ref;
            switch (_refType) {
                case 'function':
                    refType = 1;
                    break;
                case 'string':
                    refType = 2;
                    break;
            }
        }
        for (var i in config) {
            if (i !== 'key' && i != 'ref') {
                props[i] = config[i];
            }
        }
    }
    var defaultProps = type.defaultProps;
    if (defaultProps) {
        for (var propName in defaultProps) {
            if (props[propName] === void 666) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    if (len > 1) {
        var array = new Array();
        for (var i = 0; i < len; i++) {
            var c = arguments[i + 2];
            if (!Array.isArray(c)) {
                array.push(c);
            } else {
                c.forEach(function (item) {
                    array.push(item);
                });
            }
        }
        props.children = array;
    } else if (len === 1) {
        props.children = children;
    }

    return new Vnode(type, key, ref, props, mtype, getContext, refType);
}

/**
 * 
 * @param {*} type 
 * @param {*} key 
 * @param {*} ref 
 * @param {*} self 
 * @param {*} source 
 * @param {*} owner 
 * @param {*} props 
 */
var Vnode = function (type, key, ref, props, mtype, getContext, refType) {
    this.type = type;
    this.key = key;
    this.ref = ref;
    this.props = props;
    this.$$typeof = 1;
    this.mtype = mtype;
    //之前是直接赋在vnode上 多了之后容易混 
    //单独新建个对象存放各种信息
    this.mayInfo = {};
    this.getContext = getContext;
    this.refType = refType;
};


// function isArray(o) {
//     return Object.prototype.toString.call(o) == '[object Array]';
// }

//文本节点重复利用
var recyclables={
    '#text':[]
};
function mergeState(instance) {
    var newState;
    var prevState = instance.state;
    if (instance.mayInst.mergeStateQueue && instance.mayInst.mergeStateQueue.length > 0) {
        var queue = instance.mayInst.mergeStateQueue;
        var newState = extend({}, prevState);
        for (var i = 0; i < queue.length; i++) {
            var s = queue[i];
            if (s && s.call) {
                s = s.call(instance, newState, instance.nextProps || instance.props);
            }
            newState = extend(newState, s);
        }
        instance.mayInst.mergeStateQueue.length = 0;
    } else {
        newState = prevState;
    }
    return newState;
}


// export function eventProxy(e) {
//     return this._listener[e.type](e);
// }
function extend(target, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            target[key] = src[key];
        }
    }
    return target;
}
/**
 * 寄生组合式继承
 * @param {*} target 
 * @param {*} superClass 
 */
function inherits(target, superClass) {
    function b() { }
    b.prototype = superClass.prototype;
    var fn = target.prototype = new b();
    fn.constructor = target;
    return fn;
}

var Refs = {
    //当子component含有ref的时候,需要把对应的instance或dom添加到 父component的refs属性中
    //如果在mountComponent中做这样的操作需要每一层都要添加owner 放在外面更好些;
    currentOwner: null,
    //开始render时isRoot为true,方便ref定位最顶端节点
    isRoot: false,
    attachRef: function (vnode, hostNode) {
        if (vnode.refType === 1) { //func
            hostNode.mayInst && hostNode.mayInst.stateless && (hostNode = null);
            lifeCycleQueue.push(vnode.ref.bind(vnode, hostNode));
        } else if (vnode.refType === 2) { //string
            this.currentOwner.refs[vnode.ref] = hostNode;
        }
    }
};

//mayQueue 保存render过程中的各种事件队列 
var mayQueue = {
    dirtyComponentsQueue: [], //setState 需要diff的component队列 
    callbackQueue: [], //回调队列 setState 中的事件回调
    lifeCycleQueue: [], //生命周期过程中的回调队列 DidUpdate DidMount ref回调
    isInEvent: false, //是否在触发事件 回调事件中的setstate合并触发
    clearQueue: clearQueue,
    flushUpdates: flushUpdates,
};
//存放生命周期中的 DidMount DidUpdate以及ref回调
var lifeCycleQueue = mayQueue.lifeCycleQueue;
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
    var instance;
    var i = 0;
    //如果在当前生命周期的DidMount调用setState 放到下一生命周期处理
    mayQueue.dirtyComponentsQueue = mayQueue.dirtyComponentsQueue.sort(sortComponent);
    while (instance = mayQueue.dirtyComponentsQueue.shift()) {
        if (i++ === 0) {
            Refs.isRoot = true;
        }
        if (instance.mayInst.dirty) {
            //如果C是脏组件diff 如果其在diff过程中子组件也需要diff diff之后
            //子组件_dirty会为false 没必要再diff一次；
            reRender(instance);
        }

        if (instance) {
            //diff之后组件的状态返回0
            instance.mayInst.lifeState = 0;
        }
    }
    //ComponentDidUpdate
    clearLifeCycleQueue();
    //防止setState currentOwner混乱
    Refs.currentOwner = null;
}

function clearLifeCycleQueue() {
    //先清空 生命周期 ref 的回调函数
    if (mayQueue.lifeCycleQueue && mayQueue.lifeCycleQueue.length > 0) {
        var callback;
        //其实ref很像生命周期函数,它比较特殊的地方在于vnode.type='div'之类的vnode
        //其string ref要指向其真实dom func ref也是回调真实的dom 其它的都是回调instance
        //vnode.type='div'之类的ref特殊处理;剩余的就和生命周期很像了;
        while (callback = mayQueue.lifeCycleQueue.shift()) {
            callback();
        }
    }
}

function clearCallbackQueue() {
    //再清空 setState传入的回调函数
    if (mayQueue.callbackQueue && mayQueue.callbackQueue.length > 0) {
        var callback;
        mayQueue.callbackQueue = mayQueue.callbackQueue.sort(sortCallback);
        while (callback = mayQueue.callbackQueue.shift()) {
            callback();
        }
    }
}

function sortCallback(a, b) {
    return a._mountOrder - b._mountOrder;
}

function sortComponent(a, b) {
    return a.mayInst.mountOrder - b.mayInst.mountOrder;
}

var globalEvent = {

};
var eventHooks = {}; //用于在元素上绑定特定的事件
var document$1 = window.document;
var isTouch = "ontouchstart" in document$1;

function dispatchEvent(e, type, end) {
    e = new SyntheticEvent(e);
    if (type) {
        e.type = type;
    }
    var _type = e.type;
    //全局的一个标识  在事件中setState应当合并
    mayQueue.isInEvent = true;
    //onClickCapture 在捕获阶段触发
    var captured = _type + 'capture';
    var eventCollect = bubbleEvent(e.target, end || document$1);

    //先触发捕获
    triggerEventFlow(e, eventCollect, captured);

    if (!e._stopPropagation) {
        //触发冒泡
        triggerEventFlow(e, eventCollect.reverse(), _type);
    }
    mayQueue.isInEvent = false;
    //在事件中合并state之后 触发reRender
    mayQueue.clearQueue();
}
/**
 * 自己冒泡,收集冒泡过程中的所有事件
 * @param {*event target} from 
 * @param {*end || document} end 
 */
function bubbleEvent(from, end) {
    var collect = [];
    do {
        if (from === end) {
            break;
        }
        var event = from._listener;
        if (event) {
            collect.push({
                dom: from,
                events: event
            });
        }
    } while ((from = from.parentNode) && from.nodeType === 1);
    // target --> parentNode --> body --> html
    return collect;
}

function triggerEventFlow(e, collect, prop) {
    for (var i = collect.length; i--;) {
        var eObj = collect[i];
        var fn = eObj.events[prop];
        if (isFn(fn)) {
            e.currentTarget = eObj.dom;
            fn.call(eObj.dom, e);
            if (e._stopPropagation) {
                break;
            }
        }
    }
}


var eventLowerCache = {
    onClick: "click",
    onChange: "change",
    onWheel: "wheel"
};
var rcapture = /Capture$/;
function getBrowserName(onStr) {
    var lower = eventLowerCache[onStr];
    if (lower) {
        return lower;
    }
    var camel = onStr.slice(2).replace(rcapture, "");
    lower = camel.toLowerCase();
    eventLowerCache[onStr] = lower;
    return lower;
}
function addEvent(name) {
    if (!globalEvent[name]) {
        globalEvent[name] = true;
        addDocumentEvent(document$1, name, dispatchEvent);
    }
}

function addDocumentEvent(el, name, fn, bool) {
    if (el.addEventListener) {
        el.addEventListener(name, fn, bool || false);
    } else if (el.attachEvent) {
        el.attachEvent('on' + name, fn);
    }

}
function SyntheticEvent(event) {
    if (event.nativeEvent) {
        return event;
    }
    if (!this.target) {
        this.target = event.srcElement;
    }
    for (var i in event) {
        if (!eventProto[i]) {
            this[i] = event[i];
        }
    }
    this.timeStamp = new Date() - 0;
    this.nativeEvent = event;
}

function createHandle(name, fn) {
    return function (e) {
        if (fn && fn(e) === false) {
            return;
        }
        dispatchEvent(e, name);
    };
}
if (isTouch) {
    eventHooks.click = noop;
    eventHooks.clickcapture = noop;
}

var changeHandle = createHandle("change");
var doubleClickHandle = createHandle("doubleclick");

//react将text,textarea,password元素中的onChange事件当成onInput事件
eventHooks.changecapture = eventHooks.change = function (dom) {
    if (/text|password/.test(dom.type)) {
        addDocumentEvent(document$1, "input", changeHandle);
    }
};

eventHooks.doubleclick = eventHooks.doubleclickcapture = function () {
    addDocumentEvent(document$1, "dblclick", doubleClickHandle);
};
var eventProto = (SyntheticEvent.prototype = {
    preventDefault: function () {
        var e = this.nativeEvent || {};
        e.returnValue = this.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    },
    fixHooks: function () { },
    stopPropagation: function () {
        var e = this.nativeEvent || {};
        e.cancleBubble = this._stopPropagation = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    },
    persist: noop,
    stopImmediatePropagation: function () {
        this.stopPropagation();
        this.stopImmediate = true;
    },
    toString: function () {
        return "[object Event]";
    }
});
Object.freeze ||
    (Object.freeze = function (a) {
        return a;
    });


function isFn(obj) {
    return Object.prototype.toString.call(obj) === "[object Function]";
}

function noop() { }

/* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
            firefox DOMMouseScroll detail 下3 上-3
            firefox wheel detlaY 下3 上-3
            IE9-11 wheel deltaY 下40 上-40
            chrome wheel deltaY 下100 上-100 */
/* istanbul ignore next  */
const fixWheelType = "onmousewheel" in document$1 ? "mousewheel" : document$1.onwheel !== void 666 ? "wheel" : "DOMMouseScroll";
const fixWheelDelta = fixWheelType === "mousewheel" ? "wheelDetla" : fixWheelType === "wheel" ? "deltaY" : "detail";
eventHooks.wheel = function (dom) {
    addDocumentEvent(dom, fixWheelType, function (e) {
        var delta = e[fixWheelDelta] > 0 ? -120 : 120;
        var deltaY = ~~dom.__wheel + delta;
        dom.__wheel = deltaY;
        e = new SyntheticEvent(e);
        e.type = "wheel";
        e.deltaY = deltaY;
        dispatchEvent(e);
    });
};

var fixFocus = {};
"blur,focus".replace(/\w+/g, function (type) {
    eventHooks[type] = function () {
        if (!fixFocus[type]) {
            fixFocus[type] = true;
            addDocumentEvent(document$1, type, dispatchEvent, true);
        }
    };
});
/**
 * 
DOM通过event对象的relatedTarget属性提供了相关元素的信息。这个属性只对于mouseover和mouseout事件才包含值；
对于其他事件，这个属性的值是null。IE不支持realtedTarget属性，但提供了保存着同样信息的不同属性。
在mouseover事件触发时，IE的fromElement属性中保存了相关元素；
在mouseout事件出发时，IE的toElement属性中保存着相关元素。
但fromElement与toElement可能同时都有值
 */
function getRelatedTarget(e) {
    if (!e.timeStamp) {
        e.relatedTarget = e.type === "mouseover" ? e.fromElement : e.toElement;
    }
    return e.relatedTarget;
}

function contains(a, b) {
    if (b) {
        while ((b = b.parentNode)) {
            if (b === a) {
                return true;
            }
        }
    }
    return false;
}

String("mouseenter,mouseleave").replace(/\w+/g, function (type) {
    eventHooks[type] = function (dom, name) {
        var mark = "__" + name;
        if (!dom[mark]) {
            dom[mark] = true;
            var mask = name === "mouseenter" ? "mouseover" : "mouseout";
            addDocumentEvent(dom, mask, function (e) {
                let t = getRelatedTarget(e);
                if (!t || (t !== dom && !contains(dom, t))) {
                    var common = getLowestCommonAncestor(dom, t);
                    //由于不冒泡，因此paths长度为1
                    dispatchEvent(e, name, common);
                }
            });
        }
    };
});

function getLowestCommonAncestor(instA, instB) {
    var depthA = 0;
    for (var tempA = instA; tempA; tempA = tempA.parentNode) {
        depthA++;
    }
    var depthB = 0;
    for (var tempB = instB; tempB; tempB = tempB.parentNode) {
        depthB++;
    }

    // If A is deeper, crawl up.
    while (depthA - depthB > 0) {
        instA = instA.parentNode;
        depthA--;
    }

    // If B is deeper, crawl up.
    while (depthB - depthA > 0) {
        instB = instB.parentNode;
        depthB--;
    }

    // Walk in lockstep until we find a match.
    var depth = depthA;
    while (depth--) {
        if (instA === instB) {
            return instA;
        }
        instA = instA.parentNode;
        instB = instB.parentNode;
    }
    return null;
}

//之前是 mount的时候setDomAttr一个方法 diff的时候diffProps一个方法
//后来发现 写着写着要修改点setDomAttr的内容 diff的时候还要在判断一遍
//那干脆把这两个合成一个方法好了
function diffProps(prev, now) {
    var props = now.props;
    var hostNode = now.mayInfo.hostNode;
    var prevStyle = prev && prev.props.style;
    var nowStyle = props.style;
    if (!prev) { //setDomAttr
        for (var key in props) {
            setDomAttr(hostNode, key, props[key]);
        }
        if (nowStyle) {
            patchStyle(hostNode, prevStyle, nowStyle);
        }
    } else {
        var prevProps = prev.props;
        for (var name in props) {
            if (name !== 'children' && !(props[name] === prevProps[name])) {
                setDomAttr(hostNode, name, props[name]);
            }
        }
        for (var prop in prevProps) {
            if (prop !== 'children' && (props[prop] === void 666)) {
                removeDomAttr(hostNode, prevProps, prop);
            }
        }

        if (prevStyle !== nowStyle) {
            patchStyle(hostNode, prevStyle, nowStyle);
        }
    }

}

var FormElement = {
    input: 1,
    select: 1,
    // option: 1,
    textarea: 1
};
/**
 * 设置DOM属性
 * @param {*} dom 
 * @param {*} key 
 * @param {*} val 
 */
function setDomAttr(dom, key, val) {
    var nodeType = dom.nodeType;
    // Don't get/set attributes on text, comment and attribute nodes
    if (nodeType === 3 || nodeType === 8 || nodeType === 2) {
        return;
    }
    if (!isEvent(key)) {
        switch (key) {
            case 'children':
            case 'style':
            case 'key':
                break;
            case 'dangerouslySetInnerHTML':
                var html = val && val.__html;
                dom.innerHTML = html;
                break;
            case 'defaultValue': //input等受控组件
                key = 'value';
            case 'className':
                key = 'class';
            default:
                if (key in dom) { //property
                    try {
                        if (val !== null && val !== false) {
                            dom[key] = val;
                        }
                    } catch (e) {
                        dom.setAttribute(key, val + '');
                    }
                } else { //attribute
                    if (val !== null && val !== false) {
                        //attribute 永远是字符串
                        dom.setAttribute(key, val + '');
                    } else {
                        //如果是null 或 false 不必添加
                        dom.removeAttribute(key);
                    }
                }
                break;
        }

    } else {
        var e = key.substring(2).toLowerCase();
        var eventName = getBrowserName(key);
        var listener = dom._listener || (dom._listener = {});
        if (!listener[e]) {
            //添加过一次之后不必再添加;
            addEvent(eventName);
            var hook = eventHooks[eventName];
            if (hook) {
                //input的change等特殊事件需要特殊处理
                hook(dom, eventName);
            }
        }
        listener[e] = val;
    }
}
function removeDomAttr(dom, props, key) {
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
                if (key in dom) {
                    dom[key] = '';
                } else {
                    dom.removeAttribute(key);
                }
        }
    } else {
        var e = key.substring(2).toLowerCase();
        if (dom._listener && dom._listener[e]) {
            delete dom._listener[e];
        }
    }
}

function isEvent(name) {
    return /^on[A-Z]/.test(name);
}
function patchStyle(dom, prevStyle, newStyle) {
    var _style = '';
    for (var name in newStyle) {
        var _type = typeof newStyle[name];
        //backgroundColor 替换为 background-color Webkit替换为-webkit-   ms单独替换一次
        var cssName = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/i, '-ms-');
        switch (_type) {
            case 'string':
                _style = newStyle[name].trim();
                break;
            case 'number':
                _style = newStyle[name];
                if (cssSuffix[name]) {
                    _style += newStyle[name] !== 0 ? +cssSuffix[name] : '';
                }
                break;
            case 'boolean':
                _style = '';
                break;
            default:
                _style = newStyle[name];
                break;
        }
        dom.style[cssName] = _style;
    }
    for (var key in prevStyle) {
        if (!newStyle || !(key in newStyle)) {
            key = key.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/i, '-ms-');
            dom.style[key] = '';
        }
    }
}
/**
 input, select, textarea这几个元素如果指定了value/checked的**状态属性**，就会包装成受控组件或非受控组件
受控组件是指，用户除了为它指定**状态属性**，还为它指定了onChange/onInput/disabled等用于控制此状态属性
变动的属性
反之，它就是非受控组件，非受控组件会在框架内部添加一些事件，阻止**状态属性**被用户的行为改变，只能被setState改变
*/
var eGroup = [{
    'onChange': 1,
    'onInput': 1,
    'readOnly': 1,
    'disabled': 1
}, {
    'onChange': 1,
    'onClick': 1,
    'readOnly': 1,
    'disabled': 1
}, {
    'onChange': 1,
    'disabled': 1
}];
function getIsControlled(hostNode, vnode) {
    //记录第一次render的值 非受控组件值不可变
    var type = hostNode.type;
    var hasValue, isControlled, eObj, event, ename;
    var vprops = vnode.props;
    switch (type) {
        case 'text':
        case 'textarea':
            //非受控组件有value属性 但是没有绑定修改value的onChange等事件
            hasValue = 'value' in vprops;
            ename = 'oninput';
            eObj = eGroup[0];
            //如果是非受控组件那么我们需要阻止用户改变数据
            event = preventInput;
            break;
        case 'checkbox':
        case 'radio':
            hasValue = 'checked' in vprops;
            ename = 'onclick';
            eObj = eGroup[1];
            event = preventClick;
            break;
        case 'select-one':
        case 'select-multiple':
            hasValue = 'value' in vprops;
            ename = 'onchange';
            eObj = eGroup[2];
            event = preventChange;
            var _val = vnode.props['value'] || vnode.props['defaultValue'] || '';
            var _optionsChilds = [].slice.call(hostNode.childNodes);
            if (_optionsChilds) {
                for (var k = 0; k < _optionsChilds.length; k++) {
                    var oChild = _optionsChilds[k];
                    if (oChild.value === _val) {
                        oChild.selected = true;
                        hostNode._selectIndex = k;
                    }
                }
            }
            break;
    }
    isControlled = hasValue && hasEventProps(vprops, eObj);
    if (!isControlled) {
        console.warn(vnode.type + (vprops['type'] ? ('[type=' + vprops['type'] + ']') : '') + '元素为非受控组件，用户无法通过输入改变元素的值;更多信息参见React官方文档https://reactjs.org/docs/uncontrolled-components.html');
        setDomAttr(hostNode, ename, event);
    }
    return isControlled;
}

function preventInput(e) {
    var target = e.target;
    var name = e.type === "textarea" ? "innerHTML" : "value";
    target[name] = target._lastValue;
}

function preventClick(e) {
    e.preventDefault();
}

function preventChange(e) {
    var target = e.target;
    if (target._selectIndex) {
        target.options[target._selectIndex].selected = true;
    }
}

function hasEventProps(props, events) {
    for (var key in props) {
        if (events[key]) {
            return true;
        }
    }
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
};

var NAMESPACE = {
    html: 'http://www.w3.org/1999/xhtml',
    mathml: 'http://www.w3.org/1998/Math/MathML',
    svg: 'http://www.w3.org/2000/svg'
};

/**
 * 如果instance具备getChildContext方法 则调用
 * @param {component实例} instance 
 * @param {当前上下文} context 
 */
function getChildContext(instance, context) {
    var prevProps = instance.props;
    if (instance.nextProps) {
        instance.props = instance.nextProps;
    }
    var getContext = instance.getChildContext();
    if (instance.nextProps) {
        instance.props = prevProps;
    }
    if (getContext && typeof getContext === 'object') {
        if (!context) {
            context = {};
        }
        context = Object.assign(context, getContext);
    }
    return context;
}
function getContextByTypes(context, typeCheck) {
    var ret = {};
    if (!context || !typeCheck) {
        return ret;
    }
    for (const key in typeCheck) {
        if (context.hasOwnProperty(key)) {
            ret[key] = context[key];
        }
    }
    return ret;
}

var REAL_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
var FAKE_SYMBOL = "@@iterator";

function getIteractor(a) {
    var iteratorFn = REAL_SYMBOL && a[REAL_SYMBOL] || a[FAKE_SYMBOL];
    if (iteratorFn && iteratorFn.call) {
        return iteratorFn;
    }
}

function callIteractor$1(iteratorFn, children) {
    var iterator = iteratorFn.call(children),
        step,
        ret = [];
    if (iteratorFn !== children.entries) {
        while (!(step = iterator.next()).done) {
            ret.push(step.value);
        }
    } else {
        //Map, Set
        while (!(step = iterator.next()).done) {
            var entry = step.value;
            if (entry) {
                ret.push(entry[1]);
            }
        }
    }
    return ret;
}

//https://segmentfault.com/a/1190000010336457  司徒正美先生写的分析
//hydrate是最早出现于inferno(另一个著名的react-like框架)，并相邻的简单数据类型合并成一个字符串。
//因为在react的虚拟DOM体系中，字符串相当于一个文本节点。减少children中的个数，
//就相当减少实际生成的文本节点的数量，也减少了以后diff的数量，能有效提高性能。

//render过程中有Key的 是最有可能变动的，无Key的很可能不会变（绝大部分情况）
//把children带Key的放一起  不带Key的放一起（因为他们很可能不变化，顺序也不变减少diff寻找）
function transformChildren(renderedVnode, parent) {
    var children = renderedVnode.props.children || null;
    if (children && !Array.isArray(children)) {
        children = [children];
    }
    var len = children ? children.length : 0;
    var childList = [].slice.call(parent.childNodes);
    var result = children ? {} : null;
    //如有undefined null 简单数据类型合并 noCount++;
    var noCount = 0;
    for (var i = 0; i < len; i++) {
        var c = children[i];
        var __type = typeof c;
        switch (__type) {
            case 'object':
                if (c.type) {
                    if (c.mayInfo.reused) {
                        //如果该组件 diff 两次 第一次vnode重用之后_reused为true
                        //生成vchildren时需要其为false 否则第二次diff
                        c.mayInfo.reused = false;
                    }
                    var _key = genKey(c);
                    if (!result[_key]) {
                        result[_key] = [c];
                    } else {
                        result[_key].push(c);
                    }
                    if (c.ref) { //如果子dom有ref 标识一下 
                        var owner = renderedVnode.mayInfo.refOwner;
                        if (owner) {
                            if (owner.refs) {
                                owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
                            } else {
                                owner.refs = {};
                                owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
                            }
                        }
                    }
                } else {
                    var iteratorFn = getIteractor(c);
                    if (iteratorFn) {
                        var ret = callIteractor$1(iteratorFn, c);
                        for (var _i = 0; _i < ret.length; _i++) {
                            var _key = genKey(ret[_i]);
                            if (!result[_key]) {
                                result[_key] = [ret[_i]];
                            } else {
                                result[_key].push(ret[_i]);
                            }
                        }
                    }
                }

                break;
            case 'number':
            case 'string':
                //相邻的简单数据类型合并成一个字符串
                var tran = {
                    type: '#text',
                    mtype: 4,
                    value: c,
                    mayInfo: {}
                };
                if (childList[i - noCount]) {
                    tran.mayInfo.hostNode = childList[i - noCount];
                }
                if ((i + 1 < len)) {
                    var _ntype = typeof children[i + 1 - noCount];
                    if (_ntype === 'string' || _ntype === 'number') {
                        tran.value += children[i + 1 - noCount];
                        noCount++;
                        i++;
                    }
                }
                var _k = '#text';
                if (!result[_k]) {
                    result[_k] = [tran];
                } else {
                    result[_k].push(tran);
                }
                break;
            default:
                noCount++;
                break;
        }
    }
    return result;
}
function genKey(child) {
    return !child.key ? (child.type.name || child.type) : ('_$' + child.key);
}

var mountOrder = 0;
function buildComponentFromVnode(vnode) {
    var props = vnode.props;
    var key = vnode.key;
    var ref = vnode.ref;
    var context = vnode.context;
    var inst, rendered;
    var Ctor = vnode.type;
    //Component  PureComponent
    if (Ctor.prototype && Ctor.prototype.render) {
        //props, context需要放在前俩
        inst = new Ctor(props, context, key, ref);
        //constructor里面props不可变
        inst.props = props;
        inst.refType = vnode.refType;
        inst.mayInst.mountOrder = mountOrder;
        mountOrder++;
        //_lifeState来控制生命周期中调用setState的作用
        //为0代表刚创建完component实例 (diff之后也会重置为0)
        inst.mayInst.lifeState = 0;

        if (inst.componentWillMount) {
            //此时如果在componentWillMount调用setState合并state即可
            //为1代表componentWillMount
            inst.mayInst.lifeState = 1;
            inst.componentWillMount();
        }
        if (inst.mayInst.mergeStateQueue) {
            inst.state = mergeState(inst);
        }
        //为2代表开始render
        //children 初次render的生命周期render DidMount
        //调用父组件的setState 都放在父组件的下一周期;
        inst.mayInst.lifeState = 2;
        rendered = inst.render(props, context);
        if (inst.getChildContext) {
            context = getChildContext(inst, context);
        }
        if (vnode.getContext) {
            inst.context = getContextByTypes(context, Ctor.contextTypes);
        }
        rendered && (rendered.mayInfo.refOwner = inst);
    } else {
        //StatelessComponent 我们赋给它一个inst 省去之后判断inst是否为空等;
        inst = {
            mayInst: {
                stateless: true
            },
            render: function (type) {
                return type(this.props, this.context);
            }
        };
        rendered = inst.render.call(vnode, Ctor);
        //should support module pattern components
        if (rendered && rendered.render) {
            console.warn('不推荐使用这种module-pattern component建议换成正常的Component形式,目前只支持render暂不支持其它生命周期方法');
            rendered = rendered.render.call(vnode, props, context);
        }
    }
    if (rendered) {
        //需要向下传递context
        rendered.context = context;
    }
    vnode.mayInfo.instance = inst;
    inst.mayInst.rendered = rendered;
    return rendered;
}

//React是根据type类型分成不同的Component各自具备各自的mount与update方法
//我们这里简化成根据type类型调用不同的方法
//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
var mountStrategy = {
    1: mountDOM, //dom
    2: mountComposite, //component
    3: mountDOM, //svg dom
    4: mountText //text
};

function mountDOM(vnode, isSVG) {
    var vtype = vnode.type;
    vnode.mayInfo.isSVG = isSVG;
    var hostNode = !isSVG ? document.createElement(vtype) : document.createElementNS(NAMESPACE.svg, vnode.type);
    if (Refs.isRoot) {
        Refs.currentOwner = hostNode;
        hostNode.refs = {};
        Refs.isRoot = false;
    }
    vnode.mayInfo.hostNode = hostNode;
    diffProps(null, vnode);

    var children = vnode.props.children;
    if (!Array.isArray(children)) {
        children = [children];
    }
    var cdom, c;

    var len = children.length;
    for (let i = 0; i < len; i++) {
        var c = children[i];
        var type = typeof c;
        switch (type) {
            case 'number':
            case 'string':
                cdom = document.createTextNode(c);
                if ((i + 1) < len && (typeof children[i + 1] === 'string')) {
                    cdom.nodeValue += children[i + 1];
                    i++;
                }
                hostNode.appendChild(cdom);
                break;
            case 'object': //vnode
                if (c.type) {
                    c.context = getContextByTypes(vnode.context, c.type.contextTypes);
                    cdom = mountStrategy[c.mtype](c, isSVG);
                    c.mtype === 2 && (c.mayInfo.instance.mayInst.hostNode = cdom);
                    hostNode.appendChild(cdom);
                } else { //有可能是子数组iterator
                    var iteratorFn = getIteractor(c);
                    if (iteratorFn) {
                        var ret = callIteractor$1(iteratorFn, c);
                        for (var _i = 0; _i < ret.length; _i++) {
                            cdom = mountStrategy[ret[_i].mtype](ret[_i], isSVG);
                            ret[_i].mayInfo.hostNode = cdom;
                            hostNode.appendChild(cdom);
                        }
                    }
                }
        }
    }
    vnode.mayInfo.vChildren = transformChildren(vnode, hostNode);

    if (FormElement[vtype]) {
        //如果是受控组件input select之类需要特殊处理下
        if (vnode.props) {
            var _val = vnode.props['value'] || vnode.props['defaultValue'] || '';
            getIsControlled(hostNode, vnode);
            hostNode._lastValue = _val;
        }
    }
    //本来想放在调度模块的 但是这种vnode type为dom类型的 func是要在DidMount之前调用的
    //因为DidMount中可能用到;
    if (vnode.ref) {
        Refs.attachRef(vnode, hostNode);
    }
    return hostNode;
}



function mountComposite(vnode, isSVG) {
    var hostNode = null;
    var rendered = buildComponentFromVnode(vnode);
    var inst = vnode.mayInfo.instance;
    if (!inst.mayInst.stateless && Refs.isRoot) {
        Refs.currentOwner = inst;
        inst.refs = {};
        Refs.isRoot = false;
    }
    if (rendered) {
        if (!isSVG) {
            //svg的子节点namespace也是svg
            isSVG = rendered.mtype === 3;
        }
        //递归遍历 深度优先
        hostNode = mountStrategy[rendered.mtype](rendered, isSVG);
        //dom diff需要分类一下children以方便diff
        rendered.mayInfo.vChildren = transformChildren(rendered, hostNode);
        // rendered.mayInfo.hostNode = hostNode;
    } else { //render 返回null
        hostNode = document.createComment('empty');
        vnode.mayInfo.hostNode = hostNode;
        //用于isMounted 判断 即使是null
        inst.mayInst.isEmpty = true;
    }
    if (inst.componentDidMount) {
        lifeCycleQueue.push(inst.componentDidMount.bind(inst));
    } else {
        //如果没有回调则其render生命周期结束lifeState为0
        inst.mayInst.lifeState = 0;
    }
    if (vnode.ref) {
        Refs.attachRef(vnode, inst);
    }

    return hostNode;
}

function mountText(vnode) {
    if (vnode) {
        var node = recyclables['#text'].pop();
        if (node) {
            node.nodeValue = node.value;
            return node;
        }
        return document.createTextNode(vnode.value);
    } else {
        return document.createComment('empty');
    }
}

function disposeVnode(vnode) {
    if (!vnode) {
        return;
    }
    if (vnode.refType === 1) {
        vnode.ref(null);
        vnode.ref = null;
    }
    if (vnode.mayInfo.instance) {
        disposeComponent(vnode, vnode.mayInfo.instance);
    } else if (vnode.mtype === 1) {
        disposeDomVnode(vnode);
    }
    vnode.mayInfo = null;
}
function disposeDomVnode(vnode) {
    var children = vnode.mayInfo.vChildren;
    if (children) {
        for (var c in children) {
            children[c].forEach(function (child) {
                disposeVnode(child);
            });
        }
        vnode.mayInfo.vChildren = null;
    }
    if (vnode.mayInfo.refOwner) {
        vnode.mayInfo.refOwner = null;
    }
    vnode.mayInfo = null;
}

function disposeComponent(vnode, instance) {
    if (instance.setState) {
        instance.setState = noop$1;
        instance.forceUpdate = noop$1;
    }
    if (instance.componentWillUnmount) {
        instance.componentWillUnmount();
        instance.componentWillUnmount = noop$1;
    }
    if (instance.refs) {
        instance.refs = null;
    }
    if (instance.mayInst.rendered) {
        // vnode.mayInfo.rendered = null;
        disposeVnode(instance.mayInst.rendered);
    }
    instance.mayInst.forceUpdate = instance.mayInst.dirty = vnode.mayInfo.instance = instance.mayInst = null;
}
var isStandard = 'textContent' in document;
var fragment = document.createDocumentFragment();
function disposeDom(dom) {
    if (dom._listener) {
        dom._listener = null;
    }
    if (dom.nodeType === 1) {
        if (isStandard) {
            dom.textContent = '';
        } else {
            emptyElement(dom);
        }
    } else if (dom.nodeType === 3) {
        if (recyclables['#text'].length < 100) {
            recyclables['#text'].push(dom);
        }
    }
    fragment.appendChild(dom);
    fragment.removeChild(dom);
}
function emptyElement(dom) {
    var c;
    while (c = dom.firstChild) {
        emptyElement(c);
        dom.removeChild(c);
    }
}

function noop$1() { }

//diff根据vnode的不同类型调用不同的diff方法~
//其实写着写着就发现还是类似React 根据不同的类型生成不同的Component
//拥有对应的diff方法;
var updateStrategy = {
    1: updateDOM, //dom
    2: updateComposite, //component
    3: updateDOM, //svg dom
    4: updateText //text
};

function updateDOM(prevVnode, newVnode) {
    if (prevVnode.refType === 1) {
        prevVnode.ref(null);
    }
    var hostNode = (prevVnode && prevVnode.mayInfo.hostNode) || null;
    var vtype = newVnode.type;
    if (!newVnode.mayInfo.hostNode) {
        newVnode.mayInfo.hostNode = hostNode;
    }
    if (Refs.isRoot) {
        Refs.currentOwner = hostNode;
        hostNode.refs = {};
        Refs.isRoot = false;
    }
    var isSVG = hostNode && hostNode.namespaceURI === NAMESPACE.svg;
    if (isSVG) {
        newVnode.mayInfo.isSVG = true;
    }
    diffProps(prevVnode, newVnode);
    diffChildren(prevVnode, newVnode, hostNode);
    newVnode.mayInfo.vChildren = transformChildren(newVnode, hostNode);
    if (FormElement[vtype]) {
        //如果是受控组件input select之类需要特殊处理下
        if (newVnode.props) {
            var isControlled = getIsControlled(hostNode, newVnode);
            var _val, hasSelected;
            if (isControlled) {
                _val = newVnode.props['value'] || hostNode._lastValue || '';
                switch (vtype) {
                    case 'select':
                        var _optionsChilds = [].slice.call(hostNode.childNodes);
                        if (_optionsChilds) {
                            for (var k = 0; k < _optionsChilds.length; k++) {
                                var oChild = _optionsChilds[k];
                                if (oChild.value === _val) {
                                    oChild.selected = true;
                                    hasSelected = true;
                                } else {
                                    oChild.selected = false;
                                }
                            }
                            if (!hasSelected) { //如果给定value没有选中的  默认第一个
                                hostNode.value = _optionsChilds[0].value;
                            }
                        }
                        break;

                }
            } else {
                //如果reRender时 dom去掉了value属性 则其变为非受控组件 value取上一次的值
                hostNode.value = hostNode._lastValue || '';
            }
        }

    }
    if (newVnode.ref) {
        Refs.attachRef(newVnode, hostNode);
    }

    return hostNode;
}

function updateComposite(prevVnode, newVnode) {
    if (prevVnode.refType === 1) {
        prevVnode.ref(null);
    }
    //如果newVnode没有定义contextTypes 在componentWillReceiveProps等生命周期方法中
    //是不应该传入context的 那么用空的temporaryContext代替
    var temporaryContext = {};
    var context = newVnode.context || {};
    if (newVnode.getContext) {
        context = getContextByTypes(context, newVnode.type.contextTypes);
        temporaryContext = context;
    }
    var instance = prevVnode.mayInfo.instance;
    var prevRendered = instance.mayInst.rendered;
    var hostNode = (prevRendered && prevRendered.mtype === 1) ? prevRendered.mayInfo.hostNode : instance.mayInst.hostNode;
    //empty代表prevVnode为null
    var isEmpty = instance.mayInst.isEmpty || (hostNode && hostNode.nodeType === 8);
    var newDom, newRendered, prevState, prevProps;
    var skip = false;
    if (!instance.mayInst.stateless) {
        //需要兼容componentWillReceiveProps直接this.state={///}的情况
        //先保存下之前的state
        prevState = instance.state;
        prevProps = prevVnode.props;
        //lifeState为3组件开始diff
        //WillReceive WillUpdate render DidUpdate等周期setState放到下一周期;
        instance.mayInst.lifeState = 3;
        //用于mergeState如果setState传入一个function s.call(instance, newState, instance.nextProps || instance.props);
        //其参数应当是newState nextProps
        instance.nextProps = newVnode.props;
        if (instance.getChildContext) {
            //getChildContext 有可能用到新的props
            context = getChildContext(instance, context);

        }
        var newState = mergeState(instance);
        //如果context与props都没有改变，那么就不会触发组件的receive，render，update等一系列钩子
        //但还会继续向下比较
        var needReceive = prevVnode !== newVnode || prevVnode.context !== context;
        if (needReceive) {
            if (instance.componentWillReceiveProps) {
                //componentWillReceiveProps中调用了setState 合并state
                instance.mayInst.lifeState = 1;
                instance.componentWillReceiveProps(newVnode.props, temporaryContext);
                if (instance.mayInst.mergeStateQueue && instance.mayInst.mergeStateQueue.length > 0) {
                    newState = mergeState(instance);
                } else { //this.state={///}的情况
                    if (instance.state !== prevState) {
                        newState = instance.state;
                        instance.state = prevState;
                    }
                }
            }
            instance.mayInst.lifeState = 3;
        } else {
            var rendered = instance.mayInst.rendered;
            //context穿透更新问题
            rendered.context = newVnode.temporaryContext || context;
            hostNode = updateStrategy[rendered.mtype](rendered, rendered);
            return hostNode;
        }

        //shouldComponentUpdate 返回false 则不进行子组件渲染
        if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(newVnode.props, newState, temporaryContext) === false) {
            skip = true;
        } else if (instance.componentWillUpdate) {
            instance.componentWillUpdate(newVnode.props, newState, temporaryContext);
        }
        newVnode.mayInfo.instance = instance;
        instance.props = newVnode.props;
        if (skip) {
            instance.state = newState;
            instance.context = context;
            instance.mayInst.dirty = false;
            return hostNode;
        }
        instance.state = newState;
        instance.context = context;
        if (Refs.isRoot) {
            Refs.currentOwner = instance;
            Refs.currentOwner.refs = {};
            Refs.isRoot = false;
        }

        newRendered = instance.render();
        newRendered && (newRendered.context = context);
        instance.mayInst.rendered = newRendered;
        if (!isEmpty && newRendered) {
            if (isSameType(prevRendered, newRendered)) {
                hostNode = updateStrategy[newRendered.mtype](prevRendered, newRendered);
                newRendered.mayInfo.hostNode = hostNode;
            } else {
                disposeVnode(prevRendered);
                var isSVG = newRendered.mtype === 3;
                newDom = mountStrategy[newRendered.mtype](newRendered, isSVG);
                newRendered.mayInfo.hostNode = newDom;
                hostNode.parentNode.replaceChild(newDom, hostNode);
            }
        } else {
            if (isEmpty && newRendered) {
                var isSVG = newRendered.mtype === 3;
                newDom = mountStrategy[newRendered.mtype](newRendered, isSVG);
                newRendered.mayInfo.hostNode = newDom;
                if (hostNode.parentNode) {
                    hostNode.parentNode.replaceChild(newDom, hostNode);
                }
            } else {
                hostNode = document.createComment('empty');
                instance.mayInst.hostNode = hostNode;
                instance.mayInst.isEmpty = true;
            }
            //如果之前node为空 或 新render的为空 直接释放之前节点
            disposeVnode(prevRendered);
        }
        if (!instance.mayInst.needNextRender) {
            instance.mayInst.dirty = false;
            instance.mayInst.needNextRender = false;
        }
        if (newDom) {
            hostNode = newDom;
        }
        if (instance.componentDidUpdate) {
            lifeCycleQueue.push(instance.componentDidUpdate.bind(instance, prevProps, prevState, instance.context));
        } else {
            //如果没有回调则其render生命周期结束lifeState为0
            instance.mayInst.lifeState = 0;
        }
        if (newVnode.refType === 1) {
            Refs.attachRef(newVnode, instance);
        }

    } else { //stateless component
        var newRendered = newVnode.type.call(newVnode, newVnode.props, newVnode.context);
        newRendered.context = newVnode.context;
        if (prevRendered && isSameType(prevRendered, newRendered)) {
            hostNode = updateStrategy[newRendered.mtype](prevRendered, newRendered);
            newRendered.mayInfo.hostNode = hostNode;

        } else if (newVnode) {
            disposeVnode(prevRendered);
            var isSVG = newVnode.mtype === 3;
            newDom = mountStrategy[newVnode.mtype](newVnode, isSVG);
            newVnode.mayInfo.hostNode = newDom;
            hostNode.parentNode.replaceChild(newDom, hostNode);
            hostNode = newDom;
        }

    }
    return hostNode;
}

function updateText(prev, now) {
    var hostNode = now.mayInfo.hostNode || null;
    if (prev) { //child._prevVnode
        if (hostNode.nodeValue !== now.value) {
            hostNode.nodeValue = now.value;
        }
    } else {
        hostNode = document.createTextNode(now.value);
    }
    return hostNode;
}
function diffChildren(prevVnode, updatedVnode, parent) {
    var prevChildren = prevVnode.mayInfo.vChildren || null;
    var newRenderedChild = updatedVnode.props.children;
    if (newRenderedChild && !Array.isArray(newRenderedChild)) {
        newRenderedChild = [newRenderedChild];
    }
    //diff之前 遍历prevchildren 与newChildren 如有相同key的只对其props diff
    var _mountChildren = [];
    var _unMountChildren = [];
    var k, prevK, _prevK, _tran;
    if (newRenderedChild) {
        var len = newRenderedChild.length;
        for (var i = 0; i < len; i++) {
            var c = newRenderedChild[i];
            var t = typeof c;
            switch (t) {
                case 'object':
                    k = genKey(c);
                    //
                    if (c.type && c.type.contextTypes) {
                        c.context = getContextByTypes(updatedVnode.context, c.type.contextTypes);
                    } else {
                        c.context = {};
                        //该组件没有定义contextTypes 无法使用context
                        //我们还是需要保存一份context
                        c.temporaryContext = updatedVnode.context;
                    }
                    break;
                case 'boolean':
                    k = "#text";
                    _tran = {
                        type: '#text',
                        mtype: 4, //text
                        value: '',
                        mayInfo: {}
                    };
                    c = _tran;
                    break;
                case 'number':
                case 'string':
                    k = "#text";
                    _tran = {
                        type: '#text',
                        mtype: 4, //text
                        value: c,
                        mayInfo: {}
                    };
                    c = _tran;
                    //相邻简单数据类型合并
                    if ((i + 1 < newRenderedChild.length)) {
                        var _ntype = typeof newRenderedChild[i + 1];
                        if (_ntype === 'string' || _ntype === 'number') {
                            c.value += newRenderedChild[i + 1];
                            i++;
                        }
                    }
                    break;
                case 'undefined':
                    break;
            }
            prevK = prevChildren && prevChildren[k];
            if (prevK && prevK.length > 0) { //试试=0 else
                for (var _i = 0; _i < prevK.length; _i++) {
                    var vnode = prevK[_i];
                    if (c.type === vnode.type && !vnode.mayInfo.used) {
                        vnode.mayInfo.hostNode && (c.mayInfo.hostNode = vnode.mayInfo.hostNode);
                        c.mayInfo.instance = vnode.mayInfo.instance;
                        c.mayInfo.prevVnode = vnode;
                        vnode.mayInfo.used = true;
                        c.mayInfo.reused = true;
                        break;
                    }
                }
            }
            if (c) {
                _mountChildren.push(c);
            }
        }
    }
    for (var name in prevChildren) {
        var _c = prevChildren[name];
        for (let j = 0; j < _c.length; j++) {
            if (!_c[j].mayInfo.used) _unMountChildren.push(_c[j]);
        }
    }
    flushMounts(_mountChildren, parent);
    flushUnMounts(_unMountChildren);
    _mountChildren.length = 0;
}

function flushMounts(newChildren, parent) {
    for (var _i = 0; _i < newChildren.length; _i++) {
        var child = newChildren[_i];
        var _node = parent.childNodes[_i];
        var newDom;
        if (child.mayInfo.prevVnode) { //如果可以复用之前节点
            var prevChild = child.mayInfo.prevVnode;
            delete child.mayInfo.prevVnode;
            newDom = updateStrategy[child.mtype](prevChild, child);
            if (_node && _node !== newDom) { //移动dom
                newDom = parent.removeChild(newDom);
                parent.insertBefore(newDom, _node);
            } else if (!_node) {
                parent.appendChild(newDom);
            }
        } else { //新增节点
            var isSVG = child.mtype === 3;
            // var isSVG = vnode.namespaceURI === "http://www.w3.org/2000/svg";
            newDom = mountStrategy[child.mtype](child, isSVG);
            child.mtype === 2 && (child.mayInfo.instance.mayInst.hostNode = newDom);
            // child.mayInfo.hostNode = newDom;
            if (_node) {
                parent.insertBefore(newDom, _node);
            } else {
                parent.appendChild(newDom);
            }
        }
    }
}

function flushUnMounts(oldChildren) {
    var c, dom;
    while (c = oldChildren.shift()) {
        if (c.mayInfo.hostNode) {
            dom = c.mayInfo.hostNode;
            c.mayInfo.hostNode = null;
        } else if (c.mtype === 2) {
            dom = c.mayInfo.instance.mayInst.hostNode;
        }
        disposeDom(dom);
        disposeVnode(c);
        c = null;
    }
}

function isSameType(prev, now) {
    return prev.type === now.type && prev.key === now.key;
}

function render(vnode, container, callback) {
	return renderByMay(vnode, container, callback);
}
/**
 * render传入的Component都是一个function 该方法的原型对象上绑定了render方法
 * @param {*} vnode 
 * @param {*} container 
 * @param {*} callback 
 */
var renderByMay = function (vnode, container, callback) {
	var renderedVnode, rootDom, result;
	var lastVnode = container._lastVnode || null;
	if (lastVnode) { //update
		Refs.isRoot = true;
		rootDom = mayUpdate(lastVnode, vnode, container);
	} else {
		if (vnode && vnode.type) {
			//为什么React使用var markup=renderChilden();这样的形式呢; 2018-1-13
			//因为如果按renderComponentChildren(renderedVnode, rootDom, _isSvg);传入container这种
			//碰上component嵌套不好处理 参见 ReactChildReconciler-test的 warns for duplicated array keys with component stack info
			var isSVG = vnode.mtype === 3;
			Refs.isRoot = true;
			rootDom = mountStrategy[vnode.mtype](vnode, isSVG);
			if (rootDom && container && container.appendChild) {
				container.appendChild(rootDom);
			} else {
				throw new Error('container参数错误');
			}
		} else {
			throw new Error('render参数错误');
		}
	}
	var instance = vnode.mayInfo.instance;
	result = instance && !instance.mayInst.stateless && instance || rootDom;
	//执行render过程中的回调函数lifeCycle ref等
	mayQueue.clearQueue();
	if (callback) { //render的 callback
		callback();
	}
	if (instance) {
		//render之后lifeState也初始化为0；
		instance.mayInst.lifeState = 0;
		instance.mayInst.hostNode = rootDom;
		//当我开始着手解决 层层嵌套的component 最底层的那个setState触发的时候lifeState并不为0
		//因为我不能确定其是否有componentDidMount的回调，它在这个回调setState是需要放到下一周期处理的
		//一种办法是该instance如果具备componentDidMount我把其lifeState标个值如10 setState的时候判断
		//另一种办法就是我新建一个instance队列 instance.pendingCallback=componentDidMount
		//然后我每次render完再遍历这个队列有回调就调用 这貌似就是ANU的逻辑吧~
		//快写完了我才发现~惭愧~看来还是自己写写好，不如琢如磨，怎么对这流程了如指掌，不胸有成竹又如何找寻这
		//最优方法
	}
	Refs.isRoot = false;
	Refs.currentOwner = null;
	container._lastVnode = vnode;
	return result;
};

function reRender(instance) {
	var prevProps = instance.props;
	var context = instance.context;
	var prevState = instance.state;
	var prevRendered = instance.mayInst.rendered;
	var isEmpty = instance.mayInst.isEmpty;
	var hostNode = instance.mayInst.hostNode;
	var skip = false;
	//lifeState为3组件开始diff
	//WillReceive WillUpdate render DidUpdate等周期setState放到下一周期;
	instance.mayInst.lifeState = 3;
	var newState = mergeState(instance);
	//forceUpdate时 忽略shouldComponentUpdate
	if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(prevProps, newState, context) === false) {
		skip = true;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate(prevProps, newState, context);
	}
	instance.state = newState;
	//getChildContext有可能setState 所以需要newState再调用
	if (instance.getChildContext) {
		context = getChildContext(instance, context);
	}
	if (skip) {
		instance.mayInst.dirty = false;
		return hostNode;
	}
	if (Refs.isRoot) {
		Refs.currentOwner = instance;
		Refs.isRoot = false;
	}
	var updated = instance.render(prevProps, context);
	instance.mayInst.rendered = updated;
	updated && (updated.context = context);
	if (!updated) {
		disposeVnode(prevRendered);
		return;
	}
	if (!isEmpty && isSameType(prevRendered, updated)) {

		// updated.mayInfo.instance = instance;
		// updated.mayInfo.hostNode = hostNode;
		hostNode = updateStrategy[updated.mtype](prevRendered, updated);
		//mtype === 1在这在设置instance会循环引用
		// updated.mtype === 2 && ();
		updated.mayInfo.vChildren = transformChildren(updated, hostNode);
		instance.mayInst.forceUpdate = null;
		//原先这种diffProps 再diffChildren的方式并未考虑到 render返回之后还是
		//组件怎么办，连续几个组件嵌套children都需要render怎么办 这些情况都是diffProps
		//无法处理的，当时想的是一个组件diff diff之后再diff下一个组件；但如果组件之间发生交互的
		//话是需要在一个处理流程的；那diff我们也需要这种递归的思想了，所以setState的时候我们设置
		//instance的_dirty为true如果父组件 子组件都dirty，父组件向下diff的过程中也会diff子组件
		//此时在子组件diff之后我们要把_dirty设为false 否则因为子组件也在diffQueue之中，会再进行
		//一次diff是多余的；不晓得我说明白没有~参考测试ReactCompositeComponentNestedState-state的
		//should provide up to date values for props
		// diffProps(prevRenderedVnode, updatedVnode);
	} else {

		var isSVG = updated.mtype === 3;
		var dom = mountStrategy[updated.mtype](updated, isSVG);
		//component上的hostNode保持最新
		// var lastVnode = hostNode.parentNode._lastVnode;
		// lastVnode && (lastVnode.mayInfo.hostNode = dom);
		hostNode.parentNode.replaceChild(dom, hostNode);
		// updated.mayInfo.hostNode = dom;
		hostNode = dom;
		instance.mayInst.hostNode = dom;
		updated.mayInfo.vChildren = transformChildren(updated, hostNode);
		instance.mayInst.forceUpdate = null;
		disposeVnode(prevRendered);
	}

	if (instance.componentDidUpdate) {
		instance.componentDidUpdate(prevProps, prevState, instance.context);
		// lifeCycleQueue.push(instance.componentDidUpdate.bind(instance, prevProps, prevState, instance.context));
	} else {
		instance.mayInst.lifeState = 0;
	}
	//needNextRender情况是 子组件在diff生命周期(如WillReceiveProps)调用父组件的setState
	//这种情况下父组件需要再进行一次diff，不过本地diff完成时c.mayInst.dirty 会为false 所以需要
	//mayInst.dirty为true;ReactCompositeComponentState-test 的should update state when called from child cWRP
	if (!instance.mayInst.needNextRender) {
		instance.mayInst.dirty = false;
		instance.mayInst.needNextRender = false;
	}

}

function mayUpdate(prevVnode, newVnode, parent) {
	var dom;
	if (isSameType(prevVnode, newVnode)) {
		dom = updateStrategy[newVnode.mtype](prevVnode, newVnode);
	} else {
		var isSVG = newVnode.mtype === 3;
		dom = mountStrategy[newVnode.mtype](newVnode, isSVG);
		var hostNode = (prevVnode && prevVnode.mtype === 1) ? prevVnode.mayInfo.hostNode : prevVnode.mayInfo.instance.mayInst.hostNode;
		if (!parent) {
			parent = hostNode && hostNode.parentNode;
		}
		parent.replaceChild(dom, hostNode);
		disposeVnode(prevVnode);
		hostNode = null;
	}
	// newVnode.mtype === 2 && (newVnode.mayInfo.instance.mayInst.hostNode = dom);
	// newVnode.mayInfo.hostNode = dom;
	return dom;
}

function unmountComponentAtNode(dom) {
	var lastVnode = dom._lastVnode;
	if (dom.refs) {
		dom.refs = null;
	}
	if (lastVnode) {
		disposeVnode(lastVnode);
		emptyElement(dom);
		//unmount之后又render
		//参见ReactComponentLifeCycle-test
		//should not reuse an instance when it has been unmounted
		dom._lastVnode.mayInfo = {};
		dom._lastVnode = null;
	}
}
function findDOMNode(ref) {
	var ret = null;
	if (ref) {
		if (ref.nodeType === 1) {
			return ref;
		} else {
			var c = ref.mayInst.rendered;
			while (c) {
				if (c.mtype === 1) {
					return c.mayInfo.hostNode;
				} else if (c.mayInfo.hostNode) {
					return c.mayInfo.hostNode;
				}
				c = c.mayInfo.instance.mayInst.rendered;
			}
		}
	}
	return ret;
}

function Component(props, context, key, ref) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
    //新建个对象存放各种信息
    this.mayInst = {};
}

Component.prototype.setState = function (state, callback) {
    var lifeState = this.mayInst.lifeState;

    if (callback) {
        //回调队列调用之前也许sort
        callback = callback.bind(this);
        callback._mountOrder = this.mayInst.mountOrder;
        mayQueue.callbackQueue.push(callback);
    }
    if (this.mayInst.mergeStateQueue) {
        this.mayInst.mergeStateQueue.push(state);
    } else {
        this.mayInst.mergeStateQueue = new Array(state);
    }
    if (mayQueue.isInEvent) {
        //如果在绑定事件中 触发setState合并state
        if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
            this.mayInst.dirty = true;
            mayQueue.dirtyComponentsQueue.push(this);
        }
        return;
    }

    switch (lifeState) {
        //componentWillReceiveProps触发setState会合并state
        case 1: //componentWillMount 触发setState会合并state
            return;
        //ComponentWillReceiveProps 中setState  3
        //子组件在ComponentWillMount中调用父组件的setState  3
        case 3:
        case 2: //componentDidMount 触发setState会放到下一周期  2
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                this.mayInst.dirty = true;
                this.mayInst.needNextRender = true; //子组件componentWillReceiveProps 调用父组件的setState 触发setState会放到下一周期
                mayQueue.dirtyComponentsQueue.push(this);
            }
            return;
        default:
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                this.mayInst.dirty = true;
                mayQueue.dirtyComponentsQueue.push(this);
            }
            break;
    }

    mayQueue.clearQueue();
};
Component.prototype.forceUpdate = function (callback) {
    if (callback) {
        mayQueue.callbackQueue.push(callback.bind(this));
    }
    if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
        this.mayInst.forceUpdate = true;
        this.mayInst.dirty = true;
        mayQueue.dirtyComponentsQueue.push(this);
    }
    var lifeState = this.mayInst.lifeState;
    switch (lifeState) {
        case 1: //ComponentWillMount
        case 2: //componentDidMount 
        case 3: //ComponentWillReceiveProps 
        case 4: //ComponentWillReceiveProps 
            return;
        default:
            mayQueue.clearQueue();
            break;
    }

};
Component.prototype.isMounted = function () {
    return this.mayInst ? (!!(this.mayInst.rendered && this.mayInst.rendered.mayInfo.hostNode) || this.mayInst.isEmpty) : false;
};

function PureComponent(props, key, ref, context) {
    return Component.apply(this, arguments);
}
var fn = inherits(PureComponent, Component);
//返回false 则不进行之后的渲染
fn.shouldComponentUpdate = function (nextProps, nextState, context) {
    var ret = true;
    var a = shallowEqual(this.props, nextProps);
    var b = shallowEqual(this.state, nextState);
    if (a === true && b === true) {
        ret = false;
    }
    return ret;
};



function shallowEqual(now, next) {
    if (Object.is(now, next)) {
        return true;
    }
    //必须是对象
    if ((now && typeof now !== 'object') || (next && typeof next !== 'object')) {
        return false;
    }
    var keysA = Object.keys(now);
    var keysB = Object.keys(next);
    if (keysA.length !== keysB.length) {
        return false;
    }
    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(next, keysA[i]) || !Object.is(now[keysA[i]], next[keysA[i]])) {
            return false;
        }
    }
    return true;
}

function cloneElement(element, additionalProps) {
    var type = element.type;
    var props = element.props;
    var mergeProps = {};
    Object.assign(mergeProps, props, additionalProps);

    var config = {};
    if (element.key) {
        config.key = element.key;
    }
    if (element.ref) {
        config.ref = element.ref;
    }
    for (const key in mergeProps) {
        if (key !== 'children') {
            config[key] = mergeProps[key];
        }
    }
    var children = mergeProps.children;
    var ret = createElement(type, config, children);
    return ret;
}

const Children = {
    only: function (child) {
        if (child && !Array.isArray(child)) {
            return child;
        }
        if (child && child.length === 1 && child[0].mtype) {
            return child[0];
        }
        throw new Error("expect only one child");
    },
    forEach: function (children, callback, context) {
        var ret;
        if (!children) {
            return null;
        }
        ret = toArray(children);

        ret.forEach(callback, context);
        return ret;

    },
    map: function (children, callback, context) {
        var ret = [];
        if (children == null) {
            //null 或undefinded直接返回
            return children;
        }
        toArray(children).forEach(function (item, index) {
            var res = callback.call(context, item, index);
            if (res == null) {
                return;
            } else {
                ret.push(res);
            }
        });
        return ret;

    },
    toArray: function (children) {
        if (children == null) {
            return [];
        }
        return toArray(children);
    }
};
function toArray(children) {
    var ret = [];
    if (Array.isArray(children)) {
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            if (c.type) {
                ret.push(c);
            } else { //有可能是子数组iterator
                var iteratorFn = getIteractor(c);
                if (iteratorFn) {
                    var iterators = callIteractor(iteratorFn, c);
                    for (var _i = 0; _i < iterators.length; _i++) {
                        ret.push(iterators[_i]);
                    }
                } else {
                    ret.push(c);
                }
            }
        }
    } else {
        ret.push(children);
    }
    return ret;
}

//为了兼容yo
var check = function () {
    return check;
};
check.isRequired = check;
var PropTypes = {
    array: check,
    bool: check,
    func: check,
    number: check,
    object: check,
    string: check,
    any: check,
    arrayOf: check,
    element: check,
    instanceOf: check,
    node: check,
    objectOf: check,
    oneOf: check,
    oneOfType: check,
    shape: check
};

var May = {
    createElement: createElement,
    Component: Component,
    PureComponent: PureComponent,
    cloneElement: cloneElement,
    Children: Children,
    render: render,
    PropTypes: PropTypes,
    findDOMNode: findDOMNode,
    unmountComponentAtNode: unmountComponentAtNode,
    isValidElement: function (vnode) {
        return vnode && vnode.mtype;
    },
    createFactory: function createFactory(type) {
        console.error("createFactory is deprecated");
        var factory = createElement.bind(null, type);
        factory.type = type;
        return factory;
    }
};
window.React = window.ReactDOM = May;

module.exports = May;
