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
    if (props['className']) {
        dom.setAttribute('class', props['className']);
    }

    // var currentVal = dom.getAttribute(name);

}
export function removeDomAttr(dom, props, key) {
    var nodeType = dom.nodeType;
    // Don't get/set attributes on text, comment and attribute nodes
    if (nodeType === 3 || nodeType === 8 || nodeType === 2) {
        return;
    }
    if (key.indexOf('on') !== 0) {
        switch (key) {
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
        dom.removeEventListener(key, eventProxy);
    }


}

export function eventProxy(e) {
    return this._listener[e.type](e);
}
export function extend(target, src) {
    for (var key in src) {
        target[key] = src[key];
    }
    return target;
}