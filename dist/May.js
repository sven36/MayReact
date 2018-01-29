'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
    var len = arguments.length - 2;
    //既然render的时候都需要判断下type 是fun或string
    //那把这一步提前 比render循环里判断更好些;
    var _type = typeof type;
    switch (_type) {
        case 'string': //HtmlElement 1  SVG 3
            mtype = _type !== 'svg' ? 1 : 3;
            break;
        case 'function': //component 或functionless
            mtype = 2;
            break;
    }
    if (config) {
        key = config.key !== void 0 ? ('' + config.key) : null;
        ref = config.ref || null;
        if (typeof ref === 'number') {
            ref = '' + ref;
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
            array.push(arguments[i + 2]);
        }
        props.children = array;
    } else if (len === 1) {// && children
        props.children = children;
    }

    return new Vnode(type, key, ref, props, mtype);
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
var Vnode = function (type, key, ref, props, mtype) {
    this.type = type;
    this.key = key;
    this.ref = ref;
    this.props = props;
    this.$$typeof = 1;
    this.mtype = mtype;
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
        if (c) {
            c._lifeState = 'reRenderComplete';
        }
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

function mergeState(instance) {
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


// export function eventProxy(e) {
//     return this._listener[e.type](e);
// }

/**
 * 寄生组合式继承
 * @param {*} target 
 * @param {*} superClass 
 */
function inherits(target, superClass) {
    function b() {}
    b.prototype = superClass.prototype;
    var fn = target.prototype = new b();
    fn.constructor = target;
    return fn;
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

var Refs = {
    //当子component含有ref的时候,需要把对应的instance或dom添加到 父component的refs属性中
    //如果在mountComponent中做这样的操作需要每一层都要添加owner 放在外面更好些;
    currentOwner: null,
};

var lifeCycleQueue$1 = mayQueue.lifeCycleQueue;


//之前是 mount的时候setDomAttr一个方法 diff的时候diffProps一个方法
//后来发现 写着写着要修改点setDomAttr的内容 diff的时候还要在判断一遍
//那干脆把这两个合成一个方法好了
function diffProps(prev, now) {
    var props = now.props;
    var hostNode = now._hostNode;
    if (!prev) { //setDomAttr
        setDomAttr(hostNode, props);
    } else {
        var prevProps = prev.props;
        for (var name in props) {
            if (name !== 'children' && !(props[name] === prevProps[name])) {
                setDomAttr(hostNode, props);
                break;
            }
        }
        for (var prop in prevProps) {
            if (prop !== 'children' && (props[prop] === void 666)) {
                removeDomAttr(hostNode, prevProps, prop);
            }
        }
        var _ref = prev.ref;
        var ref = now.ref;
        if (_ref) {
            if (typeof _ref === 'function') {
                prev.ref(null);
                prev.ref = null;
            } else {
                if (Refs.currentOwner && Refs.currentOwner.refs[_ref]) {
                    Refs.currentOwner.refs[_ref] = null;
                }
            }
        }
        if (ref) {
            if (typeof ref === 'function') {
                lifeCycleQueue$1.push(now.ref.bind(now, now));
            }
            if (typeof ref === 'string') {
                if (Refs.currentOwner) {
                    if (Refs.currentOwner.refs) {
                        Refs.currentOwner.refs[ref] = hostNode;
                    } else {
                        Refs.currentOwner.refs = {};
                        Refs.currentOwner.refs[ref] = hostNode;
                    }
                }
            }
        }

        if (props['children']) {
            diffChildren(prev, now, now._hostNode);
        }
    }

}

var FormElement = {
    input: 1,
    select: 1,
};
/**
 * 设置DOM属性
 * @param {*} dom 
 * @param {*} props 
 */
function setDomAttr(dom, props) {
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
            var hook = eventHooks[eventName];
            if (!hook) {
                addEvent(eventName);
            } else {
                //input的change等特殊事件需要特殊处理
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

function isEvent(name) {
    return /^on[A-Z]/.test(name);
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

function mountDOM(vnode, isSVG) {
	var vtype = vnode.type;
	var hostNode = !isSVG ? document.createElement(vtype) : document.createElementNS("http://www.w3.org/2000/svg", vnode.type);
	if (!Refs.currentOwner) {
		Refs.currentOwner = hostNode;
		hostNode.refs = {};
	}
	vnode._hostNode = hostNode;
	diffProps(null, vnode);
	var children = vnode.props.children || null;
	if (children && !Array.isArray(children)) {
		children = [children];
	}
	var cdom, c, parentContext;
	if (vnode._refOwner && vnode._refOwner.context) {
		parentContext = vnode._refOwner.context;
	}
	if (children) {
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
						if (parentContext) {
							c.context = getContextByTypes(parentContext, c.type.contextTypes);
						}
						cdom = mountStrategy[c.mtype](c, isSVG);
						c._hostNode = cdom;
						hostNode.appendChild(cdom);
					} else { //有可能是子数组iterator
						var iteratorFn = getIteractor(c);
						if (iteratorFn) {
							var ret = callIteractor(iteratorFn, c);
							for (var _i = 0; _i < ret.length; _i++) {
								cdom = mountStrategy[ret[_i].mtype](ret[_i], isSVG);
								ret[_i]._hostNode = cdom;
								hostNode.appendChild(cdom);
							}
						}
					}
			}
		}
		vnode._vChildren = transformChildren(vnode, hostNode);
	}
	//如果是受控组件input select之类需要特殊处理下
	if (FormElement[vtype]) {
		if (vtype === 'select') {
			if (vnode.props['value']) {
				var _val = vnode.props['value'];
				var _optionsChilds = [].slice.call(hostNode.childNodes);
				if (_optionsChilds) {
					for (var k = 0; k < _optionsChilds.length; k++) {
						var oChild = _optionsChilds[k];
						oChild.value !== _val ? oChild.selected = false : oChild.selected = true;
					}
				}

			}
		}
	}
	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode._inst || vnode._hostNode || null;
		if (typeof ref === 'function') {
			lifeCycleQueue.push(ref.bind(owner, refInst));
		} else if (typeof ref === 'string') { //ref 为string
			owner.refs[ref] = refInst;
		}
	}
	return hostNode;
}

function mountComposite(vnode, isSVG) {
	var hostNode = null;
	var renderedVnode = buildComponentFromVnode(vnode);
	if (!Refs.currentOwner && vnode._inst) { //!Refs.currentOwner && 
		Refs.currentOwner = vnode._inst;
		vnode._inst.refs = {};
	}
	if (renderedVnode) {
		//递归遍历 深度优先
		hostNode = mountStrategy[renderedVnode.mtype](renderedVnode, isSVG);
		//既然dom diff必然需要分类一下children以方便diff  那就把这步提前 render时就执行
		renderedVnode._vChildren = transformChildren(renderedVnode, hostNode);
		renderedVnode._hostNode = hostNode;
	} else { //render 返回null
		hostNode = document.createComment('empty');
	}
	var inst = vnode._inst || null;
	if (inst && inst.componentDidMount) {
		inst._lifeState = 'beforeComponentDidMount';
		lifeCycleQueue.push(inst.componentDidMount.bind(inst));
	}
	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode._inst || vnode._hostNode || null;
		if (typeof ref === 'function') {
			lifeCycleQueue.push(ref.bind(owner, refInst));
		} else if (typeof ref === 'string') { //ref 为string
			owner.refs[ref] = refInst;
		}
	}
	return hostNode;
}
//React是根据type类型分成不同的Component各自具备各自的mount与update方法
//我们这里简化成根据type类型调用不同的方法
//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
var mountStrategy = {
	1: mountDOM, //dom
	2: mountComposite, //component
	3: mountDOM, //svg dom
	4: updateDOM,
	5: updateComposite,
	6: updateDOM,
};
//存放生命周期中的 DidMount DidUpdate以及ref回调
var lifeCycleQueue = mayQueue.lifeCycleQueue;
var mountOrder = 0;

function buildComponentFromVnode(vnode) {
	var props = vnode.props;
	var key = vnode.key;
	var ref = vnode.ref;
	var context = vnode.context;
	var inst, renderedVnode;
	var Ctor = vnode.type;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		inst = new Ctor(props, key, ref, context);
		inst._mountOrder = mountOrder;
		mountOrder++;
		if (inst.componentWillMount) {
			//_lifeState来控制生命周期中调用setState的作用
			//刚创建instance componentWillMount调用setState合并state即可
			inst._lifeState = 'beforeComponentWillMount';
			inst.componentWillMount();
			inst._lifeState = 'afterComponentWillMount';
		}
		if (inst._mergeStateQueue) {
			inst.state = mergeState(inst);
		}
		renderedVnode = inst.render(props, context);
		if (inst.getChildContext) {
			var getContext = inst.getChildContext();
			if (getContext && typeof getContext === 'object') {
				if (!context) {
					context = {};
				}
				context = Object.assign(context, getContext);
			}
		}
		if (context) {
			inst.context = context;
		}
		// vnode.type === 'function' 代表其为Component Component中才能setState
		//setState会触发reRender 故保存有助于domDiff的参数
		vnode._inst = inst;
		inst._renderedVnode = renderedVnode;
		//设定owner 用于ref绑定
		renderedVnode && (renderedVnode._refOwner = inst);
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedVnode = Ctor.call(vnode, props, context);
	}
	//添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
	vnode._renderedVnode = renderedVnode;
	return renderedVnode;
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

function reRender(instance) {
	var props = instance.props;
	var context = instance.context;
	var prevRenderedVnode = instance._renderedVnode;
	var hostNode = prevRenderedVnode._hostNode;
	var newState = mergeState(instance);
	//forceUpdate时 忽略shouldComponentUpdate
	if (!instance._forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(props, newState, context) === false) {
		return;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate(props, newState, context);
	}
	instance.state = newState;
	instance._lifeState = 'beforeComponentRerender';
	var updatedVnode = instance.render(props, context);
	instance._renderedVnode = updatedVnode;
	if (!updatedVnode) {
		disposeVnode(prevRenderedVnode);
		disposeDom(hostNode);
		return;
	}
	if (isSameType(prevRenderedVnode, updatedVnode)) {
		updatedVnode._hostNode = hostNode;
		diffProps(prevRenderedVnode, updatedVnode);
	} else {
		var isSVG = updatedVnode.mtype === 3;
		var dom = mountStrategy[updatedVnode.mtype](updatedVnode, isSVG);
		hostNode.parentNode.replaceChild(dom, hostNode);
	}
	instance._renderedVnode._hostNode = hostNode;
	updatedVnode._vChildren = transformChildren(updatedVnode, hostNode);

	if (instance.componentDidUpdate) {
		//执行完 componentWillUpdate 
		instance._lifeState = 'beforeComponentDidUpdate';
		if (instance._renderInNextCycle) {
			instance.componentDidUpdate();
			//执行完 componentDidUpdate
			instance._lifeState = 'afterComponentDidUpdate';
		} else {
			lifeCycleQueue.push(instance.componentDidUpdate.bind(instance));
		}
	}

}

function updateDOM(prevVnode, newVnode) {
	if (prevVnode.ref && typeof prevVnode.ref === 'function') {
		prevVnode.ref(null);
	}
	var hostNode = prevVnode._hostNode || null;
	if (!Refs.currentOwner) {
		Refs.currentOwner = hostNode;
		Refs.currentOwner.refs = {};
	}
	diffChildren(prevVnode, newVnode, hostNode);
	if (newVnode.ref) {
		lifeCycleQueue.push(newVnode.ref.bind(newVnode, newVnode));
	}
	return hostNode;
}

function updateComposite(prevVnode, newVnode) {
	if (prevVnode.ref && typeof prevVnode.ref === 'function') {
		prevVnode.ref(null);
	}
	var hostNode = prevVnode._hostNode || prevVnode._renderedVnode._hostNode;
	var instance = prevVnode._inst;
	var isEmpty = false;
	var newDom;
	if (hostNode.nodeType === 8 && hostNode.nodeValue === 'empty') {
		//empty代表prevVnode为null
		isEmpty = true;
	}
	instance._lifeState = 'beforeComponentWillReceiveProps';
	if (prevVnode !== newVnode || prevVnode.context !== newVnode.context) {
		if (instance.componentWillReceiveProps) {
			instance.componentWillReceiveProps(newVnode.props, newVnode.context);
		}
		instance.props = newVnode.props;
	}
	var newState = mergeState(instance);
	instance._lifeState = 'beforeShouldComponentUpdate';
	//shouldComponentUpdate 返回false 则不进行子组件渲染
	if (!instance._forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(props, newState, context) === false) {
		return hostNode;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate();
	}
	instance.state = newState;
	if (!Refs.currentOwner) {
		Refs.currentOwner = instance;
		Refs.currentOwner.refs = {};
	}

	var prevRenderedVnode = prevVnode._renderedVnode;
	instance._lifeState = 'beforeComponentRerender';
	var newRenderedVnode = instance.render();
	newVnode._renderedVnode = newRenderedVnode;
	newVnode._inst = instance;
	instance._renderedVnode = newRenderedVnode;

	if (newRenderedVnode && !isEmpty) {
		diffChildren(prevRenderedVnode, newRenderedVnode, hostNode);
	} else {
		if (isEmpty && newRenderedVnode) {
			var isSVG = newRenderedVnode.mtype === 3;
			newDom = mountStrategy[newRenderedVnode.mtype](newRenderedVnode, isSVG);
			newRenderedVnode._hostNode = newDom;
			hostNode.parentNode.replaceChild(newDom, hostNode);
		}
		disposeVnode(prevRenderedVnode);
		disposeDom(hostNode);
	}
	if (instance.componentDidUpdate) {
		instance._lifeState = 'beforeComponentDidUpdate';
		lifeCycleQueue.push(instance.componentDidUpdate.bind(instance));
	}
	if (newVnode.ref) {
		lifeCycleQueue.push(newVnode.ref.bind(newVnode, newVnode));
	}
	if (newDom) {
		hostNode = newDom;
	}
	return hostNode;
}

function diffChildren(prevVnode, updatedVnode, parent) {
	var prevChildren = prevVnode._vChildren || null;
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
					break;
				case 'number':
				case 'string':
					k = "#text";
					_tran = {
						type: '#text',
						value: c
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
					if (c.type === vnode.type && !vnode._used) {
						c._hostNode = vnode._hostNode;
						c._inst = vnode._inst;
						c._prevVnode = vnode;
						vnode._used = true;
						c._reused = true;
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
			if (!_c[j]._used) _unMountChildren.push(_c[j]);
		}
	}
	flushMounts(_mountChildren, parent);
	flushUnMounts(_unMountChildren);
}

function flushMounts(newChildren, parent) {

	for (var _i = 0; _i < newChildren.length; _i++) {
		var child = newChildren[_i];
		var type = typeof child.type;
		var newDom;
		switch (type) {
			case 'function':
				//如果能复用之前节点
				if (child._reused) {
					var hostNode = updateComposite(child._prevVnode, child);
				} else {
					newDom = mountStrategy[child.mtype](child);
					var node = parent.childNodes[_i];
					if (node) {
						parent.insertBefore(newDom, node);
						// insertCount++;
					} else {
						parent.appendChild(newDom);
					}
				}

				break;
			case 'string':
				var _node = parent.childNodes[_i];
				if (child._reused) {
					if (_node && _node !== child._hostNode) {
						newDom = parent.removeChild(child._hostNode);
						parent.insertBefore(newDom, _node);
					}
					if (child.type !== '#text') {
						diffProps(child._prevVnode, child);
					} else { //text
						if (child._hostNode.nodeValue !== child.value) {
							child._hostNode.nodeValue = child.value;
						}
					}
				} else {
					if (child.type !== '#text') {
						newDom = mountStrategy[child.mtype](child);
						child._hostNode = newDom;
						parent.insertBefore(newDom, _node);
					} else {
						newDom = document.createTextNode(child.value);
						parent.insertBefore(newDom, _node);
					}

				}

				break;

		}


	}
}

function flushUnMounts(oldChildren) {
	var c;
	while (c = oldChildren.shift()) {
		disposeVnode(c);
		c._hostNode && disposeDom(c._hostNode);
		c = null;
	}
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
				if (c._reused) {
					//如果该组件 diff 两次 第一次vnode重用之后_reused为true
					//生成vchildren时需要其为false 否则第二次diff
					c._reused = false;
				}
				if (c.type) {
					var _key = genKey(c);
					if (!result[_key]) {
						result[_key] = [c];
					} else {
						result[_key].push(c);
					}
					if (c.ref) { //如果子dom有ref 标识一下 
						var owner = renderedVnode._refOwner;
						if (owner) {
							if (owner.refs) {
								owner.refs[c.ref] = c._inst || c._hostNode || null;
							} else {
								owner.refs = {};
								owner.refs[c.ref] = c._inst || c._hostNode || null;
							}
						}
					}
				} else {
					var iteratorFn = getIteractor(c);
					if (iteratorFn) {
						var ret = callIteractor(iteratorFn, c);
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
					value: c
				};
				if (childList[i - noCount]) {
					tran._hostNode = childList[i - noCount];
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

function disposeVnode(vnode) {
	if (vnode.ref && typeof vnode.ref === 'function') {
		vnode.ref(null);
		vnode.ref = null;
	}
	if (vnode._inst) {
		if (vnode._inst.componentWillUnmount) {
			//componentWillUnmount中触发setState 忽略
			vnode._inst._lifeState = 'beforeComponentWillUnmount';
			vnode._inst.componentWillUnmount();
		}
		vnode._inst.refs = null;
		vnode._inst = null;
	}
	if (vnode._renderedVnode) {
		disposeVnode(vnode._renderedVnode);
		vnode._renderedVnode = null;
	}
	if (vnode._prevVnode) {
		vnode._prevVnode = null;
	}
	vnode = null;
}

function disposeDom(dom) {
	if (dom._listener) {
		dom._listener = null;
	}
	if (dom.parentNode) {
		dom.parentNode.removeChild(dom);
		dom = null;
	}
}

function genKey(child) {
	return !child.key ? (child.type.name || child.type) : ('_$' + child.key);
}

function isSameType(prev, now) {
	return prev.type === now.type && prev.key === now.key;
}



var REAL_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
var FAKE_SYMBOL = "@@iterator";

function getIteractor(a) {
	var iteratorFn = REAL_SYMBOL && a[REAL_SYMBOL] || a[FAKE_SYMBOL];
	if (iteratorFn && iteratorFn.call) {
		return iteratorFn;
	}
}

function callIteractor(iteratorFn, children) {
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

function Component(props, key, ref, context) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
}

Component.prototype.setState = function (state, callback) {
    var lifeState = this._lifeState;

    if (callback) {
        //回调队列调用之前也许sort
        callback = callback.bind(this);
        callback._mountOrder = this._mountOrder;
        mayQueue.callbackQueue.push(callback);
    }
    if (this._mergeStateQueue) {
        this._mergeStateQueue.push(state);
    } else {
        this._mergeStateQueue = new Array(state);
    }
    if (mayQueue.isInEvent) {
        //如果在绑定事件中 触发setState合并state
        if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
            mayQueue.dirtyComponentsQueue.push(this);
        }
        return;
    }
    switch (lifeState) {
        case 'beforeComponentWillUnmount': //componentWillUnmount 触发setState忽略
            return;
        case 'beforeComponentWillMount': //componentWillMount 触发setState会合并state
            this.state = mergeState(this);
            return;
        case 'beforeComponentRerender': //子组件componentWillReceiveProps 调用父组件的setState 触发setState会放到下一周期
            this._renderInNextCycle = true;
        case 'afterComponentWillMount': //子组件在ComponentWillMount中调用父组件的setState
        case 'beforeComponentDidMount': //componentDidMount 触发setState会放到下一周期beforeComponentRerender
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                mayQueue.dirtyComponentsQueue.push(this);
            }
            return;
        default:
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                mayQueue.dirtyComponentsQueue.push(this);
            }
            break;
    }

    mayQueue.clearQueue();
};
Component.prototype.forceUpdate = function (callback) {
    this._forceUpdate = true;
    if (callback) {
        mayQueue.callbackQueue.push(callback.bind(this));
    }
    if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
        mayQueue.dirtyComponentsQueue.push(this);
    }
    var lifeState = this._lifeState;
    switch (lifeState) {
        case 'beforeComponentWillUnmount': //componentWillUnmount 触发forceUpdate
        case 'beforeComponentWillMount': //componentWillMount 触发forceUpdate会合并state
        case 'beforeComponentRerender': //子组件componentWillReceiveProps 触发forceUpdate
        case 'afterComponentWillMount': //子组件在ComponentWillMount中触发forceUpdate
        case 'beforeComponentDidMount': //componentDidMount 触发forceUpdate
            return;
        default:
            mayQueue.clearQueue();
            break;
    }

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
    if (a === false && b === false) {
        ret = false;
    }
    return ret;
};

function shallowEqual(now, next) {
    if (Object.is(now, next)) {
        return false;
    }
    //必须是对象
    if ((now && typeof now !== 'object') || (next && typeof next !== 'object')) {
        return '不是对象';
    }
    var keysA = Object.keys(now);
    var keysB = Object.keys(next);
    if (keysA.length !== keysB.length) {
        return '键值对 不一样';
    }
    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(next, keysA[i]) || !Object.is(now[keysA[i]], next[keysA[i]])) {
            return 'different';
        }
    }
    return false;
}

function cloneElement(element, additionalProps) {
    var type = element.type;
    var props = element.props;
    if (additionalProps) {
        props = Object.assign(props, additionalProps);
    }
    var config = {};
    for (const key in props) {
        if (key !== 'children') {
            config[key] = element.props[key];
        }
    }
    // if (props.key) {
    //     config.key = props.key;
    // }
    // if (props.ref) {
    //     config.ref = props.ref;
    // }
    var children = props.children;
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
    }
};

var May = {
    createElement: createElement,
    Component: Component,
    PureComponent: PureComponent,
    cloneElement: cloneElement,
    Children: Children
};

exports.createElement = createElement;
exports.Component = Component;
exports['default'] = May;
