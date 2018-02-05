import PropTypes from "../../lib/ReactPropTypes";
import ReactTestUtils from "../../lib/ReactTestUtils";

import React from '../../src/May';
import { render, unmountComponentAtNode } from '../../src/may-dom/MayDom'
var ReactDOM = {
    render: render,
    unmountComponentAtNode: unmountComponentAtNode
}
React.render = render;

// import React from "../../dist/ReactANU";
// var ReactDOM=React;
// var React = require('react');//hyphenate
// var ReactDOM = require('react-dom');


describe('context', function () {
    // this.timeout(200000);

    var body = document.body, div
    beforeEach(function () {
        div = document.createElement('div')
        body.appendChild(div)
    })
    afterEach(function () {
        body.removeChild(div)
    })


    it('getChildContext', async () => {

        var arr = ['111', '222', '333']
        class App extends React.Component {

            getChildContext() {
                return {
                    name: "Jonas",
                    fruit: "Banana"
                };
            }
            handleClick() {
                this.getChildContext = function () {
                    return {
                        name: "Jonas",
                        fruit: arr.shift()
                    };
                }
                this.forceUpdate()

            }
            render() {
                return <div ref='a' onClick={this.handleClick.bind(this)}><h4>{new Date - 0}</h4><B /></div>;
            }
        }
        App.childContextTypes = {
            name: PropTypes.string,
            fruit: PropTypes.string
        }

        class B extends React.Component {

            render() {
                return <div><C /><strong>{this.context.fruit}</strong></div>;
            }
        }
        B.contextTypes = {
            fruit: PropTypes.string
        }
        class C extends React.Component {
            render() {
                return <strong>{this.context.fruit}</strong>;
            }
        }

        var s = ReactDOM.render(<App />, div)

        var strongs = div.getElementsByTagName('strong')
        expect(strongs[0].innerHTML).toBe('')
        expect(strongs[1].innerHTML).toBe('Banana')
        ReactTestUtils.Simulate.click(s.refs.a)

        strongs = div.getElementsByTagName('strong')
        expect(strongs[0].innerHTML).toBe('')
        expect(strongs[1].innerHTML).toBe('111')
        ReactTestUtils.Simulate.click(s.refs.a)
        strongs = div.getElementsByTagName('strong')
        expect(strongs[0].innerHTML).toBe('')
        expect(strongs[1].innerHTML).toBe('222')
    })



})