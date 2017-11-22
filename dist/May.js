'use strict';

/**
 * 
 * @param {*} type dom类型或func
 * @param {*} props dom属性
 * @param {*} children 子节点
 */
function createElement(type, config, children) {

    var props = {};
    var key = null;
    var ref = null;
    if (config) {
        key = config.key ? '' + config.key : null;
        ref = config.ref || null;
        for(var i in config){
            if(i!=='key'&&i!='ref'){
                props[i]=config[i];
            }
        }
    }

    if (arguments.length > 2) {
        var array = new Array(arguments.length - 2);
        for (var i = 0; i < arguments.length; i++) {
            array[i] = arguments[i + 2];
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
    this.$$typeof=1;
};

var May={
    createElement:createElement,
};

module.exports = May;
