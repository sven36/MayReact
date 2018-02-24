import {
    disposeVnode,
    disposeDom,
    emptyElement
} from './dispose';
import {
    diffProps,
    FormElement,
    getIsControlled
} from '../diffProps'
import {
    getChildContext,
    getContextByTypes
} from './context';
import {
    mergeState
} from '../util';
import {
    mayQueue,
    lifeCycleQueue
} from './scheduler';
import {
    transformChildren,
    genKey
} from './transformChildren';
import {
    Refs
} from '../Refs';
import {
    NAMESPACE
} from './DOMNamespaces';
import {
    mountStrategy
} from './mountStrategy'

//diff根据vnode的不同类型调用不同的diff方法~
//其实写着写着就发现还是类似React 根据不同的类型生成不同的Component
//拥有对应的diff方法;
export var updateStrategy = {
    1: updateDOM, //dom
    2: updateComposite, //component
    3: updateDOM, //svg dom
    4: updateText //text
}

function updateDOM(prevVnode, newVnode) {
    if (prevVnode.refType === 1) {
        prevVnode.ref(null);
    }
    var hostNode = (prevVnode && prevVnode.mayInfo.hostNode) || null;
    var vtype = newVnode.type;
    if (!newVnode.mayInfo.hostNode) {
        newVnode.mayInfo.hostNode = hostNode;
    }
    if (Refs.isRoot) {
        Refs.currentOwner = hostNode;
        hostNode.refs = {};
        Refs.isRoot = false;
    }
    var isSVG = hostNode && hostNode.namespaceURI === NAMESPACE.svg;
    if (isSVG) {
        newVnode.mayInfo.isSVG = true;
    }
    diffProps(prevVnode, newVnode);
    diffChildren(prevVnode, newVnode, hostNode);
    newVnode.mayInfo.vChildren = transformChildren(newVnode, hostNode);
    if (FormElement[vtype]) {
        //如果是受控组件input select之类需要特殊处理下
        if (newVnode.props) {
            var isControlled = getIsControlled(hostNode, newVnode);
            var _val, hasSelected;
            if (isControlled) {
                _val = newVnode.props['value'] || hostNode._lastValue || '';
                switch (vtype) {
                    case 'select':
                        var _optionsChilds = [].slice.call(hostNode.childNodes);
                        if (_optionsChilds) {
                            for (var k = 0; k < _optionsChilds.length; k++) {
                                var oChild = _optionsChilds[k];
                                if (oChild.value === _val) {
                                    oChild.selected = true;
                                    hasSelected = true;
                                } else {
                                    oChild.selected = false;
                                }
                            }
                            if (!hasSelected) { //如果给定value没有选中的  默认第一个
                                hostNode.value = _optionsChilds[0].value;
                            }
                        }
                        break;

                }
            } else {
                //如果reRender时 dom去掉了value属性 则其变为非受控组件 value取上一次的值
                hostNode.value = hostNode._lastValue || '';
            }
        }

    }
    if (newVnode.ref) {
        Refs.attachRef(newVnode, hostNode);
    }

    return hostNode;
}

