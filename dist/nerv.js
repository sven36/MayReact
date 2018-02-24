'use strict';

// tslint:disable-next-line
var global = function () {
    var local;
    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('global object is unavailable in this environment');
        }
    }
    return local;
}();
var isBrowser = typeof window !== 'undefined';
// tslint:disable-next-line:no-empty
function noop() {}
var fakeDoc = {
    createElement: noop,
    createElementNS: noop,
    createTextNode: noop
};
var doc = isBrowser ? document : fakeDoc;

function isNumber(arg) {
    return typeof arg === 'number';
}
var isSupportSVG = isFunction(doc.createAttributeNS);
function isString(arg) {
    return typeof arg === 'string';
}
function isFunction(arg) {
    return typeof arg === 'function';
}
function isBoolean(arg) {
    return arg === true || arg === false;
}
var isArray = Array.isArray;
function isUndefined(o) {
    return o === undefined;
}

var canUsePromise = 'Promise' in global;
var resolved;
if (canUsePromise) {
    resolved = Promise.resolve();
}
var nextTick = function (fn) {
    var args = [],
        len = arguments.length - 1;
    while (len-- > 0) args[len] = arguments[len + 1];

    fn = isFunction(fn) ? fn.bind.apply(fn, [null].concat(args)) : fn;
    if (canUsePromise) {
        return resolved.then(fn);
    }
    var timerFunc = 'requestAnimationFrame' in global ? requestAnimationFrame : setTimeout;
    timerFunc(fn);
};

/* istanbul ignore next */
// tslint:disable-next-line
Object.is = Object.is || function (x, y) {
    if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
    }
    return x !== x && y !== y;
};
function shallowEqual(obj1, obj2) {
    if (obj1 === null || obj2 === null) {
        return false;
    }
    if (Object.is(obj1, obj2)) {
        return true;
    }
    var obj1Keys = obj1 ? Object.keys(obj1) : [];
    var obj2Keys = obj2 ? Object.keys(obj2) : [];
    if (obj1Keys.length !== obj2Keys.length) {
        return false;
    }
    for (var i = 0; i < obj1Keys.length; i++) {
        var obj1KeyItem = obj1Keys[i];
        if (!obj2.hasOwnProperty(obj1KeyItem) || !Object.is(obj1[obj1KeyItem], obj2[obj1KeyItem])) {
            return false;
        }
    }
    return true;
}

var SimpleMap = function SimpleMap() {
    this.cache = [];
    this.size = 0;
};
SimpleMap.prototype.set = function set(k, v) {
    var this$1 = this;

    var len = this.cache.length;
    if (!len) {
        this.cache.push({ k: k, v: v });
        this.size += 1;
        return;
    }
    for (var i = 0; i < len; i++) {
        var item = this$1.cache[i];
        if (item.k === k) {
            item.v = v;
            return;
        }
    }
    this.cache.push({ k: k, v: v });
    this.size += 1;
};
SimpleMap.prototype.get = function get(k) {
    var this$1 = this;

    var len = this.cache.length;
    if (!len) {
        return;
    }
    for (var i = 0; i < len; i++) {
        var item = this$1.cache[i];
        if (item.k === k) {
            return item.v;
        }
    }
};
SimpleMap.prototype.has = function has(k) {
    var this$1 = this;

    var len = this.cache.length;
    if (!len) {
        return false;
    }
    for (var i = 0; i < len; i++) {
        var item = this$1.cache[i];
        if (item.k === k) {
            return true;
        }
    }
    return false;
};
SimpleMap.prototype['delete'] = function delete$1(k) {
    var this$1 = this;

    var len = this.cache.length;
    for (var i = 0; i < len; i++) {
        var item = this$1.cache[i];
        if (item.k === k) {
            this$1.cache.splice(i, 1);
            this$1.size -= 1;
            return true;
        }
    }
    return false;
};
SimpleMap.prototype.clear = function clear() {
    var this$1 = this;

    var len = this.cache.length;
    this.size = 0;
    if (!len) {
        return;
    }
    while (len) {
        this$1.cache.pop();
        len--;
    }
};
var MapClass = 'Map' in global ? Map : SimpleMap;

function isAttrAnEvent(attr) {
    return attr[0] === 'o' && attr[1] === 'n';
}
function extend(source, from) {
    if (!from) {
        return source;
    }
    for (var key in from) {
        if (from.hasOwnProperty(key)) {
            source[key] = from[key];
        }
    }
    return source;
}
function clone(obj) {
    return extend({}, obj);
}

var Current = {
    current: null
};

var EMPTY_CHILDREN = [];
var EMPTY_OBJ = {};
function isNullOrUndef(o) {
    return o === undefined || o === null;
}
function isInvalid(o) {
    return isNullOrUndef(o) || o === true || o === false;
}
function isVNode(node) {
    return !isNullOrUndef(node) && node.vtype === 2 /* Node */;
}
function isVText(node) {
    return !isNullOrUndef(node) && node.vtype === 1 /* Text */;
}
function isComponent(instance) {
    return !isInvalid(instance) && instance.isReactComponent === EMPTY_OBJ;
}
function isWidget(node) {
    return !isNullOrUndef(node) && (node.vtype & (4 /* Composite */ | 8 /* Stateless */)) > 0;
}
function isPortal(vtype, node) {
    return (vtype & 32 /* Portal */) > 0;
}
function isComposite(node) {
    return !isNullOrUndef(node) && node.vtype === 4 /* Composite */;
}
function isValidElement(node) {
    return !isNullOrUndef(node) && node.vtype;
}
// tslint:disable-next-line:no-empty
function noop$1() {}
// typescript will compile the enum's value for us.
// eg.
// Composite = 1 << 2  => Composite = 4
var VType;
(function (VType) {
    VType[VType["Text"] = 1] = "Text";
    VType[VType["Node"] = 2] = "Node";
    VType[VType["Composite"] = 4] = "Composite";
    VType[VType["Stateless"] = 8] = "Stateless";
    VType[VType["Void"] = 16] = "Void";
    VType[VType["Portal"] = 32] = "Portal";
})(VType || (VType = {}));

var Ref = {
    update: function update(lastVnode, nextVnode, domNode) {
        var prevRef = lastVnode != null && lastVnode.ref;
        var nextRef = nextVnode != null && nextVnode.ref;
        if (prevRef !== nextRef) {
            if (!isFunction(prevRef) || !isFunction(nextRef)) {
                this.detach(lastVnode, prevRef, lastVnode.dom);
            }
            this.attach(nextVnode, nextRef, domNode);
        }
    },
    attach: function attach(vnode, ref, domNode) {
        var node = isComposite(vnode) ? vnode.component : domNode;
        if (isFunction(ref)) {
            ref(node);
        } else if (isString(ref)) {
            var inst = vnode._owner;
            if (inst && isFunction(inst.render)) {
                inst.refs[ref] = node;
            }
        }
    },
    detach: function detach(vnode, ref, domNode) {
        var node = isComposite(vnode) ? vnode.component : domNode;
        if (isFunction(ref)) {
            ref(null);
        } else if (isString(ref)) {
            var inst = vnode._owner;
            if (inst.refs[ref] === node && isFunction(inst.render)) {
                delete inst.refs[ref];
            }
        }
    }
};

