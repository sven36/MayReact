/*const cssSuffix = {
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
describe("style", function () {
    it("patchStyle", function () {
        var dom = document.createElement('div');
        var sameStyle = {};
        patchStyle(dom, sameStyle, sameStyle);
        expect(dom.style).toEqual({});

        dom.style.color = "red";
        patchStyle(dom, {
            color: "red"
        }, { color: "green" });
        expect(dom.style).toEqual({ color: "green" });

        patchStyle(dom, {
            color: "red"
        }, { color: null });
        expect(dom.style).toEqual({ color: "" });

        patchStyle(dom, {
            color: "red"
        }, { color: false });
        expect(dom.style).toEqual({ color: "" });
        dom.style.backgroundColor = "black";
        patchStyle(dom, dom.style, {});
        expect(dom.style).toEqual({ backgroundColor: "", color: "" });
    });
    // it("cssName", function () {
    //     expect(cssName("xxx")).toBe(null);
    // });

});*/