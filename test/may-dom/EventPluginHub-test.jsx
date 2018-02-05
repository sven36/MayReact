import ReactTestUtils from "../../lib/ReactTestUtils";
import React from '../../src/May';
import { render, unmountComponentAtNode } from '../../src/may-dom/MayDom'
var ReactDOM = {
    render: render,
    unmountComponentAtNode: unmountComponentAtNode
}
React.render = render;
import {
    dispatchEvent, SyntheticEvent, addEvent
} from '../../src/event';

// import React from "../../dist/ReactANU";
// var ReactDOM = React;
// var ReactTestUtils = { Simulate: {} };
// "click,change,keyDown,keyUp,KeyPress,mouseDown,mouseUp,mouseMove".replace(/\w+/g, function (name) {
//     ReactTestUtils.Simulate[name] = function (node, opts) {
//         if (!node || node.nodeType !== 1) {
//             throw "第一个参数必须为元素节点";
//         }
//         var fakeNativeEvent = opts || {};
//         fakeNativeEvent.target = node;
//         fakeNativeEvent.simulated = true;
//         fakeNativeEvent.type = name.toLowerCase();
//         React.eventSystem.dispatchEvent(fakeNativeEvent, name.toLowerCase());
//     };
// });
// https://github.com/facebook/react/blob/master/src/renderers/__tests__/EventPluginHub-test.js


// 已测试
describe("isEventSupported", function() {
    // this.timeout(200000);


    /*it('should prevent non-function listeners, at dispatch', () => {
      spyOn(console, 'error');
      var node = ReactTestUtils.renderIntoDocument(
        <div onClick="not a function" />,
      );
      expect(function() {
        ReactTestUtils.Simulate.click(node);
      }).toThrowError(
        'Expected `onClick` listener to be a function, instead got a value of `string` type.',
      );
    });

    it('should not prevent null listeners, at dispatch', () => {
    var node = ReactTestUtils.renderIntoDocument(<div onClick={null} />);
    expect(function() {
      ReactTestUtils.Simulate.click(node);
    }).not.toThrow('Expected `onClick` listener to be a function, instead got a value of `null` type.');
  });*/


});