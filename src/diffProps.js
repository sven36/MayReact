import {
    addEvent,
    getBrowserName,
    eventHooks
} from './event';
import {
    diffChildren
} from './MayDom';

import {
    Refs
} from './Refs';
import {
    mayQueue
} from './util';

//之前是 mount的时候setDomAttr一个方法 diff的时候diffProps一个方法
//后来发现 写着写着要修改点setDomAttr的内容 diff的时候还要在判断一遍
//那干脆把这两个合成一个方法好了
export function diffProps(prev, now) {
    var props = now.props;
    var hostNode = now.mayInfo.hostNode;
    var prevStyle = prev && prev.props.style;
    var nowStyle = props.style;

    if (!prev) { //setDomAttr
        setDomAttr(hostNode, props);
        if (nowStyle) {
            patchStyle(hostNode, prevStyle, nowStyle);
        }
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
                mayQueue.lifeCycleQueue.push(now.ref.bind(now, now));
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
        if (prevStyle !== nowStyle) {
            patchStyle(hostNode, prevStyle, nowStyle);
        }
    }

}

export var FormElement = {
    input: 1,
    select: 1,
}
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

function isEvent(name) {
    return /^on[A-Z]/.test(name);
}
export function patchStyle(dom, prevStyle, newStyle) {
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
                _style = newStyle[name]
                break;
        }
        dom.style[cssName] = _style;
    }
    for (var key in prevStyle) {
        if (!(key in newStyle)) {
            key = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^ms-/i, '-ms-');
            dom.style[key] = '';
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
}