var ONINPUT = 'oninput';
var ONPROPERTYCHANGE = 'onpropertychange';
var isiOS = isBrowser && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
var delegatedEvents = new MapClass();
var unbubbleEvents = {
    onmousemove: 1,
    ontouchmove: 1,
    onmouseleave: 1,
    onmouseenter: 1,
    onload: 1,
    onunload: 1,
    onscroll: 1,
    onfocus: 1,
    onblur: 1,
    onrowexit: 1,
    onbeforeunload: 1,
    onstop: 1,
    ondragdrop: 1,
    ondragenter: 1,
    ondragexit: 1,
    ondraggesture: 1,
    ondragover: 1,
    oncontextmenu: 1,
    onerror: 1,
    onabort: 1,
    oncanplay: 1,
    oncanplaythrough: 1,
    ondurationchange: 1,
    onemptied: 1,
    onended: 1,
    onloadeddata: 1,
    onloadedmetadata: 1,
    onloadstart: 1,
    onencrypted: 1,
    onpause: 1,
    onplay: 1,
    onplaying: 1,
    onprogress: 1,
    onratechange: 1,
    onseeking: 1,
    onseeked: 1,
    onstalled: 1,
    onsuspend: 1,
    ontimeupdate: 1,
    onvolumechange: 1,
    onwaiting: 1
};
unbubbleEvents[ONPROPERTYCHANGE] = 1;
var bindFocus = false;
/* istanbul ignore next */
if (isBrowser && navigator.userAgent.indexOf('MSIE 9') >= 0) {
    var elements = [];
    var values = [];
    doc.addEventListener('selectionchange', function () {
        var el = doc.activeElement;
        if (detectCanUseOnInputNode(el)) {
            var index = elements.indexOf(el);
            var element = elements[index] || elements.push(el);
            if (element.value !== values[index]) {
                var ev = doc.createEvent('CustomEvent');
                ev.initCustomEvent('input', true, true, undefined);
                values[index] = element.value;
                el.dispatchEvent(ev);
            }
        }
    });
}
if (typeof Event !== 'undefined' && !Event.prototype.persist) {
    // tslint:disable-next-line:no-empty
    Event.prototype.persist = noop$1;
}
function attachEvent(domNode, eventName, handler) {
    eventName = fixEvent(domNode, eventName);
    /* istanbul ignore next */
    if (eventName === ONPROPERTYCHANGE) {
        processOnPropertyChangeEvent(domNode, handler);
        return;
    }
    var delegatedRoots = delegatedEvents.get(eventName);
    if (unbubbleEvents[eventName] === 1) {
        if (!delegatedRoots) {
            delegatedRoots = new MapClass();
        }
        var event = attachEventToNode(domNode, eventName, delegatedRoots);
        delegatedEvents.set(eventName, delegatedRoots);
        if (isFunction(handler)) {
            delegatedRoots.set(domNode, {
                eventHandler: handler,
                event: event
            });
        }
    } else {
        if (!delegatedRoots) {
            delegatedRoots = {
                items: new MapClass()
            };
            delegatedRoots.event = attachEventToDocument(doc, eventName, delegatedRoots);
            delegatedEvents.set(eventName, delegatedRoots);
        }
        if (isFunction(handler)) {
            if (isiOS) {
                domNode.onclick = noop$1;
            }
            delegatedRoots.items.set(domNode, handler);
        }
    }
}
function detachEvent(domNode, eventName, handler) {
    eventName = fixEvent(domNode, eventName);
    if (eventName === ONPROPERTYCHANGE) {
        return;
    }
    var delegatedRoots = delegatedEvents.get(eventName);
    if (unbubbleEvents[eventName] === 1 && delegatedRoots) {
        var event = delegatedRoots.get(domNode);
        if (event) {
            domNode.removeEventListener(parseEventName(eventName), event.event, false);
            /* istanbul ignore next */
            var delegatedRootsSize = delegatedRoots.size;
            if (delegatedRoots['delete'](domNode) && delegatedRootsSize === 0) {
                delegatedEvents['delete'](eventName);
            }
        }
    } else if (delegatedRoots && delegatedRoots.items) {
        var items = delegatedRoots.items;
        if (items['delete'](domNode) && items.size === 0) {
            doc.removeEventListener(parseEventName(eventName), delegatedRoots.event, false);
            delegatedEvents['delete'](eventName);
        }
    }
}
var propertyChangeActiveElement;
var propertyChangeActiveElementValue;
var propertyChangeActiveElementValueProp;
var propertyChangeActiveHandler;
/* istanbul ignore next */
function propertyChangeHandler(event) {
    if (event.propertyName !== 'value') {
        return;
    }
    var target = event.target || event.srcElement;
    var val = target.value;
    if (val === propertyChangeActiveElementValue) {
        return;
    }
    propertyChangeActiveElementValue = val;
    if (isFunction(propertyChangeActiveHandler)) {
        propertyChangeActiveHandler.call(target, event);
    }
}
/* istanbul ignore next */
function processOnPropertyChangeEvent(node, handler) {
    propertyChangeActiveHandler = handler;
    if (!bindFocus) {
        bindFocus = true;
        doc.addEventListener('focusin', function () {
            unbindOnPropertyChange();
            bindOnPropertyChange(node);
        }, false);
        doc.addEventListener('focusout', unbindOnPropertyChange, false);
    }
}
/* istanbul ignore next */
function bindOnPropertyChange(node) {
    propertyChangeActiveElement = node;
    propertyChangeActiveElementValue = node.value;
    propertyChangeActiveElementValueProp = Object.getOwnPropertyDescriptor(node.constructor.prototype, 'value');
    Object.defineProperty(propertyChangeActiveElement, 'value', {
        get: function get() {
            return propertyChangeActiveElementValueProp.get.call(this);
        },
        set: function set(val) {
            propertyChangeActiveElementValue = val;
            propertyChangeActiveElementValueProp.set.call(this, val);
        }
    });
    propertyChangeActiveElement.addEventListener('propertychange', propertyChangeHandler, false);
}
/* istanbul ignore next */
function unbindOnPropertyChange() {
    if (!propertyChangeActiveElement) {
        return;
    }
    delete propertyChangeActiveElement.value;
    propertyChangeActiveElement.removeEventListener('propertychange', propertyChangeHandler, false);
    propertyChangeActiveElement = null;
    propertyChangeActiveElementValue = null;
    propertyChangeActiveElementValueProp = null;
}
function detectCanUseOnInputNode(node) {
    var nodeName = node.nodeName && node.nodeName.toLowerCase();
    var type = node.type;
    return nodeName === 'input' && /text|password/.test(type) || nodeName === 'textarea';
}
function fixEvent(node, eventName) {
    if (eventName === 'onDoubleClick') {
        eventName = 'ondblclick';
    } else if (eventName === 'onTouchTap') {
        eventName = 'onclick';
        // tslint:disable-next-line:prefer-conditional-expression
    } else if (eventName === 'onChange' && detectCanUseOnInputNode(node)) {
        eventName = ONINPUT in window ? ONINPUT : ONPROPERTYCHANGE;
    } else {
        eventName = eventName.toLowerCase();
    }
    return eventName;
}
function parseEventName(name) {
    return name.substr(2);
}
/* istanbul ignore next */
function stopPropagation() {
    this.cancelBubble = true;
    this.stopImmediatePropagation();
}
function dispatchEvent(event, target, items, count, eventData) {
    var eventsToTrigger = items.get(target);
    if (eventsToTrigger) {
        count--;
        eventData.currentTarget = target;
        // for React synthetic event compatibility
        Object.defineProperties(event, {
            nativeEvent: {
                value: event
            }
        });
        eventsToTrigger(event);
        if (event.cancelBubble) {
            return;
        }
    }
    if (count > 0) {
        var parentDom = target.parentNode;
        if (parentDom === null || event.type === 'click' && parentDom.nodeType === 1 && parentDom.disabled) {
            return;
        }
        dispatchEvent(event, parentDom, items, count, eventData);
    }
}
function attachEventToDocument(d, eventName, delegatedRoots) {
    var eventHandler = function (event) {
        var items = delegatedRoots.items;
        var count = items.size;
        if (count > 0) {
            var eventData = {
                currentTarget: event.target
            };
            /* istanbul ignore next */
            try {
                Object.defineProperties(event, {
                    currentTarget: {
                        configurable: true,
                        get: function get() {
                            return eventData.currentTarget;
                        }
                    },
                    stopPropagation: {
                        value: stopPropagation
                    }
                });
            } catch (error) {
                // some browsers crashed
                // see: https://stackoverflow.com/questions/44052813/why-cannot-redefine-property
            }
            dispatchEvent(event, event.target, delegatedRoots.items, count, eventData);
        }
    };
    d.addEventListener(parseEventName(eventName), eventHandler, false);
    return eventHandler;
}
function attachEventToNode(node, eventName, delegatedRoots) {
    var eventHandler = function (event) {
        var eventToTrigger = delegatedRoots.get(node);
        if (eventToTrigger && eventToTrigger.eventHandler) {
            var eventData = {
                currentTarget: node
            };
            /* istanbul ignore next */
            Object.defineProperties(event, {
                currentTarget: {
                    configurable: true,
                    get: function get() {
                        return eventData.currentTarget;
                    }
                }
            });
            eventToTrigger.eventHandler(event);
        }
    };
    node.addEventListener(parseEventName(eventName), eventHandler, false);
    return eventHandler;
}

