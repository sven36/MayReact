// import {
//     createElement
//   } from '../src/May';
//   import {
//     Component
//   } from '../src/Component';
//   import { render } from '../src/MayDom';
// import ReactTestUtils from '../lib/ReactTestUtils';
//   var React = {
//     createElement: createElement
//   }

import React from "../dist/ReactANU";


// import React from "../dist/react";
// import ReactDOM from "../dist/react-dom";

//   import {Component} from "../dist/preact";
//   import React from "../dist/preact";


//   var ReactDOM = {
//     render: render
//   }
//https://github.com/facebook/react/blob/master/src/isomorphic/children/__tests__/ReactChildren-test.js
describe("ReactComponent", function () {
    // this.timeout(200000);

    // it("should throw on invalid render targets", () => {
    //     var container = document.createElement("div");
    //     // jQuery objects are basically arrays; people often pass them in by mistake
    //     expect(function() {
    //         ReactDOM.render(<div />, [container]);
    //     }).toThrowError(/container参数错误/);

    //     expect(function() {
    //         ReactDOM.render(<div />, null);
    //     }).toThrowError(/container参数错误/);
    // });

    it("should throw when supplying a ref outside of render method", () => {
        var instance = <div ref="badDiv" />;
        // expect(function() {
        //     instance = ReactTestUtils.renderIntoDocument(instance);
        // }).toThrow();
    });
    it('mayRender', () => {
        spyOn(console, 'error');
        var container = document.createElement('div');
        class Child extends React.Component {
            //   constructor(props){
            // 	  super(props);
            // 	  this.state={val2:'I wonder'};
            //   }

            render() {
                return (
                    <div>
                        {/* {this.state.val2} */}
                        {this.props.key}
                        {this.props.val}
                    </div>);
            }
        }
        class Parent extends React.Component {
            constructor() {
                super();
                this.state = { val: 'I wonder' };
                this.Change = this.Change.bind(this);
            }
            Change() {
                this.setState({ val: 'I see' });
            }
            onFocus() {
                this.refs.inputRef.focus()
            }
            render() {
                var item = [];
                if (this.state.val === 'I wonder') {
                return (
                    <div className="mystyle" style={{ width: '40%', marginLeft: '30px' }}>
                        <Child key="Childt" val="4" />
                        <input onChange={this.Change} type="text" value={this.state.val} />
                        666&nbsp; {this.state.val}
                        {this.state.val === 'I wonder' ? <Child key="1" val="2" /> : <Child key="Childt" val="4" />}
                        <Child key="0" val={this.state.val} />
                        <Child key="0" val={this.state.val} />
                        <input  type="radio" value={this.state.val} />
                        666&nbsp; {this.state.val}
                    </div>
            );
        }else{
            return(
                <div className="mystyle" style={{ width: '40%', marginLeft: '30px' }}>
                        <input  type="radio" value={this.state.val} />
                <input onChange={this.Change} type="text" value={this.state.val} />
                666&nbsp; {this.state.val}
                {this.state.val === 'I wonder' ? <Child key="1" val="2" /> : <Child key="Childt" val="4" />}
                <Child key="0" val={this.state.val} />
            </div>
            )
        }
    }
        }
        //this._updateDOMChildren

        // React.render(<Parent />, container);
        // window.ReactDOM.render(<Parent />, container);
        document.body.appendChild(container);
        // expect(console.error.calls.count()).toBe(0);
    });
    //  it("should warn when children are mutated during render", () => {
    //     function Wrapper(props) {
    //         props.children[1] = <p key={1} />; // Mutation is illegal
    //         return <div>{props.children}</div>;
    //     }

    //     var instance = ReactTestUtils.renderIntoDocument(
    //         <Wrapper>
    //             <span key={0} />
    //             <span key={1} />
    //             <span key={2} />
    //         </Wrapper>
    //     );
    //     expect(ReactTestUtils.scryRenderedDOMComponentsWithTag(instance, "p").length).toBe(1);
    // });

    /* it("should warn when children are mutated during update", () => {
         class Wrapper extends React.Component {
             componentDidMount() {
                 this.props.children[1] = <p key={1} />; // Mutation is illegal
                 this.forceUpdate();
             }
 
             render() {
                 return <div>{this.props.children}</div>;
             }
         }
 
         var instance = ReactTestUtils.renderIntoDocument(
             <Wrapper>
                 <span key={0} />
                 <span key={1} />
                 <span key={2} />
             </Wrapper>
         );
         expect(ReactTestUtils.scryRenderedDOMComponentsWithTag(instance, "p").length).toBe(1);
     });
 
     it("should support refs on owned components", () => {
         var innerObj = {};
         var outerObj = {};
 
         class Wrapper extends React.Component {
             getObject = () => {
                 return this.props.object;
             };
 
             render() {
                 return <div>{this.props.children}</div>;
             }
         }
 
         class Component extends React.Component {
             render() {
                 var inner = <Wrapper object={innerObj} ref="inner" />;
                 var outer = (
                     <Wrapper object={outerObj} ref="outer">
                         {inner}
                     </Wrapper>
                 );
                 return outer;
             }
 
             componentDidMount() {
                 expect(this.refs.inner.getObject()).toEqual(innerObj);
                 expect(this.refs.outer.getObject()).toEqual(outerObj);
             }
         }
 
         ReactTestUtils.renderIntoDocument(<Component />);
     });
 
     it("should not have refs on unmounted components", () => {
         class Parent extends React.Component {
             render() {
                 return (
                     <Child>
                         <div ref="test" />
                     </Child>
                 );
             }
 
             componentDidMount() {
                 expect(this.refs && this.refs.test).toEqual(undefined);
             }
         }
 
         class Child extends React.Component {
             render() {
                 return <div />;
             }
         }
 
         ReactTestUtils.renderIntoDocument(<Parent child={<span />} />);
     });
 
     it("should support new-style refs", () => {
         var innerObj = {};
         var outerObj = {};
 
         class Wrapper extends React.Component {
             getObject = () => {
                 return this.props.object;
             };
 
             render() {
                 return <div>{this.props.children}</div>;
             }
         }
 
         var mounted = false;
 
         class Component extends React.Component {
             render() {
                 var inner = <Wrapper object={innerObj} ref={c => (this.innerRef = c)} />;
                 var outer = (
                     <Wrapper object={outerObj} ref={c => (this.outerRef = c)}>
                         {inner}
                     </Wrapper>
                 );
                 return outer;
             }
 
             componentDidMount() {
                 expect(this.innerRef.getObject()).toEqual(innerObj);
                 expect(this.outerRef.getObject()).toEqual(outerObj);
                 mounted = true;
             }
         }
 
         ReactTestUtils.renderIntoDocument(<Component />);
         expect(mounted).toBe(true);
     });
 
     it("should support new-style refs with mixed-up owners", () => {
         class Wrapper extends React.Component {
             getTitle = () => {
                 return this.props.title;
             };
 
             render() {
                 return this.props.getContent();
             }
         }
 
         var mounted = false;
 
         class Component extends React.Component {
             getInner = () => {
                 // (With old-style refs, it's impossible to get a ref to this div
                 // because Wrapper is the current owner when this function is called.)
                 return <div className="inner" ref={c => (this.innerRef = c)} />;
             };
 
             render() {
                 return <Wrapper title="wrapper" ref={c => (this.wrapperRef = c)} getContent={this.getInner} />;
             }
 
             componentDidMount() {
                 // Check .props.title to make sure we got the right elements back
                 expect(this.wrapperRef.getTitle()).toBe("wrapper");
                 expect(ReactDOM.findDOMNode(this.innerRef).className).toBe("inner");
                 mounted = true;
             }
         }
 
         ReactTestUtils.renderIntoDocument(<Component />);
         expect(mounted).toBe(true);
     });
 
     it("should call refs at the correct time", () => {
         var log = [];
 
         class Inner extends React.Component {
             render() {
                 log.push(`inner ${this.props.id} render`);
                 return <div />;
             }
 
             componentDidMount() {
                 log.push(`inner ${this.props.id} componentDidMount`);
             }
 
             componentDidUpdate() {
                 log.push(`inner ${this.props.id} componentDidUpdate`);
             }
 
             componentWillUnmount() {
                 log.push(`inner ${this.props.id} componentWillUnmount`);
             }
         }
 
         class Outer extends React.Component {
             render() {
                 return (
                     <div>
                         <Inner
                             id={1}
                             ref={c => {
                                 log.push(`ref 1 got ${c ? `instance ${c.props.id}` : "null"}`);
                             }}
                         />
                         <Inner
                             id={2}
                             ref={c => {
                                 log.push(`ref 2 got ${c ? `instance ${c.props.id}` : "null"}`);
                             }}
                         />
                     </div>
                 );
             }
 
             componentDidMount() {
                 log.push("outer componentDidMount");
             }
 
             componentDidUpdate() {
                 log.push("outer componentDidUpdate");
             }
 
             componentWillUnmount() {
                 log.push("outer componentWillUnmount");
             }
         }
 
         // mount, update, unmount
         var container = document.createElement("div");
         log.push("start mount");
         ReactDOM.render(<Outer />, container);
         log.push("start update");
         ReactDOM.render(<Outer />, container);
         log.push("start unmount");
         ReactDOM.unmountComponentAtNode(container);
 
          //eslint-disable indent 
         expect(log).toEqual([
             "start mount",
             "inner 1 render",
             "inner 2 render",
             "inner 1 componentDidMount",
             "ref 1 got instance 1",
             "inner 2 componentDidMount",
             "ref 2 got instance 2",
             "outer componentDidMount",
             "start update",
 
             // Stack resets refs before rendering
             "ref 1 got null",
             "inner 1 render",
             "ref 2 got null",
             "inner 2 render",
 
             "inner 1 componentDidUpdate",
             "ref 1 got instance 1",
             "inner 2 componentDidUpdate",
             "ref 2 got instance 2",
             "outer componentDidUpdate",
             "start unmount",
             "outer componentWillUnmount",
             "ref 1 got null",
             "inner 1 componentWillUnmount",
             "ref 2 got null",
             "inner 2 componentWillUnmount"
         ]);
     });
 
     it("throws usefully when rendering badly-typed elements", () => {
         spyOn(console, "error");
 
         var X = undefined;
         expect(() => ReactTestUtils.renderIntoDocument(<X />)).toThrowError(
             "Element type is invalid: expected a string (for built-in components) " +
                 "or a class/function (for composite components) but got: undefined. " +
                 "You likely forgot to export your component from the file it's " +
                 "defined in."
         );
 
         var Y = null;
         expect(() => ReactTestUtils.renderIntoDocument(<Y />)).toThrowError(
             "Element type is invalid: expected a string (for built-in components) " + "or a class/function (for composite components) but got: null."
         );
 
         // One warning for each element creation
         expect(console.error.calls.count()).toBe(2);
     });
 
     it("includes owner name in the error about badly-typed elements", () => {
         spyOn(console, "error");
 
         var X = undefined;
 
         function Indirection(props) {
             return <div>{props.children}</div>;
         }
 
         function Bar() {
             return (
                 <Indirection>
                     <X />
                 </Indirection>
             );
         }
 
         function Foo() {
             return <Bar />;
         }
 
         expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toThrowError(
             "Element type is invalid: expected a string (for built-in components) " +
                 "or a class/function (for composite components) but got: undefined. " +
                 "You likely forgot to export your component from the file it's " +
                 "defined in.\n\nCheck the render method of `Bar`."
         );
 
         // One warning for each element creation
         expect(console.error.calls.count()).toBe(1);
     });
 
     it("throws if a plain object is used as a child", () => {
         var children = {
             x: <span />,
             y: <span />,
             z: <span />
         };
         var element = <div>{[children]}</div>;
         var container = document.createElement("div");
         var ex;
         try {
             ReactDOM.render(element, container);
         } catch (e) {
             ex = e;
         }
         expect(ex).toBeDefined();
     });
     it("throws if a plain object even if it is in an owner", () => {
         class Foo extends React.Component {
             render() {
                 var children = {
                     a: <span />,
                     b: <span />,
                     c: <span />
                 };
                 return <div>{[children]}</div>;
             }
         }
         var container = document.createElement("div");
         var ex;
         try {
             ReactDOM.render(<Foo />, container);
         } catch (e) {
             ex = e;
         }
         expect(ex).toBeDefined();
     });
 
     it("throws if a plain object is used as a child when using SSR", async () => {
         var children = {
             x: <span />,
             y: <span />,
             z: <span />
         };
         var element = <div>{[children]}</div>;
         var ex;
         try {
             ReactDOMServer.renderToString(element);
         } catch (e) {
             ex = e;
             console.warn(e);
         }
         expect(ex).toBeDefined();
     });
 
     it("throws if a plain object even if it is in an owner when using SSR", async () => {
         class Foo extends React.Component {
             render() {
                 var children = {
                     a: <span />,
                     b: <span />,
                     c: <span />
                 };
                 return <div>{[children]}</div>;
             }
         }
         var container = document.createElement("div");
         var ex;
         try {
             ReactDOMServer.renderToString(<Foo />, container);
         } catch (e) {
             ex = e;
             console.warn(e);
         }
         expect(ex).toBeDefined();
     });*/
});
