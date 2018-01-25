var globalEvent = {

}
var document = window.document;
export function dispatchEvent(e, type, end) {
    e = new SyntheticEvent(e);
    var type = e.type;
    //onClickCapture 在捕获阶段触发
    var captured = type + 'capture';
    var eventCollect = bubbleEvent(e.target, end || document);
    //先触发捕获
    triggerEventFlow(e, eventCollect, captured);

    if (!e._stopPropagation) {
        //触发冒泡
        triggerEventFlow(e, eventCollect.reverse(), type);
    }
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
    for (var i = 0; i < collect.length; i++) {
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
var eventProto = (SyntheticEvent.prototype = {
    preventDefault: function () {
        var e = this.nativeEvent || {};
        e.returnValue = this.returnValue = false;
        if (e.preventDefault) {
            e.preventDefault();
        }
    },
    fixHooks: function () {},
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

function noop() {}