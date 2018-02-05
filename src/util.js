import {
    reRender
} from './may-dom/MayDom'

//mayQueue 保存render过程中的各种事件队列 
export var mayQueue = {
    dirtyComponentsQueue: [], //setState 需要diff的component队列
    callbackQueue: [], //回调队列 setState 中的事件回调
    lifeCycleQueue: [], //生命周期过程中的回调队列 DidUpdate DidMount ref回调
    isInEvent: false, //是否在触发事件 回调事件中的setstate合并触发
    clearQueue: clearQueue,
    flushUpdates: flushUpdates,
}
//存放生命周期中的 DidMount DidUpdate以及ref回调
export var lifeCycleQueue = mayQueue.lifeCycleQueue;
/**
 * 清空回调队列
 * @param {*} mayQueue 
 */
function clearQueue() {
    //ComponentDidMount
    clearLifeCycleQueue();
    //如有有dirty Component diff
    flushUpdates();
    //setState传入的回调函数
    clearCallbackQueue();
}

function flushUpdates() {
    var c;
    //如果在当前生命周期的DidMount调用setState 放到下一生命周期处理
    mayQueue.dirtyComponentsQueue = mayQueue.dirtyComponentsQueue.sort(sortComponent);
    while (c = mayQueue.dirtyComponentsQueue.shift()) {
        if (c.mayInst.dirty) {
            //如果C是脏组件diff 如果其在diff过程中子组件也需要diff diff之后
            //子组件_dirty会为false 没必要再diff一次；
            reRender(c);


        }
        if (c) {
            //diff之后组件的状态返回0
            c.mayInst.lifeState = 0;
        }
    }
    //ComponentDidUpdate
    clearLifeCycleQueue();
}

function clearLifeCycleQueue() {
    //先清空 生命周期 ref 的回调函数
    if (mayQueue.lifeCycleQueue && mayQueue.lifeCycleQueue.length > 0) {
        var lifeCallback;
        // mayQueue.lifeCycleQueue = mayQueue.lifeCycleQueue.sort(sortComponent);
        while (lifeCallback = mayQueue.lifeCycleQueue.shift()) {
            lifeCallback();
            //componentDidMount 之后其lifeState为0
            lifeCallback.instance && (lifeCallback.instance.mayInst.lifeState = 0);
        }
    }
}

function clearCallbackQueue() {
    //再清空 setState传入的回调函数
    if (mayQueue.callbackQueue && mayQueue.callbackQueue.length > 0) {
        var callback;
        mayQueue.callbackQueue = mayQueue.callbackQueue.sort(sortCallback);
        while (callback = mayQueue.callbackQueue.shift()) {
            callback();
        }
    }
}

function sortCallback(a, b) {
    return a._mountOrder - b._mountOrder;
}

function sortComponent(a, b) {
    return a.mayInst.mountOrder - b.mayInst.mountOrder;
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