var options = {
    afterMount: noop$1,
    afterUpdate: noop$1,
    beforeUnmount: noop$1,
    roots: [],
    debug: false
};

function unmountChildren(children, parentDom) {
    if (isArray(children)) {
        for (var i = 0, len = children.length; i < len; i++) {
            unmount(children[i], parentDom);
        }
    } else {
        unmount(children, parentDom);
    }
}
function unmount(vnode, parentDom) {
    if (isInvalid(vnode)) {
        return;
    }
    var vtype = vnode.vtype;
    // Bitwise operators for better performance
    // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
    var dom = vtype & 4 /* Composite */ ? vnode.component.dom : vnode.dom;
    if ((vtype & (4 /* Composite */ | 8 /* Stateless */)) > 0) {
        options.beforeUnmount(vnode);
        vnode.destroy();
    } else if ((vtype & 2 /* Node */) > 0) {
        var props = vnode.props;
        var children = vnode.children;
        var ref = vnode.ref;
        unmountChildren(children);
        for (var propName in props) {
            if (isAttrAnEvent(propName)) {
                detachEvent(dom, propName, props[propName]);
            }
        }
        if (ref !== null) {
            Ref.detach(vnode, ref, dom);
        }
    } else if (vtype & 32 /* Portal */) {
            unmountChildren(vnode.children, vnode.type);
        }
    if (!isNullOrUndef(parentDom) && !isNullOrUndef(dom)) {
        parentDom.removeChild(dom);
    }
    // vnode.dom = null
}

var NS = {
    ev: 'http://www.w3.org/2001/xml-events',
    xlink: 'http://www.w3.org/1999/xlink',
    xml: 'http://www.w3.org/XML/1998/namespace'
};
var ATTRS = {
    accentHeight: 'accent-height',
    accumulate: 0,
    additive: 0,
    alignmentBaseline: 'alignment-baseline',
    allowReorder: 'allowReorder',
    alphabetic: 0,
    amplitude: 0,
    arabicForm: 'arabic-form',
    ascent: 0,
    attributeName: 'attributeName',
    attributeType: 'attributeType',
    autoReverse: 'autoReverse',
    azimuth: 0,
    baseFrequency: 'baseFrequency',
    baseProfile: 'baseProfile',
    baselineShift: 'baseline-shift',
    bbox: 0,
    begin: 0,
    bias: 0,
    by: 0,
    calcMode: 'calcMode',
    capHeight: 'cap-height',
    clip: 0,
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    clipPathUnits: 'clipPathUnits',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    contentScriptType: 'contentScriptType',
    contentStyleType: 'contentStyleType',
    cursor: 0,
    cx: 0,
    cy: 0,
    d: 0,
    decelerate: 0,
    descent: 0,
    diffuseConstant: 'diffuseConstant',
    direction: 0,
    display: 0,
    divisor: 0,
    dominantBaseline: 'dominant-baseline',
    dur: 0,
    dx: 0,
    dy: 0,
    edgeMode: 'edgeMode',
    elevation: 0,
    enableBackground: 'enable-background',
    end: 0,
    evEvent: 'ev:event',
    exponent: 0,
    externalResourcesRequired: 'externalResourcesRequired',
    fill: 0,
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    filter: 0,
    filterRes: 'filterRes',
    filterUnits: 'filterUnits',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    focusable: 0,
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    format: 0,
    from: 0,
    fx: 0,
    fy: 0,
    g1: 0,
    g2: 0,
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    glyphRef: 'glyphRef',
    gradientTransform: 'gradientTransform',
    gradientUnits: 'gradientUnits',
    hanging: 0,
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    ideographic: 0,
    imageRendering: 'image-rendering',
    'in': 0,
    in2: 0,
    intercept: 0,
    k: 0,
    k1: 0,
    k2: 0,
    k3: 0,
    k4: 0,
    kernelMatrix: 'kernelMatrix',
    kernelUnitLength: 'kernelUnitLength',
    kerning: 0,
    keyPoints: 'keyPoints',
    keySplines: 'keySplines',
    keyTimes: 'keyTimes',
    lengthAdjust: 'lengthAdjust',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    limitingConeAngle: 'limitingConeAngle',
    local: 0,
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    markerHeight: 'markerHeight',
    markerUnits: 'markerUnits',
    markerWidth: 'markerWidth',
    mask: 0,
    maskContentUnits: 'maskContentUnits',
    maskUnits: 'maskUnits',
    mathematical: 0,
    mode: 0,
    numOctaves: 'numOctaves',
    offset: 0,
    opacity: 0,
    operator: 0,
    order: 0,
    orient: 0,
    orientation: 0,
    origin: 0,
    overflow: 0,
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pathLength: 'pathLength',
    patternContentUnits: 'patternContentUnits',
    patternTransform: 'patternTransform',
    patternUnits: 'patternUnits',
    pointerEvents: 'pointer-events',
    points: 0,
    pointsAtX: 'pointsAtX',
    pointsAtY: 'pointsAtY',
    pointsAtZ: 'pointsAtZ',
    preserveAlpha: 'preserveAlpha',
    preserveAspectRatio: 'preserveAspectRatio',
    primitiveUnits: 'primitiveUnits',
    r: 0,
    radius: 0,
    refX: 'refX',
    refY: 'refY',
    renderingIntent: 'rendering-intent',
    repeatCount: 'repeatCount',
    repeatDur: 'repeatDur',
    requiredExtensions: 'requiredExtensions',
    requiredFeatures: 'requiredFeatures',
    restart: 0,
    result: 0,
    rotate: 0,
    rx: 0,
    ry: 0,
    scale: 0,
    seed: 0,
    shapeRendering: 'shape-rendering',
    slope: 0,
    spacing: 0,
    specularConstant: 'specularConstant',
    specularExponent: 'specularExponent',
    speed: 0,
    spreadMethod: 'spreadMethod',
    startOffset: 'startOffset',
    stdDeviation: 'stdDeviation',
    stemh: 0,
    stemv: 0,
    stitchTiles: 'stitchTiles',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    string: 0,
    stroke: 0,
    strokeDasharray: 'stroke-dasharray',
    strokeDashoffset: 'stroke-dashoffset',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin',
    strokeMiterlimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    surfaceScale: 'surfaceScale',
    systemLanguage: 'systemLanguage',
    tableValues: 'tableValues',
    targetX: 'targetX',
    targetY: 'targetY',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    textLength: 'textLength',
    to: 0,
    transform: 0,
    u1: 0,
    u2: 0,
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicode: 0,
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    values: 0,
    vectorEffect: 'vector-effect',
    version: 0,
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    viewBox: 'viewBox',
    viewTarget: 'viewTarget',
    visibility: 0,
    widths: 0,
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    x: 0,
    xHeight: 'x-height',
    x1: 0,
    x2: 0,
    xChannelSelector: 'xChannelSelector',
    xlinkActuate: 'xlink:actuate',
    xlinkArcrole: 'xlink:arcrole',
    xlinkHref: 'xlink:href',
    xlinkRole: 'xlink:role',
    xlinkShow: 'xlink:show',
    xlinkTitle: 'xlink:title',
    xlinkType: 'xlink:type',
    xmlBase: 'xml:base',
    xmlId: 'xml:id',
    xmlns: 0,
    xmlnsXlink: 'xmlns:xlink',
    xmlLang: 'xml:lang',
    xmlSpace: 'xml:space',
    y: 0,
    y1: 0,
    y2: 0,
    yChannelSelector: 'yChannelSelector',
    z: 0,
    zoomAndPan: 'zoomAndPan'
};
var SVGPropertyConfig = {
    Properties: {},
    DOMAttributeNamespaces: {
        'ev:event': NS.ev,
        'xlink:actuate': NS.xlink,
        'xlink:arcrole': NS.xlink,
        'xlink:href': NS.xlink,
        'xlink:role': NS.xlink,
        'xlink:show': NS.xlink,
        'xlink:title': NS.xlink,
        'xlink:type': NS.xlink,
        'xml:base': NS.xml,
        'xml:id': NS.xml,
        'xml:lang': NS.xml,
        'xml:space': NS.xml
    },
    DOMAttributeNames: {}
};
Object.keys(ATTRS).forEach(function (key) {
    SVGPropertyConfig.Properties[key] = 0;
    if (ATTRS[key]) {
        SVGPropertyConfig.DOMAttributeNames[key] = ATTRS[key];
    }
});

