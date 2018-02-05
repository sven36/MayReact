import { createElement } from './MayElement';
import { Component } from './Component';
import { PureComponent } from './PureComponent';
import { cloneElement } from './cloneElement';
import { Children } from './Children';
import { PropTypes } from './PropTypes';
import { render, findDOMNode, unmountComponentAtNode } from './may-dom/MayDom';

var May = {
    createElement: createElement,
    Component: Component,
    PureComponent: PureComponent,
    cloneElement: cloneElement,
    Children: Children,
    render: render,
    PropTypes: PropTypes,
    findDOMNode: findDOMNode,
    unmountComponentAtNode: unmountComponentAtNode,
    isValidElement: function (vnode) {
        return vnode && vnode.mtype;
    },
    createFactory: function createFactory(type) {
        console.error("createFactory is deprecated");
        var factory = createElement.bind(null, type);
        factory.type = type;
        return factory;
    }
}
window.React = window.ReactDOM = May;

export default May;