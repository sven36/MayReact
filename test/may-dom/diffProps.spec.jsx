import ReactTestUtils from "../../lib/ReactTestUtils";

import React from '../../src/May';
import { render, unmountComponentAtNode } from '../../src/may-dom/MayDom'
var ReactDOM = {
    render: render,
    unmountComponentAtNode: unmountComponentAtNode
}
React.render = render;

describe('diffProps', function () {
    // this.timeout(200000);
    // before(async() => {
    //     await beforeHook();
    // });
    // after(async() => {
    //     await afterHook(false);
    // })
    var body = document.body, div
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)

    })
    it('使用对象解构', async () => {
        class App extends React.Component {
            constructor(props) {
                super(props)
                this.state = {
                    title: 'xxx',
                    className: 'aaa'
                }
            }
            render() {
                return <div ref='a' {...this.state}>
                    xxx
                </div>
            }
        }

        var s = ReactDOM.render(<App />, div)
        var dom = s.refs.a
        expect(dom.title).toBe('xxx')
        expect(dom.className).toBe('aaa')
        s.setState({ title: '123', id: 'uuuu' })

        expect(dom.title).toBe('123')
        expect(dom.className).toBe('aaa')
        expect(dom.id).toBe('uuuu')

    })

    it('改变属性', async () => {
        var index = 1
        class App extends React.Component {
            constructor(props) {
                super(props)
                this.state = {
                    title: 'xxx',
                    className: 'aaa'
                }
            }
            onClick() {
                index = 0
                this.forceUpdate()
            }
            render() {
                return index
                    ? <div
                        ref='a'
                        title='xxx'
                        className='ddd'
                        id='h33'
                        onClick={this
                            .onClick
                            .bind(this)}
                        dangerouslySetInnerHTML={{
                            __html: '<b>xxx</b>'
                        }}></div>
                    : <div ref='a' title='yyy' id='h44' data-bbb='sss'>
                        xxx{new Date - 0}
                    </div>
            }
        }

        var s = ReactDOM.render(<App />, div)
        var dom = s.refs.a
        expect(dom.title).toBe('xxx')
        expect(dom.className).toBe('ddd')
        expect(dom.id).toBe('h33')
        var events = dom._listener || {}
        var t;
        if (typeof events.onClick === 'function' || typeof events.click === 'function') {
            t = 'function';
        }
        expect(t).toBe('function')
        expect(dom.getElementsByTagName('b').length).toBe(1)
        index = 0

        ReactTestUtils.Simulate.click(document.getElementById('h33'));
        dom = s.refs.a
        expect(dom.title).toBe('yyy')
        expect(dom.className).toBe('')
        expect(dom.id).toBe('h44')
        expect(dom.getAttribute('data-bbb')).toBe('sss')
        var events = dom._listener || {}
        if (typeof events.onClick === 'undefined' && typeof events.click === 'undefined') {
            t = 'undefined';
        }
        expect(t).toBe('undefined')
        expect(dom.getElementsByTagName('b').length).toBe(0)

    })


})