/* tslint:disable: no-empty*/
function patch(lastVnode, nextVnode, lastDom, context, isSvg) {
    lastDom = lastVnode && lastVnode.dom || lastDom;
    if (isVText(nextVnode) && isVText(lastVnode)) {
        return patchVText(lastVnode, nextVnode);
    }
    var newDom;
    if (isSameVNode(lastVnode, nextVnode)) {
        if (isVNode(nextVnode)) {
            isSvg = isNullOrUndef(isSvg) ? lastVnode.isSvg : isSvg;
            if (isSvg) {
                nextVnode.isSvg = isSvg;
            }
            patchProps(lastDom, nextVnode.props, lastVnode.props, lastVnode, isSvg);
            patchChildren(lastDom, lastVnode.children, nextVnode.children, context, isSvg);
            if (nextVnode.ref !== null) {
                Ref.update(lastVnode, nextVnode, lastDom);
            }
            newDom = lastDom;
        } else if (isWidget(nextVnode)) {
            newDom = nextVnode.update(lastVnode, nextVnode, context, lastDom);
            options.afterUpdate(nextVnode);
        }
        nextVnode.dom = newDom;
    } else {
        var parentNode = lastDom.parentNode;
        var nextSibling = lastDom.nextSibling;
        unmount(lastVnode, parentNode);
        newDom = createElement(nextVnode, isSvg, context);
        if (nextVnode !== null) {
            nextVnode.dom = newDom;
        }
        if (parentNode !== null) {
            parentNode.insertBefore(newDom, nextVnode !== null && nextVnode.vtype & 32 /* Portal */ ? null : nextSibling);
        }
    }
    return newDom;
}
function patchArrayChildren(parentDom, lastChildren, nextChildren, context, isSvg) {
    var lastLength = lastChildren.length;
    var nextLength = nextChildren.length;
    if (lastLength === 0) {
        if (nextLength > 0) {
            for (var i = 0; i < nextLength; i++) {
                mountChild(nextChildren[i], parentDom, context, isSvg);
            }
        }
    } else if (nextLength === 0) {
        unmountChildren(lastChildren);
        parentDom.textContent = '';
    } else {
        if (isKeyed(lastChildren, nextChildren)) {
            patchKeyedChildren(lastChildren, nextChildren, parentDom, context, isSvg, lastLength, nextLength);
        } else {
            patchNonKeyedChildren(parentDom, lastChildren, nextChildren, context, isSvg, lastLength, nextLength);
        }
    }
}
function patchChildren(parentDom, lastChildren, nextChildren, context, isSvg) {
    if (lastChildren === nextChildren) {
        return;
    }
    var lastChildrenIsArray = isArray(lastChildren);
    var nextChildrenIsArray = isArray(nextChildren);
    if (lastChildrenIsArray && nextChildrenIsArray) {
        patchArrayChildren(parentDom, lastChildren, nextChildren, context, isSvg);
    } else if (!lastChildrenIsArray && !nextChildrenIsArray) {
        patch(lastChildren, nextChildren, parentDom, context, isSvg);
    } else if (lastChildrenIsArray && !nextChildrenIsArray) {
        patchArrayChildren(parentDom, lastChildren, [nextChildren], context, isSvg);
    } else if (!lastChildrenIsArray && nextChildrenIsArray) {
        patchArrayChildren(parentDom, [lastChildren], nextChildren, context, isSvg);
    }
}
function patchNonKeyedChildren(parentDom, lastChildren, nextChildren, context, isSvg, lastLength, nextLength) {
    var minLength = Math.min(lastLength, nextLength);
    var i = 0;
    while (i < minLength) {
        patch(lastChildren[i], nextChildren[i], parentDom, context, isSvg);
        i++;
    }
    if (lastLength < nextLength) {
        for (i = minLength; i < nextLength; i++) {
            if (parentDom !== null) {
                parentDom.appendChild(createElement(nextChildren[i], isSvg, context));
            }
        }
    } else if (lastLength > nextLength) {
        for (i = minLength; i < lastLength; i++) {
            unmount(lastChildren[i], parentDom);
        }
    }
}
/**
 *
 * Virtual DOM patching algorithm based on ivi by
 * Boris Kaul (@localvoid)
 * Licensed under the MIT License
 * https://github.com/ivijs/ivi/blob/master/LICENSE
 *
 */
