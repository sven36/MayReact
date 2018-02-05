import {
    createElement
} from '../src/May';
import {
    Component
} from '../src/Component';
import {
    render
} from '../src/may-dom/MayDom';
import {
    dispatchEvent
} from '../src/event';

var ReactDOM = {
    render: render
}

// var React = require('react');//hyphenate
// var ReactDOM = require('react-dom');


// import React from '../dist/ReactANU';
// var ReactDOM = React;

function findAllInRenderedTree(inst, test) {
    var ret = [];
    if (!inst) {
        return ret;
    }
    if (inst.nodeType && inst.nodeType === 1) { //dom
        if (test(inst)) {
            ret.push(inst);
        }
        var children = [].slice.call(inst.childNodes);
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            ret = ret.concat(findAllInRenderedTree(el, test));
        }
    }
    if (inst.nodeType && inst.nodeType === 8) { //如果是文本，注释
        return ret;
    } else if (inst.mayInfo) { //如果是元素虚拟DOM
        var dom = inst.mayInfo.hostNode;
        if (dom && dom.nodeType === 1 && test(dom)) {
            ret.push(dom);
        }
        var children = [].slice.call(dom.childNodes);
        if (children) {
            for (var i = 0, n = children.length; i < n; i++) {
                var el = children[i];
                ret = ret.concat(findAllInRenderedTree(el, test));
            }
        }

    } else if (inst.mayInst) { //组件实例都带有refs对象
        var rendered = inst.mayInst.rendered;
        if (rendered) {
            //如果是实例
            ret = ret.concat(findAllInRenderedTree(rendered, test));
        }
    }

    return ret;
}

var ReactTestUtils = {
    renderIntoDocument: function (element) {
        var div = document.createElement("div");
        return ReactDOM.render(element, div);
    },
    isDOMComponent: function (inst) {
        return !!(inst && inst instanceof HTMLElement);
    },
    findAllInRenderedTree: function (inst, fn) {
        if (!inst) {
            return [];
        }
        return findAllInRenderedTree(inst, fn);
    },
    /**
     * 找出所有匹配指定标签的节点
     */
    scryRenderedDOMComponentsWithTag: function (root, tagName) {
        return ReactTestUtils.findAllInRenderedTree(root, function (inst) {
            return (
                ReactTestUtils.isDOMComponent(inst) &&
                inst.tagName.toUpperCase() === tagName.toUpperCase()
            );
        });
    },
    /**
     * 找出所有匹配指定className的节点
     */
    scryRenderedDOMComponentsWithClass: function (root, classNames) {
        return ReactTestUtils.findAllInRenderedTree(root, function (inst) {
            if (ReactTestUtils.isDOMComponent(inst)) {
                var className = inst.className;
                if (typeof className !== "string") {
                    // SVG, probably.
                    className = inst.getAttribute("class") || "";
                }
                var classList = className.split(/\s+/);
                if (!Array.isArray(classNames)) {
                    classNames = classNames.split(/\s+/);
                }
                return classNames.every(function (name) {
                    return classList.indexOf(name) !== -1;
                });
            }
            return false;
        });
    },
    /**
     *与scryRenderedDOMComponentsWithClass用法相同，但只返回一个节点，如有零个或多个匹配的节点就报错
     */
    findRenderedDOMComponentWithClass: function (root, className) {
        var all = ReactTestUtils.scryRenderedDOMComponentsWithClass(
            root,
            className
        );
        if (all.length !== 1) {
            throw new Error(
                "Did not find exactly one match (found: " +
                all.length +
                ") " +
                "for class:" +
                className
            );
        }
        return all[0];
    },
    Simulate: {},
    SimulateNative: {}
}
"click,change,keyDown,keyUp,KeyPress,mouseDown,mouseUp,mouseMove,mouseover,mouseout,mouseEnter,mouseLeave,focus".replace(/\w+/g, function (name) {
    ReactTestUtils.Simulate[name] = function (node, opts) {
        if (!node || node.nodeType !== 1) {
            throw "第一个参数必须为元素节点";
        }
        var fakeNativeEvent = opts || {};
        fakeNativeEvent.target = node;
        fakeNativeEvent.simulated = true;
        fakeNativeEvent.type = name.toLowerCase();
        dispatchEvent(fakeNativeEvent, name.toLowerCase());
    };
});
export default ReactTestUtils;