export function disposeVnode(vnode) {
    if (!vnode) {
        return;
    }
    var children = vnode.props && vnode.props.children;
    if (vnode.ref && typeof vnode.ref === 'function') {
        vnode.ref(null);
        vnode.ref = null;
    }

    if (vnode.mayInfo.instance) {
        if (vnode.mayInfo.instance.setState) {
            vnode.mayInfo.instance.setState = noop;
        }
        if (vnode.mayInfo.instance.componentWillUnmount) {
            vnode.mayInfo.instance.componentWillUnmount();
        }
        vnode.mayInfo.instance.refs = null;
        vnode.mayInfo.instance = null;
    }
    if (vnode.mayInfo.rendered) {
        disposeVnode(vnode.mayInfo.rendered);
        vnode.mayInfo.rendered = null;
    }
    if (children && children.length > 0) {
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var type = typeof c;
            if (c && type === 'object') {
                disposeVnode(c);
            }
        }
    } else if (children && typeof children === 'object') {
        disposeVnode(children);
    }
    if (vnode.mayInfo.prevVnode) {
        vnode.mayInfo.prevVnode = null;
    }
    if (vnode.mayInfo.hostNode) {
        disposeDom(vnode.mayInfo.hostNode);
        vnode.mayInfo.hostNode = null;
    }
    vnode.mayInfo = {};
    vnode = null;
}

export function disposeDom(dom) {
    if (dom._listener) {
        dom._listener = null;
    }
    if (dom.parentNode) {
        dom.parentNode.removeChild(dom);
        dom = null;
    }
}
export function emptyElement(dom) {
    var c;
    while (c = dom.firstChild) {
        emptyElement(c);
        dom.removeChild(c);
    }
}
function noop() { };