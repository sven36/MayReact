// import {
//     createElement
//   } from '../src/May';
//   import {
//     Component
//   } from '../src/Component';
  import { render } from '../src/MayDom';
//   import ReactTestUtils from '../lib/ReactTestUtils';
//   var React = {
//     createElement: createElement
//   }
//   var ReactDOM = {
//     render: render
//   }
  import React from '../dist/React'
var ReactDOM=React;

var ReactTestUtils = {
    renderIntoDocument: function (element) {
        var div = document.createElement("div");
        return ReactDOM.render(element, div);
    },
    isDOMComponent: function(inst) {
        return !!(inst && inst.type==='div');
    },
    findAllInRenderedTree: function(inst, fn) {
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