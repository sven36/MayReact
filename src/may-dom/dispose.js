import {
    recyclables
} from '../util';
export function disposeVnode(vnode) {
    if (!vnode) {
        return;
    }
    if (vnode.refType === 1) {
        vnode.ref(null);
        vnode.ref = null;
    }
    if (vnode.mayInfo.instance) {
        disposeComponent(vnode, vnode.mayInfo.instance);
    } else if (vnode.mtype === 1) {
        disposeDomVnode(vnode);
    }
    vnode.mayInfo = null;
}
function disposeDomVnode(vnode) {
    var children = vnode.mayInfo.vChildren;
    if (children) {
        for (var c in children) {
            children[c].forEach(function (child) {
                disposeVnode(child);
            })
        }
        vnode.mayInfo.vChildren = null;
    }
    if (vnode.mayInfo.refOwner) {
        vnode.mayInfo.refOwner = null;
    }
    vnode.mayInfo = null;
}

export function disposeComponent(vnode, instance) {
    if (instance.setState) {
        instance.setState = noop;
        instance.forceUpdate = noop;
    }
    if (instance.componentWillUnmount) {
        instance.componentWillUnmount();
        instance.componentWillUnmount = noop;
    }
    if (instance.refs) {
        instance.refs = null;
    }
    if (instance.mayInst.rendered) {
        // vnode.mayInfo.rendered = null;
        disposeVnode(instance.mayInst.rendered);
    }
    instance.mayInst.forceUpdate = instance.mayInst.dirty = vnode.mayInfo.instance = instance.mayInst = null;
}
var isStandard = 'textContent' in document;
var fragment = document.createDocumentFragment();
export function disposeDom(dom) {
    if (dom._listener) {
        dom._listener = null;
    }
    if (dom.nodeType === 1) {
        if (isStandard) {
            dom.textContent = '';
        } else {
            emptyElement(dom);
        }
    } else if (dom.nodeType === 3) {
        if (recyclables['#text'].length < 100) {
            recyclables['#text'].push(dom);
        }
    }
    fragment.appendChild(dom);
    fragment.removeChild(dom);
}
export function emptyElement(dom) {
    var c;
    while (c = dom.firstChild) {
        emptyElement(c);
        dom.removeChild(c);
    }
}

function noop() { };