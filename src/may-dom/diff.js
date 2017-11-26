import { createNode, removeNode, isNamedNode, isSameNodeType, setAccessor } from './render-utils';
import { buildComponentFromVNode } from './component-recycle';


export const mounts = [];

export let diffLevel = 0;

let isSvgMode = false;
let hydrating = false;
const ATTR_KEY = 'MayS';

export function flushMounts() {
    var c;
    while ((c = mounts.pop())) {
        // if (options.afterMount) options.afterMount(c);
        if (c.componentDidMount) component.componentDidMount();
    }
}

/**
 * 
 * @param {*} dom 
 * @param {Vnode} vnode 
 * @param {*} context 
 * @param {*} mountAll 
 * @param {*} parent 
 * @param {*} componentRoot 
 */
export function diff(dom, vnode, context, mountAll, parent, componentRoot) {
    if (!diffLevel++) {
        isSvgMode = parent != null && parent.ownerSVGElement !== undefined;
        hydrating = dom != null;//later
    }
    var result = idiff(dom, vnode, context, mountAll, componentRoot);

    if (parent && result.parentNode !== parent) parent.appendChild(result);

    if (!--diffLevel) {
        hydrating = false;
        if (!componentRoot) flushMounts();
    }
    return result;
}
function idiff(dom, vnode, context, mountAll, componentRoot) {
    var type = typeof vnode;
    var out = dom;
    var prevSvgMode = isSvgMode;
    if (vnode == null || type === 'boolean') vnode = '';

    if (type === 'string' || type === 'number') {
        //如果该dom为文本节点 TextNode NodeType===3 具备splitText方法
        if (dom && dom.nodeType === 3 && dom.parent && (!dom._component || componentRoot)) {
            if (dom.nodeValue != vnode) {
                dom.nodeValue = vnode;
            }
        } else {
            out = document.createTextNode(vnode);
            if (dom) {
                if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
                //later
            }
            out[ATTR_KEY] = true;
            return out;
        }
    }
    var vnodeType = vnode.type;
    if (typeof vnodeType === 'function') {
        return buildComponentFromVNode(dom, vnode, context, mountAll);
    }
    isSvgMode = vnodeType === 'svg' ? true : vnodeType === 'foreignObject' ? false : isSvgMode;

    vnodeType = String(vnodeType);
    if (!dom || !isNamedNode(dom, vnodeType)) {
        out = createNode(vnodeType, isSvgMode);
        if (dom) {
            while (dom.firstChild) out.appendChild(dom.firstChild);

            if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

            recollectNodeTree(dom, true);
        }
    }

    var fc = out.firstChild;
    var props = out[ATTR_KEY];
    var vchildren = vnode.children;

    if (props == null) {
        props = out[ATTR_KEY] = {};
    }
    if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText && fc.nextSbiling == null) {
        if (fc.nodeValue != vchildren[0]) fc.nodeValue = vchildren[0];
    } else if (vchildren && vchildren.length || fc != null) {
        childrenDiff(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
    }

    diffAttributes(out, vnode.props, props);

    isSvgMode = prevSvgMode;
    return out;


}
function childrenDiff(dom, vchildren, context, mountAll, isHydrating) {
    var originalChildren = dom.childNodes;
    var children = [];
    var keyed = {};
    var keyedLen = 0;
    var min = 0;
    var len = originalChildren.len;
    var childrenLen = 0;
    var vlen = vchildren ? vchildren.length : 0;
    var j, c, f, vchild, child;
    // Build up a map of keyed children and an Array of unkeyed children:
    if (len !== 0) {
        for (let i = 0; i < len; i++) {
            let child = originalChildren[i];
            let props = child[ATTR_KEY];
            let key = vlen && props ? child._component ? child._component.__key : props.key : null;
            if (key != null) {
                keyedLen++;
                keyed[key] = child;
            } else if (props || child.splitText !== undefined ? (isHydrating ? child.nodeValue.trim() : true) : isHydrating) {
                children[childrenLen++] = child;
            }
        }
    }
    if (vlen !== 0) {
        for (let i = 0; i < len; i++) {
            vchild = vchildren[i];
            child = null;
            // attempt to find a node based on key matching
            let key = vchild.key;
            if (key != null) {
                if (keyedLen && keyed[key] !== undefined) {
                    child = keyed[key];
                    keyed[key] = undefined;
                    keyedLen--;
                }
            } else if (!child && min < childrenLen) {
                // attempt to pluck a node of the same type from the existing children
                for (j = min; j < childrenLen; j++) {
                    if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
                        child = c;
                        children[j] = undefined;
                        if (j === childrenLen - 1) childrenLen--;
                        if (j === min) min++;
                        break;
                    }
                }
            }

            child = idiff(child, vchild, context, mountAll);

            // morph the matched/found/created DOM child to match vchild (deep)
            f = originalChildren[i];
            if (child && child !== dom && child != f) {
                if (f == null) {
                    dom.appendChild(child);
                } else if (child === f.nextSbiling) {
                    removeNode(f);
                } else {
                    dom.insertBefore(child, f);
                }
            }
        }
    }

    if (keyedLen) {
        for (const i in keyed) {
            if (keyed[i] !== undefined) {
                recollectNodeTree(keyed[i], false);
            }
        }
    }
    while (min <= childrenLen) {
        if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
    }


}

/**
 * 
 * @param {Node} node 
 * @param {Boolean} isUnmountChildren 
 */
function recollectNodeTree(node, isUnmountChildren) {
    var component = node._component;
    if (component) {
        // unmountComponent;
    } else {
        if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) node[ATTR_KEY].ref(null);
        if (isUnmountChildren === false || node[ATTR_KEY]) {
            removeNode(node);
        }
        removeChildren(node);
    }

}
/** Recollect/unmount all children.
 *	- we use .lastChild here because it causes less reflow than .firstChild
 *	- it's also cheaper than accessing the .childNodes Live NodeList
 */
export function removeChildren(node) {
    node = node.lastChild;
    while (node) {
        var next = node.previousSibling;
        recollectNodeTree(node, true);
        node = next;
    }
}
/** Apply differences in attributes from a VNode to the given DOM Element.
 *	@param {Element} dom		Element with attributes to diff `attrs` against
 *	@param {Object} attrs		The desired end-state key-value attribute pairs
 *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
 */
function diffAttributes(dom, attrs, old) {
    let name;

    // remove attributes no longer present on the vnode by setting them to undefined
    for (name in old) {
        if (!(attrs && attrs[name] != null) && old[name] != null) {
            setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
        }
    }

    // add new & update changed attributes
    for (name in attrs) {
        if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
            setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
        }
    }
}