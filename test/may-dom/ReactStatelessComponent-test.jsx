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



describe("ReactStatelessComponent", function () {
	// this.timeout(200000);
	// before(async () => {
	//   await beforeHook();
	// });
	// after(async () => {
	//   await afterHook(false);
	// });
	function StatelessComponent(props) {
		return <div>{props.name}</div>;
	}
	it('should render stateless component', () => {
		var el = document.createElement('div');
		ReactDOM.render(<StatelessComponent name="A" />, el);

		expect(el.textContent).toBe('A');
	});

	it('should update stateless component', () => {
		class Parent extends React.Component {
			render() {
				return <StatelessComponent {...this.props} />;
			}
		}

		var el = document.createElement('div');
		ReactDOM.render(<Parent name="A" />, el);
		expect(el.textContent).toBe('A');

		ReactDOM.render(<Parent name="B" />, el);
		expect(el.textContent).toBe('B');
	});

	it('should unmount stateless component', () => {
		var container = document.createElement('div');

		ReactDOM.render(<StatelessComponent name="A" />, container);
		expect(container.textContent).toBe('A');

		ReactDOM.unmountComponentAtNode(container);
		expect(container.textContent).toBe('');
	});

	it('should pass context thru stateless component', () => {
		class Child extends React.Component {
			static contextTypes = {
				test: PropTypes.string,
			};

			render() {
				return <div>{this.context.test}</div>;
			}
		}

		function Parent() {
			return <Child />;
		}

		class GrandParent extends React.Component {
			static childContextTypes = {
				test: PropTypes.string,
			};

			getChildContext() {
				return { test: this.props.test };
			}

			render() {
				return <Parent />;
			}
		}

		var el = document.createElement('div');
		ReactDOM.render(<GrandParent test="test" />, el);

		expect(el.textContent).toBe('test');

		ReactDOM.render(<GrandParent test="mest" />, el);

		expect(el.textContent).toBe('mest');
	});

	it('should use correct name in key warning', () => {
	  function Child() {
		return <div>{[<span>3</span>]}</div>;
	  }
  
  
	  var s = ReactTestUtils.renderIntoDocument(<Child />);
	  expect(s.textContent).toBe("3")
  
	});
	it('should support default props and prop types', () => {
	  function Child(props) {
		return <div>{props.test}</div>;
	  }
	  Child.defaultProps = {test: 2};
	  Child.propTypes = {test: PropTypes.string};
  
	  spyOn(console, 'error');
	  var s = ReactTestUtils.renderIntoDocument(<Child />);
	  expect(s.textContent).toBe("2")
  
	});
	it('should receive context', () => {
	  class Parent extends React.Component {
		static childContextTypes = {
		  lang: PropTypes.string,
		};
  
		getChildContext() {
		  return {lang: 'en'};
		}
  
		render() {
		  return <Child />;
		}
	  }
  
	  function Child(props, context) {
		return <div>{context.lang}</div>;
	  }
	  Child.contextTypes = {lang:PropTypes.string};
  
	  var el = document.createElement('div');
	  ReactDOM.render(<Parent />, el);
	  expect(el.textContent).toBe('en');
	});
	it('should work with arrow functions', () => {
	  var Child = function() {
		return <div />;
	  };
	  // Will create a new bound function without a prototype, much like a native
	  // arrow function.
	  Child = Child.bind(this);
  
	  expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
	});
  
	it('should allow simple functions to return null', () => {
	  var Child = function() {
		return null;
	  };
	  expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
	});
  
	it('should allow simple functions to return false', () => {
	  function Child() {
		return false;
	  }
	  expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
	});

})