function patchKeyedChildren(a, b, dom, context, isSvg, aLength, bLength) {
    var aEnd = aLength - 1;
    var bEnd = bLength - 1;
    var aStart = 0;
    var bStart = 0;
    var i;
    var j;
    var aNode;
    var bNode;
    var nextNode;
    var nextPos;
    var node;
    var aStartNode = a[aStart];
    var bStartNode = b[bStart];
    var aEndNode = a[aEnd];
    var bEndNode = b[bEnd];
    // Step 1
    // tslint:disable-next-line
    outer: {
        // Sync nodes with the same key at the beginning.
        while (aStartNode.key === bStartNode.key) {
            patch(aStartNode, bStartNode, dom, context, isSvg);
            aStart++;
            bStart++;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aStartNode = a[aStart];
            bStartNode = b[bStart];
        }
        // Sync nodes with the same key at the end.
        while (aEndNode.key === bEndNode.key) {
            patch(aEndNode, bEndNode, dom, context, isSvg);
            aEnd--;
            bEnd--;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aEndNode = a[aEnd];
            bEndNode = b[bEnd];
        }
    }
    if (aStart > aEnd) {
        if (bStart <= bEnd) {
            nextPos = bEnd + 1;
            nextNode = nextPos < bLength ? b[nextPos].dom : null;
            while (bStart <= bEnd) {
                node = b[bStart];
                bStart++;
                attachNewNode(dom, createElement(node, isSvg, context), nextNode);
            }
        }
    } else if (bStart > bEnd) {
        while (aStart <= aEnd) {
            unmount(a[aStart++], dom);
        }
    } else {
        var aLeft = aEnd - aStart + 1;
        var bLeft = bEnd - bStart + 1;
        var sources = new Array(bLeft);
        // Mark all nodes as inserted.
        for (i = 0; i < bLeft; i++) {
            sources[i] = -1;
        }
        var moved = false;
        var pos = 0;
        var patched = 0;
        // When sizes are small, just loop them through
        if (bLeft <= 4 || aLeft * bLeft <= 16) {
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLeft) {
                    for (j = bStart; j <= bEnd; j++) {
                        bNode = b[j];
                        if (aNode.key === bNode.key) {
                            sources[j - bStart] = i;
                            if (pos > j) {
                                moved = true;
                            } else {
                                pos = j;
                            }
                            patch(aNode, bNode, dom, context, isSvg);
                            patched++;
                            a[i] = null;
                            break;
                        }
                    }
                }
            }
        } else {
            var keyIndex = new MapClass();
            for (i = bStart; i <= bEnd; i++) {
                keyIndex.set(b[i].key, i);
            }
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLeft) {
                    j = keyIndex.get(aNode.key);
                    if (j !== undefined) {
                        bNode = b[j];
                        sources[j - bStart] = i;
                        if (pos > j) {
                            moved = true;
                        } else {
                            pos = j;
                        }
                        patch(aNode, bNode, dom, context, isSvg);
                        patched++;
                        a[i] = null;
                    }
                }
            }
        }
        if (aLeft === aLength && patched === 0) {
            unmountChildren(a);
            dom.textContent = '';
            while (bStart < bLeft) {
                node = b[bStart];
                bStart++;
                attachNewNode(dom, createElement(node, isSvg, context), null);
            }
        } else {
            i = aLeft - patched;
            while (i > 0) {
                aNode = a[aStart++];
                if (aNode !== null) {
                    unmount(aNode, dom);
                    i--;
                }
            }
            if (moved) {
                var seq = lis(sources);
                j = seq.length - 1;
                for (i = bLeft - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        nextPos = pos + 1;
                        attachNewNode(dom, createElement(node, isSvg, context), nextPos < bLength ? b[nextPos].dom : null);
                    } else {
                        if (j < 0 || i !== seq[j]) {
                            pos = i + bStart;
                            node = b[pos];
                            nextPos = pos + 1;
                            attachNewNode(dom, node.dom, nextPos < bLength ? b[nextPos].dom : null);
                        } else {
                            j--;
                        }
                    }
                }
            } else if (patched !== bLeft) {
                for (i = bLeft - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        nextPos = pos + 1;
                        attachNewNode(dom, createElement(node, isSvg, context), nextPos < bLength ? b[nextPos].dom : null);
                    }
                }
            }
        }
    }
}
function attachNewNode(parentDom, newNode, nextNode) {
    if (isNullOrUndef(nextNode)) {
        parentDom.appendChild(newNode);
    } else {
        parentDom.insertBefore(newNode, nextNode);
    }
}
/**
 * Slightly modified Longest Increased Subsequence algorithm, it ignores items that have -1 value, they're representing
 * new items.
 *
 * http://en.wikipedia.org/wiki/Longest_increasing_subsequence
 *
 * @param a Array of numbers.
 * @returns Longest increasing subsequence.
 */
