import {
    reRender
} from './may-dom/MayDom';
import {
    mergeState
} from './util';
import {
    mayQueue
} from './may-dom/scheduler';

export function Component(props, context, key, ref) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
    //新建个对象存放各种信息
    this.mayInst = {};
}

Component.prototype.setState = function (state, callback) {
    var lifeState = this.mayInst.lifeState;

    if (callback) {
        //回调队列调用之前也许sort
        callback = callback.bind(this);
        callback._mountOrder = this.mayInst.mountOrder;
        mayQueue.callbackQueue.push(callback);
    }
    if (this.mayInst.mergeStateQueue) {
        this.mayInst.mergeStateQueue.push(state);
    } else {
        this.mayInst.mergeStateQueue = new Array(state);
    }
    if (mayQueue.isInEvent) {
        //如果在绑定事件中 触发setState合并state
        if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
            this.mayInst.dirty = true;
            mayQueue.dirtyComponentsQueue.push(this);
        }
        return;
    }

    switch (lifeState) {
        //componentWillReceiveProps触发setState会合并state
        case 1: //componentWillMount 触发setState会合并state
            return;
        //ComponentWillReceiveProps 中setState  3
        //子组件在ComponentWillMount中调用父组件的setState  3
        case 3:
        case 2: //componentDidMount 触发setState会放到下一周期  2
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                this.mayInst.dirty = true;
                this.mayInst.needNextRender = true; //子组件componentWillReceiveProps 调用父组件的setState 触发setState会放到下一周期
                mayQueue.dirtyComponentsQueue.push(this);
            }
            return;
        default:
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                this.mayInst.dirty = true;
                mayQueue.dirtyComponentsQueue.push(this);
            }
            break;
    }

    mayQueue.clearQueue();
}
Component.prototype.forceUpdate = function (callback) {
    if (callback) {
        mayQueue.callbackQueue.push(callback.bind(this));
    }
    if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
        this.mayInst.forceUpdate = true;
        this.mayInst.dirty = true;
        mayQueue.dirtyComponentsQueue.push(this);
    }
    var lifeState = this.mayInst.lifeState;
    switch (lifeState) {
        case 1: //ComponentWillMount
        case 2: //componentDidMount 
        case 3: //ComponentWillReceiveProps 
        case 4: //ComponentWillReceiveProps 
            return;
        default:
            mayQueue.clearQueue();
            break;
    }

}
Component.prototype.isMounted = function () {
    return this.mayInst ? (!!(this.mayInst.rendered && this.mayInst.rendered.mayInfo.hostNode) || this.mayInst.isEmpty) : false;
}