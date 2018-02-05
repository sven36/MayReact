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

describe("事件系统模块", function () {
    // this.timeout(200000);
    // before(async () => {
    //     await beforeHook();
    // });
    // after(async () => {
    //     await afterHook(false);
    // });
    var body = document.body,
        div;
    beforeEach(function () {
        div = document.createElement("div");
        body.appendChild(div);
    });
    afterEach(function () {
        body.removeChild(div);
    });
    it("事件与样式", async () => {
        class App extends React.Component {
            constructor() {
                super();
                this.state = {
                    aaa: 111
                };
                this.click = this.click.bind(this)
            }
            click(e) {
                e.preventDefault();
                console.log('clicked' + this.state.aaa);
                // expect(e.currentTarget.nodeType).toBe(1);
                this.setState({
                    aaa: this.state.aaa + 1
                });
            }

            render() {
                return (
                    <div
                        id="aaa3"
                        style={{
                            height: this.state.aaa,
                            color: 'blue'
                        }}
                        onClick={this.click}
                    >
                        {this.state.aaa}
                    </div>
                );
            }
        }
        var s = ReactDOM.render(<App />, div);
        //记一个坑 如果是在页面上点击该dom this.state.aaa会增加多次，那是因为
        //karma在跑完当前test之后 还会接着跑 ref.spec.jsx的test 跑ref-test的test等
        //故而会多次触发点击; 故测试用代码触发即可;ReactTestUtils.Simulate.click
        expect(s.state.aaa).toBe(111);
        ReactTestUtils.Simulate.click(s.mayInst.hostNode);
        expect(s.state.aaa).toBe(112);
        ReactTestUtils.Simulate.click(s.mayInst.hostNode);
        expect(s.state.aaa).toBe(113);
        //确保存在eventSystem对象
        // expect(React.eventSystem).toA("object");
    });

    it("冒泡", async () => {
        var aaa = "";
        class App extends React.PureComponent {
            constructor(props) {
                super(props);
                this.state = {
                    aaa: {
                        a: 7
                    }
                };
            }

            click() {
                aaa += "aaa ";
            }
            click2(e) {
                aaa += "bbb ";
                e.stopPropagation();
            }
            click3(e) {
                aaa += "ccc ";
            }
            render() {
                return (
                    <div onClick={this.click}>
                        <p>=========</p>
                        <div onClick={this.click2}>
                            <p>=====</p>
                            <div id="bubble" onClick={this.click3}>
                                {this.state.aaa.a}
                            </div>
                        </div>
                    </div>
                );
            }
        }

        var s = ReactDOM.render(<App />, div);
        ReactTestUtils.Simulate.click(document.getElementById("bubble"));
        expect(aaa.trim()).toBe("ccc bbb");
    });

    it("模拟mouseover,mouseout", async () => {
        var aaa = "";
        class App extends React.Component {
            constructor(props) {
                super(props);
                this.state = {
                    aaa: {
                        a: 7
                    }
                };
            }

            mouseover() {
                aaa += "aaa ";
            }
            mouseout(e) {
                console.log(aaa);
                aaa += "bbb ";
            }

            render() {
                return (
                    <div>
                        <div
                            id="mouse1"
                            onMouseOver={this.mouseover}
                            onMouseOut={this.mouseout}
                            style={{
                                width: 200,
                                height: 200
                            }}
                        >67</div>
                        <div id="mouse2" />
                    </div>
                );
            }
        }

        var s = ReactDOM.render(<App />, div);
        ReactTestUtils.Simulate.mouseover(document.getElementById('mouse1'));
        ReactTestUtils.Simulate.mouseout(document.getElementById('mouse1'));
        expect(aaa.trim()).toBe("aaa bbb");
    });
    it("1.1.2checkbox绑定onChange事件会触发两次", async () => {
        var logIndex = 0;
        function refFn(e) {
            logIndex++;
        }

        var el = ReactDOM.render(<input id="ci" type="checkbox" onChange={refFn} />, div);
        ReactTestUtils.Simulate.change(document.getElementById('ci'));
        expect(logIndex).toBe(1);
    });
    it("模拟mouseenter,mouseleave", async () => {
        var aaa = "";
        class App extends React.Component {
            constructor(props) {
                super(props);
                this.state = {
                    aaa: {
                        a: 7
                    }
                };
            }

            mouseover() {
                aaa += "aaa ";
            }
            mouseout(e) {
                aaa += "bbb ";
            }

            render() {
                return (
                    <div>
                        <div
                            id="mouse3"
                            onMouseEnter={this.mouseover}
                            onMouseLeave={this.mouseout}
                            style={{
                                width: 200,
                                height: 200
                            }}
                        />
                        <div id="mouse4" />
                    </div>
                );
            }
        }

        var s = ReactDOM.render(<App />, div);
        ReactTestUtils.Simulate.mouseEnter(document.getElementById('mouse3'));
        ReactTestUtils.Simulate.mouseLeave(document.getElementById('mouse3'));
        expect(aaa.trim()).toBe("aaa bbb");
    });
    it("捕获", async () => {
        var aaa = "";
        class App extends React.PureComponent {
            constructor(props) {
                super(props);
                this.state = {
                    aaa: {
                        a: 7
                    }
                };
            }

            click() {
                aaa += "aaa ";
            }
            click2(e) {
                aaa += "bbb ";
                e.preventDefault();
                e.stopPropagation();
            }
            click3(e) {
                aaa += "ccc ";
            }
            render() {
                return (
                    <div onClickCapture={this.click}>
                        <p>=========</p>
                        <div onClickCapture={this.click2}>
                            <p>=====</p>
                            <div id="capture" onClickCapture={this.click3}>
                                {this.state.aaa.a}
                            </div>
                        </div>
                    </div>
                );
            }
        }

        var s = ReactDOM.render(<App />, div);
        ReactTestUtils.Simulate.click(document.getElementById("capture"));

        expect(aaa.trim()).toBe("aaa bbb");
    });
    it("让focus能冒泡", async () => {
        var aaa = "";
        class App extends React.Component {
            constructor(props) {
                super(props);
                this.state = {
                    aaa: {
                        a: 7
                    }
                };
            }

            onFocus1() {
                aaa += "aaa ";
            }
            onFocus2(e) {
                aaa += "bbb ";
                console.log('fff ' + aaa);
            }

            render() {
                return (
                    <div
                        onFocus={this.onFocus2}
                        style={{
                            width: 200,
                            height: 200
                        }}
                    >
                        <div
                            id="focus2"
                            tabIndex={-1}
                            onFocus={this.onFocus1}
                            style={{
                                width: 100,
                                height: 100
                            }}
                        >
                            focus2
                        </div>
                    </div>
                );
            }
        }

        var s = ReactDOM.render(<App />, div);
        ReactTestUtils.Simulate.focus(document.getElementById("focus2"));

        expect(aaa.trim()).toBe("aaa bbb");
    });
    it("测试事件对象的属性", function () {
        var obj = {
            type: "change",
            srcElement: 1
        };
        var e = new SyntheticEvent(obj);
        expect(e.type).toBe("change");
        expect(typeof e.timeStamp).toBe("number");
        expect(e.target).toBe(1);
        expect(e.nativeEvent).toBe(obj);
        e.stopImmediatePropagation();
        expect(e._stopPropagation).toBe(true);
        expect(e.toString()).toBe("[object Event]");
        var e2 = new SyntheticEvent(e);
        expect(e2).toBe(e);

        // var p = new DOMElement();
        // p.addEventListener = false;
        // addEvent(p, "type", "xxx");
    });

    it("合并点击事件中的setState", async () => {
        var list = [];
        class App extends React.Component {
            constructor(props) {
                super(props);
                this.state = {
                    path: "111"
                };
            }

            render() {
                list.push("render " + this.state.path);
                return (
                    <div>
                        <span id="click2time" onClick={this.onClick.bind(this)}>
                            {this.state.path}
                        </span>
                    </div>
                );
            }

            onClick() {
                this.setState(
                    {
                        path: "click"
                    },
                    function () {
                        list.push("click....");
                    }
                );
                this.setState(
                    {
                        path: "click2"
                    },
                    function () {
                        list.push("click2....");
                    }
                );
            }
            componentWillUpdate() {
                list.push("will update");
            }
            componentDidUpdate() {
                list.push("did update");
            }
        }

        ReactDOM.render(<App />, div, function () {
            list.push("ReactDOM cb");
        });
        ReactTestUtils.Simulate.click(document.getElementById("click2time"));

        expect(list).toEqual(["render 111", "ReactDOM cb", "will update", "render click2", "did update", "click....", "click2...."]);
    });
});
