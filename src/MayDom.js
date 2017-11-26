
import { buildComponentFromVNode } from './may-dom/component-recycle';
import {diff} from './may-dom/diff';

export function render(vnode, container, merge) {
    return diff(merge, vnode, {}, false, container, false);
    // return renderByMay(vnode,container,callback);
}

var renderByMay = function (vnode, container, callback) {

}
