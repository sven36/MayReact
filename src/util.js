

//文本节点重复利用
export var recyclables={
    '#text':[]
}
export function mergeState(instance) {
    var newState;
    var prevState = instance.state;
    if (instance.mayInst.mergeStateQueue && instance.mayInst.mergeStateQueue.length > 0) {
        var queue = instance.mayInst.mergeStateQueue;
        var newState = extend({}, prevState);
        for (var i = 0; i < queue.length; i++) {
            var s = queue[i];
            if (s && s.call) {
                s = s.call(instance, newState, instance.nextProps || instance.props);
            }
            newState = extend(newState, s);
        }
        instance.mayInst.mergeStateQueue.length = 0;
    } else {
        newState = prevState;
    }
    return newState;
}


// export function eventProxy(e) {
//     return this._listener[e.type](e);
// }
export function extend(target, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            target[key] = src[key];
        }
    }
    return target;
}
/**
 * 寄生组合式继承
 * @param {*} target 
 * @param {*} superClass 
 */
export function inherits(target, superClass) {
    function b() { };
    b.prototype = superClass.prototype;
    var fn = target.prototype = new b();
    fn.constructor = target;
    return fn;
}