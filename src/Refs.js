import { lifeCycleQueue } from './may-dom/scheduler';
export var Refs = {
    //当子component含有ref的时候,需要把对应的instance或dom添加到 父component的refs属性中
    //如果在mountComponent中做这样的操作需要每一层都要添加owner 放在外面更好些;
    currentOwner: null,
    //开始render时isRoot为true,方便ref定位最顶端节点
    isRoot: false,
    attachRef: function (vnode, hostNode) {
        if (vnode.refType === 1) { //func
            hostNode.mayInst && hostNode.mayInst.stateless && (hostNode = null);
            lifeCycleQueue.push(vnode.ref.bind(vnode, hostNode));
        } else if (vnode.refType === 2) { //string
            this.currentOwner.refs[vnode.ref] = hostNode;
        }
    }
}