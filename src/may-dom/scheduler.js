import {
    reRender
} from './MayDom'
import {
    Refs
} from '../Refs';

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
    var instance;
    var i = 0;
    //如果在当前生命周期的DidMount调用setState 放到下一生命周期处理
    mayQueue.dirtyComponentsQueue = mayQueue.dirtyComponentsQueue.sort(sortComponent);
    while (instance = mayQueue.dirtyComponentsQueue.shift()) {
        if (i++ === 0) {
            Refs.isRoot = true;
        }
        if (instance.mayInst.dirty) {
            //如果C是脏组件diff 如果其在diff过程中子组件也需要diff diff之后
            //子组件_dirty会为false 没必要再diff一次；
            reRender(instance);
        }

        if (instance) {
            //diff之后组件的状态返回0
            instance.mayInst.lifeState = 0;
        }
    }
    //ComponentDidUpdate
    clearLifeCycleQueue();
    //防止setState currentOwner混乱
    Refs.currentOwner = null;
}

function clearLifeCycleQueue() {
    //先清空 生命周期 ref 的回调函数
    if (mayQueue.lifeCycleQueue && mayQueue.lifeCycleQueue.length > 0) {
        var callback;
        //其实ref很像生命周期函数,它比较特殊的地方在于vnode.type='div'之类的vnode
        //其string ref要指向其真实dom func ref也是回调真实的dom 其它的都是回调instance
        //vnode.type='div'之类的ref特殊处理;剩余的就和生命周期很像了;
        while (callback = mayQueue.lifeCycleQueue.shift()) {
            callback();
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