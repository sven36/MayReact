import {
    reRender
} from './MayDom';
import {
    mayQueue,
    mergeState
} from './util';


export function Component(props, key, ref, context) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
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
        case 'beforeComponentWillUnmount': //componentWillUnmount 触发setState忽略
            return;
        case 'beforeComponentWillMount': //componentWillMount 触发setState会合并state
            this.state = mergeState(this);
            return;
        case 'beforeComponentRerender': //子组件componentWillReceiveProps 调用父组件的setState 触发setState会放到下一周期
            this.mayInst.renderInNextCycle = true;
        case 'beforeComponentWillReceiveProps': //ComponentWillReceiveProps 中setState
        case 'afterComponentWillMount': //子组件在ComponentWillMount中调用父组件的setState
        case 'beforeComponentDidMount': //componentDidMount 触发setState会放到下一周期beforeComponentRerender
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                this.mayInst.dirty = true;
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
        case 'beforeComponentWillUnmount': //componentWillUnmount 
        case 'beforeComponentWillMount': //componentWillMount 会合并state
        case 'beforeComponentRerender': //componentWillReceiveProps 
        case 'afterComponentWillMount': //ComponentWillMount
        case 'beforeComponentDidMount': //componentDidMount 
        case 'beforeComponentWillReceiveProps': //ComponentWillReceiveProps 
            return;
        default:
            mayQueue.clearQueue();
            break;
    }

}
Component.prototype.isMounted = function () {
    return this.mayInst ? (!!this.mayInst.hostNode || this.mayInst.isEmpty) : false;
}