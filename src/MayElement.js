/**
 * 
 * @param {*} type dom类型或func
 * @param {*} props dom属性
 * @param {*} children 子节点
 */
export function createElement(type, config, children) {

    var props = {};
    var key = null;
    var ref = null;
    var len =arguments.length-2;
    if (config) {
        key = config.key ? '' + config.key : null;
        ref = config.ref || null;
        for(var i in config){
            if(i!=='key'&&i!='ref'){
                props[i]=config[i];
            }
        }
    }

    if (len > 1) {
        var array = new Array(len);
        for (var i = 0; i < len; i++) {
            array[i] = arguments[i+2];
        }
        props.children = array;
    } else {
        props.children = children;
    }
    return new Vnode(type, key, ref, props);
}

/**
 * 
 * @param {*} type 
 * @param {*} key 
 * @param {*} ref 
 * @param {*} self 
 * @param {*} source 
 * @param {*} owner 
 * @param {*} props 
 */
var Vnode = function (type, key, ref, props) {
    this.type = type;
    this.key = key;
    this.ref = ref;
    this.props = props;
    this.$$typeof=1
}

export function isValaidElement(object){
    return typeof object === 'object'&&object!==null&&object.$$typeof===1;
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