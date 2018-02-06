import {
    mayQueue
} from './may-dom/scheduler';

var globalEvent = {

}
export var eventHooks = {}; //用于在元素上绑定特定的事件
var document = window.document;
export var isTouch = "ontouchstart" in document;

export function dispatchEvent(e, type, end) {
    e = new SyntheticEvent(e);
    if (type) {
        e.type = type;
    }
    var _type = e.type;
    //全局的一个标识  在事件中setState应当合并
    mayQueue.isInEvent = true;
    //onClickCapture 在捕获阶段触发
    var captured = _type + 'capture';
    var eventCollect = bubbleEvent(e.target, end || document);

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


export var eventLowerCache = {
    onClick: "click",
    onChange: "change",
    onWheel: "wheel"
};
var rcapture = /Capture$/;
export function getBrowserName(onStr) {
    var lower = eventLowerCache[onStr];
    if (lower) {
        return lower;
    }
    var camel = onStr.slice(2).replace(rcapture, "");
    lower = camel.toLowerCase();
    eventLowerCache[onStr] = lower;
    return lower;
}
export function addEvent(name) {
    if (!globalEvent[name]) {
        globalEvent[name] = true;
        addDocumentEvent(document, name, dispatchEvent);
    }
}

function addDocumentEvent(el, name, fn, bool) {
    if (el.addEventListener) {
        el.addEventListener(name, fn, bool || false);
    } else if (el.attachEvent) {
        el.attachEvent('on' + name, fn);
    }

}
export function SyntheticEvent(event) {
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

export function createHandle(name, fn) {
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
        addDocumentEvent(document, "input", changeHandle);
    }
};

eventHooks.doubleclick = eventHooks.doubleclickcapture = function () {
    addDocumentEvent(document, "dblclick", doubleClickHandle);
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
})
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
const fixWheelType = "onmousewheel" in document ? "mousewheel" : document.onwheel !== void 666 ? "wheel" : "DOMMouseScroll";
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
            addDocumentEvent(document, type, dispatchEvent, true);
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