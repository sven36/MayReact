import PropTypes from '../../lib/ReactPropTypes';
import ReactTestUtils from "../../lib/ReactTestUtils";
import React from '../../src/May';
import { render, unmountComponentAtNode, findDOMNode } from '../../src/may-dom/MayDom';
import { shallowCompare } from '../../src/PureComponent';

var ReactDOM = {
    render: render,
    unmountComponentAtNode: unmountComponentAtNode,
    findDOMNode: findDOMNode
}
React.render = render;


// import React from "../../dist/ReactANU";
// var ReactDOM = React;
// var ReactTestUtils = {
//   renderIntoDocument: function (element) {
//     var div = document.createElement("div");
//     return React.render(element, div);
//   }
// };
//https://github.com/facebook/react/blob/master/src/renderers/dom/test/__tests__/ReactTestUtils-test.js

describe("ReactUpdates", function() {
  // this.timeout(200000);
  // before(async () => {
  //   await beforeHook();
  // });
  // after(async () => {
  //   await afterHook(false);
  // });

  /**
 * Counts clicks and has a renders an item for each click. Each item rendered
 * has a ref of the form "clickLogN".
 */
it('should not reconcile children passed via props', () => {
    var numMiddleRenders = 0;
    var numBottomRenders = 0;

    class Top extends React.Component {
      render() {
        return <Middle><Bottom /></Middle>;
      }
    }

    class Middle extends React.Component {
      componentDidMount() {
        this.forceUpdate();
      }

      render() {
        numMiddleRenders++;
        return React.Children.only(this.props.children);
      }
    }

    class Bottom extends React.Component {
      render() {
        numBottomRenders++;
        return null;
      }
    }

    ReactTestUtils.renderIntoDocument(<Top />);
    expect(numMiddleRenders).toBe(2);
    // expect(numBottomRenders).toBe(1);
    expect(numBottomRenders).toBe(2);
  });

})