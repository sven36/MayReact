import {
    createElement
} from '../src/May';
import {
    Component
} from '../src/Component';
import {
    render
} from '../src/MayDom';

var ReactDOM = {
    render: render
}

// var React = require('react');//hyphenate
// var ReactDOM = require('react-dom');


//   import ReactTestUtils from '../lib/ReactTestUtils';
//   var React = {
//     createElement: createElement
//   }

//   import React from '../dist/React'

function findAllInRenderedTree(inst, test) {
    var ret = [];
    if (!inst) {
        return ret;
    }
    if (!inst.vtype) {
        if (inst.nodeType === 1 && test(inst)) {
            ret.push(inst);
        }
        var children = [].slice.call(inst.childNodes);
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            ret = ret.concat(findAllInRenderedTree(el, test));
        }
    }
    /*if(inst.vtype === 0){//如果是文本，注释
        return ret;
    }else if(inst.vtype === 1){//如果是元素虚拟DOM
        var dom = inst._hostNode;
        if( dom && dom.nodeType === 1 && test(dom)){
            ret.push(dom);
        }
        var children = inst.vchildren;
        for (var i = 0, n = children.length; i < n; i++) {
            var el = children[i];
            ret = ret.concat(findAllInRenderedTree(el, test));
        }
    } else if (inst.vtype > 1) {//如果是组件虚拟DOM
        var componentInstance = inst._instance;
        var rendered = getRendered(componentInstance);
        //  var rendered = inst._instance ? inst._instance.__rendered || inst._instance.updater.rendered : inst.__rendered;
        if (rendered) {
            //如果是实例
            ret = ret.concat(findAllInRenderedTree(rendered, test));
        }
    }else if(inst.refs){//组件实例都带有refs对象
        rendered = getRendered(inst);
        if (rendered) {
            //如果是实例
            ret = ret.concat(findAllInRenderedTree(rendered, test));
        }
    }*/

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
}
export default ReactTestUtils;