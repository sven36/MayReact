import {
    reRender
} from './MayDom';
import {
    mayQueue
} from './util';


export function Component(props, key, ref, context) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
}

Component.prototype.setState = function (state, callback) {
    this._dirty = true;
    var lifeState = this._lifeState;
    if (callback) {
        mayQueue.callbackQueue.push(callback.bind(this));
    }
    if (mayQueue.isInEvent) {
        //如果在绑定事件中 触发setState合并state
        return;
    }
    if (this._mergeStateQueue) {
        this._mergeStateQueue.push(state);
    } else {
        this._mergeStateQueue = new Array(state);
    }
    switch (lifeState) {
        case 0: //componentWillMount 触发setState会合并state
            return;
        case 1: //componentDidMount 触发setState会放到下一周期
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                mayQueue.dirtyComponentsQueue.push(this);
            }
            return;
        default:
            if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
                mayQueue.dirtyComponentsQueue.push(this);
            }
            break;
    }

    mayQueue.flushUpdates();
}
Component.prototype.forceUpdate = function (callback) {
    this._dirty = true;
    if (callback) {
        mayQueue.callbackQueue.push(callback.bind(this));
    }
    if (mayQueue.dirtyComponentsQueue.indexOf(this) === -1) {
        mayQueue.dirtyComponentsQueue.push(this);
    }
    mayQueue.flushUpdates();
}