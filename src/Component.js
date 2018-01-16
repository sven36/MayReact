import { reRender } from './MayDom';
import { dirtyComponents, flushUpdates } from './may-dom/render-queue';


export function Component(props, key, ref, context) {
    this.props = props;
    this.key = key;
    this.ref = ref;
    this.context = context;
}

Component.prototype.setState = function (state, callback) {
    this._dirty = true;
    if (this._mergeStateQueue) {
        this._mergeStateQueue.push(state);
    } else {
        this._mergeStateQueue = new Array(state);
    }
    if (dirtyComponents.indexOf(this) === -1) {
        dirtyComponents.push(this);
    }
    flushUpdates();
}
Component.prototype.forceUpdate = function (callback) {
    this._dirty = true;
    if (dirtyComponents.indexOf(this) === -1) {
        dirtyComponents.push(this);
    }
    flushUpdates(callback);
}