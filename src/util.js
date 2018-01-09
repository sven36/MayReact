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
const cssPrefix = {
    //动画属性（Animation）
    /* Safari 和 Chrome */
    WebkitAnimation: '-webkit-animation',
    WebkitAnimationName: '-webkit-animation-name',
    WebkitAnimationDuration: '-webkit-animation-duration',
    WebkitAnimationTimingFunction: '-webkit-animation-timing-function',
    WebkitAnimationDelay: '-webkit-animation-delay',
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
        if (key !== 'children' && key !== 'className' && key !== 'key' && key !== 'style') {
            if (key.indexOf('on') !== 0) {
                if (dom.nodeName !== 'INPUT' && key !== 'value') {
                    dom.setAttribute(key, props[key]);
                } else { //input value setAttribute会失败 故直接赋值
                    dom[key] = props[key];
                }
            } else {
                var e = key.substring(2).toLowerCase();
                dom.addEventListener(e, eventProxy);
                (dom._listener || (dom._listener = {}))[e] = props[key];
            }
        }
    }
    if (props['style']) {
        var _obj = props['style'];
        var _style = '';
        for (var name in _obj) {
            //backgroundColor 替换为 background-color Webkit替换为-webkit-   ms单独替换一次
            _style += name.replace(/([A-Z])/g, '-$1').replace(/^ms-/i, '-ms-') + ':';

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

        }
        dom.setAttribute('style', _style);
    }
    if (props['className']) {
        dom.setAttribute('class', props['className']);
    }

    // var currentVal = dom.getAttribute(name);

}


export function eventProxy(e) {
    return this._listener[e.type](e);
}