import {
    render
} from '../may-dom/MayDom';

var MayServer = {
    renderToString: renderToString
}
export function renderToString(vnode) {
    var rootDom;
    if (vnode.type && typeof vnode.type === 'string') {
        rootDom = document.createElement(vnode.type);
        render(vnode, rootDom);
    }
    if(rootDom){
        return rootDom.innerHTML;
    }
}
export default MayServer;