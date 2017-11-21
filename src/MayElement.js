
export function createElement(type,props,children) {
    if (arguments.length > 2) {
        var array=new Array(arguments.length-2);
        for(var i=0;i<arguments.length;i++){
            array[i]=arguments[i+2]
        }
        props.children=array;
    }else{
        props.children=children;
    }
}




/*
function h(nodeName, attributes, ...args) {  
      let children = args.length ? [].concat(...args) : null;
      return { nodeName, attributes, children };
}
function render(vnode) {  
    // Strings just convert to #text Nodes:
    if (vnode.split) return document.createTextNode(vnode);

    // create a DOM element with the nodeName of our VDOM element:
    let n = document.createElement(vnode.nodeName);

    // copy attributes onto the new node:
    let a = vnode.attributes || {};
    Object.keys(a).forEach( k => n.setAttribute(k, a[k]) );

    // render (build) and then append child nodes:
    (vnode.children || []).forEach( c => n.appendChild(render(c)) );

    return n;
}*/

function extend(target, src) {
    for (var key in src) {
        target[key] = src[key];
    }

}