function updateComposite(prevVnode, newVnode) {
    if (prevVnode.refType === 1) {
        prevVnode.ref(null);
    }
    //如果newVnode没有定义contextTypes 在componentWillReceiveProps等生命周期方法中
    //是不应该传入context的 那么用空的temporaryContext代替
    var temporaryContext = {};
    var context = newVnode.context || {};
    if (newVnode.getContext) {
        context = getContextByTypes(context, newVnode.type.contextTypes);
        temporaryContext = context;
    }
    var instance = prevVnode.mayInfo.instance;
    var prevRendered = instance.mayInst.rendered;
    var hostNode = (prevRendered && prevRendered.mtype === 1) ? prevRendered.mayInfo.hostNode : instance.mayInst.hostNode;
    //empty代表prevVnode为null
    var isEmpty = instance.mayInst.isEmpty || (hostNode && hostNode.nodeType === 8);
    var newDom, newRendered, prevState, prevProps;
    var skip = false;
    if (!instance.mayInst.stateless) {
        //需要兼容componentWillReceiveProps直接this.state={///}的情况
        //先保存下之前的state
        prevState = instance.state;
        prevProps = prevVnode.props;
        //lifeState为3组件开始diff
        //WillReceive WillUpdate render DidUpdate等周期setState放到下一周期;
        instance.mayInst.lifeState = 3;
        //用于mergeState如果setState传入一个function s.call(instance, newState, instance.nextProps || instance.props);
        //其参数应当是newState nextProps
        instance.nextProps = newVnode.props;
        if (instance.getChildContext) {
            //getChildContext 有可能用到新的props
            context = getChildContext(instance, context);

        }
        var newState = mergeState(instance);
        //如果context与props都没有改变，那么就不会触发组件的receive，render，update等一系列钩子
        //但还会继续向下比较
        var needReceive = prevVnode !== newVnode || prevVnode.context !== context;
        if (needReceive) {
            if (instance.componentWillReceiveProps) {
                //componentWillReceiveProps中调用了setState 合并state
                instance.mayInst.lifeState = 1;
                instance.componentWillReceiveProps(newVnode.props, temporaryContext);
                if (instance.mayInst.mergeStateQueue && instance.mayInst.mergeStateQueue.length > 0) {
                    newState = mergeState(instance);
                } else { //this.state={///}的情况
                    if (instance.state !== prevState) {
                        newState = instance.state;
                        instance.state = prevState;
                    }
                }
            }
            instance.mayInst.lifeState = 3;
        } else {
            var rendered = instance.mayInst.rendered;
            //context穿透更新问题
            rendered.context = newVnode.temporaryContext || context;
            hostNode = updateStrategy[rendered.mtype](rendered, rendered);
            return hostNode;
        }

        //shouldComponentUpdate 返回false 则不进行子组件渲染
        if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(newVnode.props, newState, temporaryContext) === false) {
            skip = true;
        } else if (instance.componentWillUpdate) {
            instance.componentWillUpdate(newVnode.props, newState, temporaryContext);
        }
        newVnode.mayInfo.instance = instance;
        instance.props = newVnode.props;
        if (skip) {
            instance.state = newState;
            instance.context = context;
            instance.mayInst.dirty = false;
            return hostNode;
        }
        instance.state = newState;
        instance.context = context;
        if (Refs.isRoot) {
            Refs.currentOwner = instance;
            Refs.currentOwner.refs = {};
            Refs.isRoot = false;
        }

        newRendered = instance.render();
        newRendered && (newRendered.context = context);
        instance.mayInst.rendered = newRendered;
        if (!isEmpty && newRendered) {
            if (isSameType(prevRendered, newRendered)) {
                hostNode = updateStrategy[newRendered.mtype](prevRendered, newRendered);
                newRendered.mayInfo.hostNode = hostNode;
            } else {
                disposeVnode(prevRendered);
                var isSVG = newRendered.mtype === 3;
                newDom = mountStrategy[newRendered.mtype](newRendered, isSVG);
                newRendered.mayInfo.hostNode = newDom;
                hostNode.parentNode.replaceChild(newDom, hostNode);
            }
        } else {
            if (isEmpty && newRendered) {
                var isSVG = newRendered.mtype === 3;
                newDom = mountStrategy[newRendered.mtype](newRendered, isSVG);
                newRendered.mayInfo.hostNode = newDom;
                if (hostNode.parentNode) {
                    hostNode.parentNode.replaceChild(newDom, hostNode);
                }
            } else {
                hostNode = document.createComment('empty');
                instance.mayInst.hostNode = hostNode;
                instance.mayInst.isEmpty = true;
            }
            //如果之前node为空 或 新render的为空 直接释放之前节点
            disposeVnode(prevRendered);
        }
        if (!instance.mayInst.needNextRender) {
            instance.mayInst.dirty = false;
            instance.mayInst.needNextRender = false;
        }
        if (newDom) {
            hostNode = newDom;
        }
        if (instance.componentDidUpdate) {
            lifeCycleQueue.push(instance.componentDidUpdate.bind(instance, prevProps, prevState, instance.context));
        } else {
            //如果没有回调则其render生命周期结束lifeState为0
            instance.mayInst.lifeState = 0;
        }
        if (newVnode.refType === 1) {
            Refs.attachRef(newVnode, instance);
        }

    } else { //stateless component
        var newRendered = newVnode.type.call(newVnode, newVnode.props, newVnode.context);
        newRendered.context = newVnode.context;
        if (prevRendered && isSameType(prevRendered, newRendered)) {
            hostNode = updateStrategy[newRendered.mtype](prevRendered, newRendered);
            newRendered.mayInfo.hostNode = hostNode;

        } else if (newVnode) {
            disposeVnode(prevRendered);
            var isSVG = newVnode.mtype === 3;
            newDom = mountStrategy[newVnode.mtype](newVnode, isSVG);
            newVnode.mayInfo.hostNode = newDom;
            hostNode.parentNode.replaceChild(newDom, hostNode);
            hostNode = newDom;
        }

    }
    return hostNode;
}