function lis(a) {
    var p = a.slice();
    var result = [];
    result.push(0);
    var u;
    var v;
    for (var i = 0, il = a.length; i < il; ++i) {
        if (a[i] === -1) {
            continue;
        }
        var j = result[result.length - 1];
        if (a[j] < a[i]) {
            p[i] = j;
            result.push(i);
            continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
            var c = (u + v) / 2 | 0;
            if (a[result[c]] < a[i]) {
                u = c + 1;
            } else {
                v = c;
            }
        }
        if (a[i] < a[result[u]]) {
            if (u > 0) {
                p[i] = result[u - 1];
            }
            result[u] = i;
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
function isKeyed(lastChildren, nextChildren) {
    return nextChildren.length > 0 && !isNullOrUndef(nextChildren[0]) && !isNullOrUndef(nextChildren[0].key) && lastChildren.length > 0 && !isNullOrUndef(lastChildren[0]) && !isNullOrUndef(lastChildren[0].key);
}
function isSameVNode(a, b) {
    if (isInvalid(a) || isInvalid(b) || isArray(a) || isArray(b)) {
        return false;
    }
    return a.type === b.type && a.key === b.key;
}
function patchVText(lastVNode, nextVNode) {
    var dom = lastVNode.dom;
    if (dom === null) {
        return;
    }
    var nextText = nextVNode.text;
    nextVNode.dom = dom;
    if (lastVNode.text !== nextText) {
        dom.nodeValue = nextText;
    }
    return dom;
}
var skipProps = {
    children: 1,
    key: 1,
    ref: 1,
    owner: 1
};
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
function setStyle(domStyle, style, value) {
    if (isNullOrUndef(value) || isNumber(value) && isNaN(value)) {
        domStyle[style] = '';
        return;
    }
    if (style === 'float') {
        domStyle['cssFloat'] = value;
        domStyle['styleFloat'] = value;
        return;
    }
    domStyle[style] = !isNumber(value) || IS_NON_DIMENSIONAL.test(style) ? value : value + 'px';
}
function patchEvent(eventName, lastEvent, nextEvent, domNode) {
    if (lastEvent !== nextEvent) {
        if (isFunction(lastEvent)) {
            detachEvent(domNode, eventName, lastEvent);
        }
        attachEvent(domNode, eventName, nextEvent);
    }
}
function patchStyle(lastAttrValue, nextAttrValue, dom) {
    var domStyle = dom.style;
    var style;
    var value;
    if (isString(nextAttrValue)) {
        domStyle.cssText = nextAttrValue;
        return;
    }
    if (!isNullOrUndef(lastAttrValue) && !isString(lastAttrValue)) {
        for (style in nextAttrValue) {
            value = nextAttrValue[style];
            if (value !== lastAttrValue[style]) {
                setStyle(domStyle, style, value);
            }
        }
    } else {
        for (style in nextAttrValue) {
            value = nextAttrValue[style];
            setStyle(domStyle, style, value);
        }
    }
}
function patchProp(domNode, prop, lastValue, nextValue, lastVnode, isSvg) {
    // fix the value update for textarea/input
    if (lastValue !== nextValue || prop === 'value') {
        if (prop === 'className') {
            prop = 'class';
        }
        if (skipProps[prop] === 1) {
            return;
        } else if (prop === 'class' && !isSvg) {
            domNode.className = nextValue;
        } else if (prop === 'dangerouslySetInnerHTML') {
            var lastHtml = lastValue && lastValue.__html;
            var nextHtml = nextValue && nextValue.__html;
            if (lastHtml !== nextHtml) {
                if (!isNullOrUndef(nextHtml)) {
                    if (isValidElement(lastVnode) && lastVnode.children !== EMPTY_CHILDREN) {
                        unmountChildren(lastVnode.children);
                        lastVnode.children = [];
                    }
                    domNode.innerHTML = nextHtml;
                }
            }
        } else if (isAttrAnEvent(prop)) {
            patchEvent(prop, lastValue, nextValue, domNode);
        } else if (prop === 'style') {
            patchStyle(lastValue, nextValue, domNode);
        } else if (prop !== 'list' && prop !== 'type' && !isSvg && prop in domNode) {
            setProperty(domNode, prop, nextValue == null ? '' : nextValue);
            if (nextValue == null || nextValue === false) {
                domNode.removeAttribute(prop);
            }
        } else if (isNullOrUndef(nextValue) || nextValue === false) {
            domNode.removeAttribute(prop);
        } else {
            var namespace = SVGPropertyConfig.DOMAttributeNamespaces[prop];
            if (isSvg && namespace) {
                if (nextValue) {
                    domNode.setAttributeNS(namespace, prop, nextValue);
                } else {
                    var colonPosition = prop.indexOf(':');
                    var localName = colonPosition > -1 ? prop.substr(colonPosition + 1) : prop;
                    domNode.removeAttributeNS(namespace, localName);
                }
            } else {
                if (!isFunction(nextValue)) {
                    domNode.setAttribute(prop, nextValue);
                }
                // WARNING: Non-event attributes with function values:
                // https://reactjs.org/blog/2017/09/08/dom-attributes-in-react-16.html#changes-in-detail
            }
        }
    }
}
function setProperty(node, name, value) {
    try {
        node[name] = value;
    } catch (e) {}
}
function patchProps(domNode, nextProps, previousProps, lastVnode, isSvg) {
    for (var propName in previousProps) {
        var value = previousProps[propName];
        if (isNullOrUndef(nextProps[propName]) && !isNullOrUndef(value)) {
            if (isAttrAnEvent(propName)) {
                detachEvent(domNode, propName, value);
            } else if (propName === 'dangerouslySetInnerHTML') {
                domNode.textContent = '';
            } else if (propName === 'className') {
                domNode.removeAttribute('class');
            } else {
                domNode.removeAttribute(propName);
            }
        }
    }
    for (var propName$1 in nextProps) {
        patchProp(domNode, propName$1, previousProps[propName$1], nextProps[propName$1], lastVnode, isSvg);
    }
}

var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
function createElement(vnode, isSvg, parentContext, parentComponent) {
    var domNode;
    if (isValidElement(vnode)) {
        var vtype = vnode.vtype;
        if (vtype & (4 /* Composite */ | 8 /* Stateless */)) {
            domNode = vnode.init(parentContext, parentComponent);
            options.afterMount(vnode);
        } else if (vtype & 1 /* Text */) {
                domNode = doc.createTextNode(vnode.text);
                vnode.dom = domNode;
            } else if (vtype & 2 /* Node */) {
                domNode = mountVNode$1(vnode, isSvg, parentContext, parentComponent);
            } else if (vtype & 16 /* Void */) {
                domNode = vnode.dom;
            } else if (isPortal(vtype, vnode)) {
            vnode.type.appendChild(createElement(vnode.children, isSvg, parentContext, parentComponent));
            domNode = doc.createTextNode('');
        }
    } else if (isString(vnode) || isNumber(vnode)) {
        domNode = doc.createTextNode(vnode);
    } else if (isNullOrUndef(vnode) || isBoolean(vnode)) {
        domNode = doc.createTextNode('');
    } else if (isArray(vnode)) {
        domNode = doc.createDocumentFragment();
        vnode.forEach(function (child) {
            if (!isInvalid(child)) {
                var childNode = createElement(child, isSvg, parentContext, parentComponent);
                if (childNode) {
                    domNode.appendChild(childNode);
                }
            }
        });
    } else {
        throw new Error('Unsupported VNode.');
    }
    return domNode;
}
function mountVNode$1(vnode, isSvg, parentContext, parentComponent) {
    if (vnode.isSvg) {
        isSvg = true;
    } else if (vnode.type === 'svg') {
        isSvg = true;
        /* istanbul ignore next */
    } else if (!isSupportSVG) {
        isSvg = false;
    }
    if (isSvg) {
        vnode.namespace = SVG_NAMESPACE;
        vnode.isSvg = isSvg;
    }
    var domNode = !isSvg ? doc.createElement(vnode.type) : doc.createElementNS(vnode.namespace, vnode.type);
    setProps(domNode, vnode, isSvg);
    if (vnode.type === 'foreignObject') {
        isSvg = false;
    }
    var children = vnode.children;
    if (isArray(children)) {
        for (var i = 0, len = children.length; i < len; i++) {
            mountChild(children[i], domNode, parentContext, isSvg, parentComponent);
        }
    } else {
        mountChild(children, domNode, parentContext, isSvg, parentComponent);
    }
    vnode.dom = domNode;
    if (vnode.ref !== null) {
        Ref.attach(vnode, vnode.ref, domNode);
    }
    return domNode;
}
function mountChild(child, domNode, parentContext, isSvg, parentComponent) {
    child.parentContext = parentContext || EMPTY_OBJ;
    var childNode = createElement(child, isSvg, parentContext, parentComponent);
    if (childNode !== null) {
        domNode.appendChild(childNode);
    }
}
function setProps(domNode, vnode, isSvg) {
    var props = vnode.props;
    for (var p in props) {
        patchProp(domNode, p, null, props[p], null, isSvg);
    }
}

function createVText(text) {
    return {
        text: text,
        vtype: 1 /* Text */
        , dom: null
    };
}

function createVoid() {
    var dom = doc.createTextNode('');
    return {
        dom: dom,
        vtype: 16 /* Void */
    };
}

var readyComponents = [];
function errorCatcher(fn, component) {
    try {
        return fn();
    } catch (error) {
        errorHandler(component, error);
    }
}
function errorHandler(component, error) {
    var boundary;
    while (true) {
        if (isFunction(component.componentDidCatch)) {
            boundary = component;
            break;
        } else if (component._parentComponent) {
            component = component._parentComponent;
        } else {
            break;
        }
    }
    if (boundary) {
        var _disable = boundary._disable;
        boundary._disable = false;
        boundary.componentDidCatch(error);
        boundary._disable = _disable;
    } else {
        throw error;
    }
}
function mountVNode(vnode, parentContext, parentComponent) {
    return createElement(vnode, false, parentContext, parentComponent);
}
function mountComponent(vnode, parentContext, parentComponent) {
    var ref = vnode.ref;
    vnode.component = new vnode.type(vnode.props, parentContext);
    var component = vnode.component;
    if (isComponent(parentComponent)) {
        component._parentComponent = parentComponent;
    }
    if (isFunction(component.componentWillMount)) {
        errorCatcher(function () {
            component.componentWillMount();
        }, component);
        component.state = component.getState();
    }
    component._dirty = false;
    var rendered = renderComponent(component);
    component._rendered = rendered;
    if (isFunction(component.componentDidMount)) {
        readyComponents.push(component);
    }
    if (!isNullOrUndef(ref)) {
        Ref.attach(vnode, ref, component.dom);
    }
    var dom = vnode.dom = component.dom = mountVNode(rendered, getChildContext(component, parentContext), component);
    component._disable = false;
    return dom;
}
function mountStatelessComponent(vnode, parentContext) {
    vnode._rendered = vnode.type(vnode.props, parentContext);
    return vnode.dom = mountVNode(vnode._rendered, parentContext);
}
function getChildContext(component, context) {
    if (component.getChildContext) {
        return extend(context, component.getChildContext());
    }
    return context;
}
function renderComponent(component) {
    Current.current = component;
    var rendered;
    errorCatcher(function () {
        rendered = component.render();
    }, component);
    if (isNumber(rendered) || isString(rendered)) {
        rendered = createVText(rendered);
    } else if (isUndefined(rendered)) {
        rendered = createVoid();
    }
    Current.current = null;
    return rendered;
}
function flushMount() {
    if (!readyComponents.length) {
        return;
    }
    // @TODO: perf
    var queue = readyComponents.slice(0);
    readyComponents.length = 0;
    queue.forEach(function (item) {
        if (isFunction(item)) {
            item();
        } else if (item.componentDidMount) {
            errorCatcher(function () {
                item.componentDidMount();
            }, item);
        }
    });
}
function reRenderComponent(prev, current) {
    var component = current.component = prev.component;
    var nextProps = current.props;
    var nextContext = component.context;
    component._disable = true;
    if (isFunction(component.componentWillReceiveProps)) {
        errorCatcher(function () {
            component.componentWillReceiveProps(nextProps, nextContext);
        }, component);
    }
    component._disable = false;
    component.prevProps = component.props;
    component.prevState = component.state;
    component.prevContext = component.context;
    component.props = nextProps;
    component.context = nextContext;
    if (!isNullOrUndef(current.ref)) {
        Ref.update(prev, current);
    }
    updateComponent(component);
    return component.dom;
}
function reRenderStatelessComponent(prev, current, parentContext, domNode) {
    var lastRendered = prev._rendered;
    var rendered = current.type(current.props, parentContext);
    current._rendered = rendered;
    return current.dom = patch(lastRendered, rendered, domNode, parentContext);
}
function updateComponent(component, isForce) {
    if (isForce === void 0) isForce = false;

    var lastDom = component.dom;
    var props = component.props;
    var state = component.getState();
    var context = component.context;
    var prevProps = component.prevProps || props;
    var prevState = component.prevState || state;
    var prevContext = component.prevContext || context;
    component.props = prevProps;
    component.context = prevContext;
    var skip = false;
    if (!isForce && isFunction(component.shouldComponentUpdate) && component.shouldComponentUpdate(props, state, context) === false) {
        skip = true;
    } else if (isFunction(component.componentWillUpdate)) {
        errorCatcher(function () {
            component.componentWillUpdate(props, state, context);
        }, component);
    }
    component.props = props;
    component.state = state;
    component.context = context;
    component._dirty = false;
    if (!skip) {
        var lastRendered = component._rendered;
        var rendered = renderComponent(component);
        var childContext = getChildContext(component, context);
        component.dom = patch(lastRendered, rendered, lastDom, childContext);
        component._rendered = rendered;
        if (isFunction(component.componentDidUpdate)) {
            errorCatcher(function () {
                component.componentDidUpdate(prevProps, prevState, context);
            }, component);
        }
    }
    component.prevProps = component.props;
    component.prevState = component.state;
    component.prevContext = component.context;
    if (component._pendingCallbacks) {
        while (component._pendingCallbacks.length) {
            component._pendingCallbacks.pop().call(component);
        }
    }
    flushMount();
}
function unmountComponent(vnode) {
    var component = vnode.component;
    if (isFunction(component.componentWillUnmount)) {
        errorCatcher(function () {
            component.componentWillUnmount();
        }, component);
    }
    component._disable = true;
    unmount(component._rendered);
    if (!isNullOrUndef(vnode.ref)) {
        Ref.detach(vnode, vnode.ref, vnode.dom);
    }
}
function unmountStatelessComponent(vnode) {
    unmount(vnode._rendered);
}

var items = [];
function enqueueRender(component) {
    // tslint:disable-next-line:no-conditional-assignment
    if (!component._dirty && (component._dirty = true) && items.push(component) === 1) {
        nextTick(rerender);
    }
}
function rerender() {
    var p;
    var list = items;
    items = [];
    // tslint:disable-next-line:no-conditional-assignment
    while (p = list.pop()) {
        if (p._dirty) {
            updateComponent(p);
        }
    }
}

var Component = function Component(props, context) {
    this._dirty = true;
    this._disable = true;
    this._pendingStates = [];
    // Is a React Component.
    // tslint:disable-next-line:max-line-length
    // see: https://github.com/facebook/react/blob/3c977dea6b96f6a9bb39f09886848da870748441/packages/react/src/ReactBaseClasses.js#L26
    this.isReactComponent = EMPTY_OBJ;
    if (!this.state) {
        this.state = {};
    }
    this.props = props || {};
    this.context = context || EMPTY_OBJ;
    this.refs = {};
};
Component.prototype.setState = function setState(state, callback) {
    if (state) {
        (this._pendingStates = this._pendingStates || []).push(state);
    }
    if (isFunction(callback)) {
        (this._pendingCallbacks = this._pendingCallbacks || []).push(callback);
    }
    if (!this._disable) {
        enqueueRender(this);
    }
};
Component.prototype.getState = function getState() {
    var this$1 = this;

    // tslint:disable-next-line:no-this-assignment
    var ref = this;
    var _pendingStates = ref._pendingStates;
    var state = ref.state;
    var props = ref.props;
    if (!_pendingStates.length) {
        return state;
    }
    var stateClone = clone(state);
    var queue = _pendingStates.concat();
    this._pendingStates.length = 0;
    queue.forEach(function (nextState) {
        if (isFunction(nextState)) {
            nextState = nextState.call(this$1, state, props);
        }
        extend(stateClone, nextState);
    });
    return stateClone;
};
Component.prototype.forceUpdate = function forceUpdate(callback) {
    if (isFunction(callback)) {
        (this._pendingCallbacks = this._pendingCallbacks || []).push(callback);
    }
    updateComponent(this, true);
};
// tslint:disable-next-line
Component.prototype.render = function render(nextProps, nextState, nextContext) {};

var PureComponent = function (Component$$1) {
    function PureComponent() {
        Component$$1.apply(this, arguments);
        this.isPureComponent = true;
    }

    if (Component$$1) PureComponent.__proto__ = Component$$1;
    PureComponent.prototype = Object.create(Component$$1 && Component$$1.prototype);
    PureComponent.prototype.constructor = PureComponent;
    PureComponent.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
        return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
    };

    return PureComponent;
}(Component);

function render(vnode, container, callback) {
    if (!container) {
        throw new Error(container + " should be a DOM Element");
    }
    var lastVnode = container._component;
    var dom;
    options.roots.push(vnode);
    if (lastVnode !== undefined) {
        options.roots = options.roots.filter(function (item) {
            return item !== lastVnode;
        });
        dom = patch(lastVnode, vnode, container, {});
    } else {
        dom = mountVNode(vnode, {});
        container.appendChild(dom);
    }
    if (container) {
        container._component = vnode;
    }
    flushMount();
    if (callback) {
        callback();
    }
    return isComposite(vnode) ? vnode.component : dom;
}

function createVNode(type, props, children, key, namespace, owner, ref) {
    return {
        type: type,
        key: key || null,
        vtype: 2 /* Node */
        , props: props || EMPTY_OBJ,
        children: children,
        namespace: namespace || null,
        _owner: owner,
        dom: null,
        ref: ref || null
    };
}

function h(type, props, children) {
    var childNodes;
    if (props.children) {
        if (!children) {
            children = props.children;
        }
    }
    if (isArray(children)) {
        childNodes = [];
        addChildren(childNodes, children, type);
    } else if (isString(children) || isNumber(children)) {
        children = createVText(String(children));
    } else if (!isValidElement(children)) {
        children = EMPTY_CHILDREN;
    }
    props.children = childNodes !== undefined ? childNodes : children;
    return createVNode(type, props, props.children, props.key, props.namespace, props.owner, props.ref);
}
function addChildren(childNodes, children, type) {
    if (isString(children) || isNumber(children)) {
        childNodes.push(createVText(String(children)));
    } else if (isValidElement(children)) {
        childNodes.push(children);
    } else if (isArray(children)) {
        for (var i = 0; i < children.length; i++) {
            addChildren(childNodes, children[i], type);
        }
    }
}

var ComponentWrapper = function ComponentWrapper(type, props) {
    this.vtype = 4 /* Composite */;
    this.type = type;
    this.name = type.name || type.toString().match(/^function\s*([^\s(]+)/)[1];
    type.displayName = this.name;
    this._owner = props.owner;
    delete props.owner;
    if (this.ref = props.ref) {
        delete props.ref;
    }
    this.props = props;
    this.key = props.key;
    this.dom = null;
};
ComponentWrapper.prototype.init = function init(parentContext, parentComponent) {
    return mountComponent(this, parentContext, parentComponent);
};
ComponentWrapper.prototype.update = function update(previous, current, parentContext, domNode) {
    return reRenderComponent(previous, this);
};
ComponentWrapper.prototype.destroy = function destroy() {
    unmountComponent(this);
};

var StateLessComponent = function StateLessComponent(type, props) {
    this.vtype = 8 /* Stateless */;
    this.type = type;
    this._owner = props.owner;
    delete props.owner;
    this.props = props;
    this.key = props.key;
};
StateLessComponent.prototype.init = function init(parentContext) {
    return mountStatelessComponent(this, parentContext);
};
StateLessComponent.prototype.update = function update(previous, current, parentContext, domNode) {
    var props = current.props;
    var context = current.context;
    var shouldComponentUpdate = props.onShouldComponentUpdate;
    if (isFunction(shouldComponentUpdate) && !shouldComponentUpdate(previous.props, props, context)) {
        current._rendered = previous._rendered;
        return domNode;
    }
    return reRenderStatelessComponent(previous, this, parentContext, domNode);
};
StateLessComponent.prototype.destroy = function destroy() {
    unmountStatelessComponent(this);
};

function transformPropsForRealTag(type, props) {
    var newProps = {};
    for (var propName in props) {
        var propValue = props[propName];
        if (propName === 'defaultValue') {
            newProps.value = props.value || props.defaultValue;
            continue;
        }
        var svgPropName = SVGPropertyConfig.DOMAttributeNames[propName];
        if (svgPropName && svgPropName !== propName) {
            newProps[svgPropName] = propValue;
            continue;
        }
        newProps[propName] = propValue;
    }
    return newProps;
}
/**
 *
 * @param props
 * @param defaultProps
 * defaultProps should respect null but ignore undefined
 * @see: https://facebook.github.io/react/docs/react-component.html#defaultprops
 */
function transformPropsForComponent(props, defaultProps) {
    var newProps = {};
    for (var propName in props) {
        var propValue = props[propName];
        newProps[propName] = propValue;
    }
    if (defaultProps) {
        for (var propName$1 in defaultProps) {
            if (isUndefined(newProps[propName$1])) {
                newProps[propName$1] = defaultProps[propName$1];
            }
        }
    }
    return newProps;
}
function createElement$2(type, properties) {
    var _children = [],
        len = arguments.length - 2;
    while (len-- > 0) _children[len] = arguments[len + 2];

    var children = _children;
    if (_children) {
        if (_children.length === 1) {
            children = _children[0];
        } else if (_children.length === 0) {
            children = undefined;
        }
    }
    var props;
    if (isString(type)) {
        props = transformPropsForRealTag(type, properties);
        props.owner = Current.current;
        return h(type, props, children);
    } else if (isFunction(type)) {
        props = transformPropsForComponent(properties, type.defaultProps);
        if (!props.children || props.children === EMPTY_CHILDREN) {
            props.children = children || EMPTY_CHILDREN;
        }
        props.owner = Current.current;
        return type.prototype && type.prototype.render ? new ComponentWrapper(type, props) : new StateLessComponent(type, props);
    }
    return type;
}

function cloneElement(vnode, props) {
    var children = [],
        len = arguments.length - 2;
    while (len-- > 0) children[len] = arguments[len + 2];

    if (isVText(vnode)) {
        vnode.dom = null;
        return vnode;
    }
    if (isString(vnode)) {
        return createVText(vnode);
    }
    var properties = clone(extend(clone(vnode.props), props));
    if (vnode.namespace) {
        properties.namespace = vnode.namespace;
    }
    if (vnode.vtype & 4 /* Composite */ && !isNullOrUndef(vnode.ref)) {
        properties.ref = vnode.ref;
    }
    var childrenTmp = (arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children || properties.children) || [];
    if (childrenTmp.length) {
        if (childrenTmp.length === 1) {
            childrenTmp = children[0];
        }
    }
    if (isArray(vnode)) {
        return vnode.map(function (item) {
            return cloneElement(item);
        });
    }
    var newVNode = createElement$2(vnode.type, properties);
    if (isArray(childrenTmp)) {
        var _children = childrenTmp.map(function (child) {
            return cloneElement(child, child.props);
        });
        if (_children.length === 0) {
            _children = EMPTY_CHILDREN;
        }
        if (isVNode(newVNode)) {
            newVNode.children = _children;
        }
        newVNode.props.children = _children;
    } else if (childrenTmp) {
        if (isVNode(newVNode)) {
            newVNode.children = childrenTmp;
        }
        newVNode.props.children = cloneElement(childrenTmp, childrenTmp.props);
    }
    return newVNode;
}

var Children = {
    map: function map(children, fn, ctx) {
        if (isNullOrUndef(children)) {
            return children;
        }
        children = Children.toArray(children);
        if (ctx && ctx !== children) {
            fn = fn.bind(ctx);
        }
        return children.map(fn);
    },
    forEach: function forEach(children, fn, ctx) {
        if (isNullOrUndef(children)) {
            return;
        }
        children = Children.toArray(children);
        if (ctx && ctx !== children) {
            fn = fn.bind(ctx);
        }
        for (var i = 0, len = children.length; i < len; i++) {
            var child = isInvalid(children[i]) ? null : children[i];
            fn(child, i, children);
        }
    },
    count: function count(children) {
        children = Children.toArray(children);
        return children.length;
    },
    only: function only(children) {
        children = Children.toArray(children);
        if (children.length !== 1) {
            throw new Error('Children.only() expects only one child.');
        }
        return children[0];
    },
    toArray: function toArray(children) {
        if (isNullOrUndef(children)) {
            return [];
        }
        if (isArray(children)) {
            var result = [];
            flatten(children, result);
            return result;
        }
        return EMPTY_CHILDREN.concat(children);
    }
};
function flatten(arr, result) {
    for (var i = 0, len = arr.length; i < len; i++) {
        var value = arr[i];
        if (isArray(value)) {
            flatten(value, result);
        } else {
            result.push(value);
        }
    }
    return result;
}

// tslint:disable:no-conditional-assignment
function hydrate(vnode, container, callback) {
    if (container !== null) {
        // lastChild causes less reflow than firstChild
        var dom = container.lastChild;
        // there should be only a single entry for the root
        while (dom) {
            var next = dom.previousSibling;
            container.removeChild(dom);
            dom = next;
        }
        return render(vnode, container, callback);
    }
}

function createPortal(children, container) {
    return {
        type: container,
        vtype: 32 /* Portal */
        , children: children,
        dom: null
    };
}

function unmountComponentAtNode(dom) {
    var component = dom._component;
    if (isValidElement(component)) {
        unmount(component, dom);
        delete dom._component;
        return true;
    }
    return false;
}
function findDOMNode(component) {
    return component && component.dom || component;
}
function createFactory(type) {
    return createElement$2.bind(null, type);
}
var WrapperComponent = function (Component$$1) {
    function WrapperComponent() {
        Component$$1.apply(this, arguments);
    }

    if (Component$$1) WrapperComponent.__proto__ = Component$$1;
    WrapperComponent.prototype = Object.create(Component$$1 && Component$$1.prototype);
    WrapperComponent.prototype.constructor = WrapperComponent;

    WrapperComponent.prototype.getChildContext = function getChildContext() {
        // tslint:disable-next-line
        return this.props.context;
    };
    WrapperComponent.prototype.render = function render$$1() {
        return this.props.children;
    };

    return WrapperComponent;
}(Component);
function unstable_renderSubtreeIntoContainer(parentComponent, vnode, container, callback) {
    // @TODO: should handle props.context?
    var wrapper = createElement$2(WrapperComponent, { context: parentComponent.context }, vnode);
    var rendered = render(wrapper, container);
    if (callback) {
        callback.call(rendered);
    }
    return rendered;
}
function isValidElement$1(element) {
    return isValidElement(element) && (element.vtype & (4 /* Composite */ | 2 /* Node */)) > 0;
}
var unstable_batchedUpdates = nextTick;

var nerv = {
    Children: Children,
    Component: Component,
    PureComponent: PureComponent,
    createElement: createElement$2,
    cloneElement: cloneElement,
    render: render,
    nextTick: nextTick,
    options: options,
    findDOMNode: findDOMNode,
    isValidElement: isValidElement$1,
    unmountComponentAtNode: unmountComponentAtNode,
    createPortal: createPortal,
    unstable_renderSubtreeIntoContainer: unstable_renderSubtreeIntoContainer,
    hydrate: hydrate,
    createFactory: createFactory,
    unstable_batchedUpdates: unstable_batchedUpdates
};

//exports.Children = Children;
//exports.Component = Component;
//exports.PureComponent = PureComponent;
//exports.createElement = createElement$2;
//exports.cloneElement = cloneElement;
//exports.render = render;
//exports.nextTick = nextTick;
//exports.options = options;
//exports.findDOMNode = findDOMNode;
//exports.isValidElement = isValidElement$1;
//exports.unmountComponentAtNode = unmountComponentAtNode;
//exports.createPortal = createPortal;
//exports.unstable_renderSubtreeIntoContainer = unstable_renderSubtreeIntoContainer;
//exports.hydrate = hydrate;
//exports.createFactory = createFactory;
//exports.unstable_batchedUpdates = unstable_batchedUpdates;
window.React = window.ReactDOM = nerv;
//module.exports = nerv;

//exports['default'] = index;
//# sourceMappingURL=index.js.map