function updateText(prev, now) {
    var hostNode = now.mayInfo.hostNode || null;
    if (prev) { //child._prevVnode
        if (hostNode.nodeValue !== now.value) {
            hostNode.nodeValue = now.value;
        }
    } else {
        hostNode = document.createTextNode(now.value);
    }
    return hostNode;
}
export function diffChildren(prevVnode, updatedVnode, parent) {
    var prevChildren = prevVnode.mayInfo.vChildren || null;
    var newRenderedChild = updatedVnode.props.children;
    if (newRenderedChild && !Array.isArray(newRenderedChild)) {
        newRenderedChild = [newRenderedChild];
    }
    //diff之前 遍历prevchildren 与newChildren 如有相同key的只对其props diff
    var _mountChildren = [];
    var _unMountChildren = [];
    var k, prevK, _prevK, _tran;
    if (newRenderedChild) {
        var len = newRenderedChild.length;
        for (var i = 0; i < len; i++) {
            var c = newRenderedChild[i];
            var t = typeof c;
            switch (t) {
                case 'object':
                    k = genKey(c);
                    //
                    if (c.type && c.type.contextTypes) {
                        c.context = getContextByTypes(updatedVnode.context, c.type.contextTypes);
                    } else {
                        c.context = {};
                        //该组件没有定义contextTypes 无法使用context
                        //我们还是需要保存一份context
                        c.temporaryContext = updatedVnode.context;
                    }
                    break;
                case 'boolean':
                    k = "#text";
                    _tran = {
                        type: '#text',
                        mtype: 4, //text
                        value: '',
                        mayInfo: {}
                    }
                    c = _tran;
                    break;
                case 'number':
                case 'string':
                    k = "#text";
                    _tran = {
                        type: '#text',
                        mtype: 4, //text
                        value: c,
                        mayInfo: {}
                    }
                    c = _tran;
                    //相邻简单数据类型合并
                    if ((i + 1 < newRenderedChild.length)) {
                        var _ntype = typeof newRenderedChild[i + 1];
                        if (_ntype === 'string' || _ntype === 'number') {
                            c.value += newRenderedChild[i + 1];
                            i++;
                        }
                    }
                    break;
                case 'undefined':
                    break;
            }
            prevK = prevChildren && prevChildren[k];
            if (prevK && prevK.length > 0) { //试试=0 else
                for (var _i = 0; _i < prevK.length; _i++) {
                    var vnode = prevK[_i];
                    if (c.type === vnode.type && !vnode.mayInfo.used) {
                        vnode.mayInfo.hostNode && (c.mayInfo.hostNode = vnode.mayInfo.hostNode);
                        c.mayInfo.instance = vnode.mayInfo.instance;
                        c.mayInfo.prevVnode = vnode;
                        vnode.mayInfo.used = true;
                        c.mayInfo.reused = true;
                        break;
                    }
                }
            }
            if (c) {
                _mountChildren.push(c);
            }
        }
    }
    for (var name in prevChildren) {
        var _c = prevChildren[name];
        for (let j = 0; j < _c.length; j++) {
            if (!_c[j].mayInfo.used) _unMountChildren.push(_c[j]);
        }
    }
    flushMounts(_mountChildren, parent);
    flushUnMounts(_unMountChildren);
    _mountChildren.length = 0;
}

function flushMounts(newChildren, parent) {
    for (var _i = 0; _i < newChildren.length; _i++) {
        var child = newChildren[_i];
        var _node = parent.childNodes[_i];
        var newDom;
        if (child.mayInfo.prevVnode) { //如果可以复用之前节点
            var prevChild = child.mayInfo.prevVnode;
            delete child.mayInfo.prevVnode;
            newDom = updateStrategy[child.mtype](prevChild, child);
            if (_node && _node !== newDom) { //移动dom
                newDom = parent.removeChild(newDom);
                parent.insertBefore(newDom, _node)
            } else if (!_node) {
                parent.appendChild(newDom);
            }
        } else { //新增节点
            var isSVG = child.mtype === 3;
            // var isSVG = vnode.namespaceURI === "http://www.w3.org/2000/svg";
            newDom = mountStrategy[child.mtype](child, isSVG);
            child.mtype === 2 && (child.mayInfo.instance.mayInst.hostNode = newDom);
            // child.mayInfo.hostNode = newDom;
            if (_node) {
                parent.insertBefore(newDom, _node);
            } else {
                parent.appendChild(newDom);
            }
        }
    }
}

function flushUnMounts(oldChildren) {
    var c, dom;
    while (c = oldChildren.shift()) {
        if (c.mayInfo.hostNode) {
            dom = c.mayInfo.hostNode;
            c.mayInfo.hostNode = null;
        } else if (c.mtype === 2) {
            dom = c.mayInfo.instance.mayInst.hostNode;
        }
        disposeDom(dom);
        disposeVnode(c);
        c = null;
    }
}

export function isSameType(prev, now) {
    return prev.type === now.type && prev.key === now.key;
}