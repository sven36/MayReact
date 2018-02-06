import {
    diffProps,
    FormElement,
    getIsControlled
} from '../diffProps'
import {
    Refs
} from '../Refs';
import {
    mergeState
} from '../util';
import {
    mayQueue,
    lifeCycleQueue
} from './scheduler';
import {
    NAMESPACE
} from './DOMNamespaces';
import {
    getChildContext,
    getContextByTypes
} from './context';
import {
    transformChildren
} from './transformChildren';
import {
    getIteractor,
    callIteractor
} from './Iteractor';
import {
    buildComponentFromVnode
} from './instantiateComponent';



//React是根据type类型分成不同的Component各自具备各自的mount与update方法
//我们这里简化成根据type类型调用不同的方法
//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
export var mountStrategy = {
    1: mountDOM, //dom
    2: mountComposite, //component
    3: mountDOM, //svg dom
    4: mountText //text
}

function mountDOM(vnode, isSVG) {
    var vtype = vnode.type;
    vnode.mayInfo.isSVG = isSVG;
    var hostNode = !isSVG ? document.createElement(vtype) : document.createElementNS(NAMESPACE.svg, vnode.type);
    if (Refs.isRoot) {
        Refs.currentOwner = hostNode;
        hostNode.refs = {};
        Refs.isRoot = false;
    }
    vnode.mayInfo.hostNode = hostNode;
    diffProps(null, vnode);

    var children = vnode.props.children || null;
    if (children && !Array.isArray(children)) {
        children = [children];
    }
    var props = vnode.props;
    var cdom, c, parentContext;

    if (children) {
        var len = children.length;
        for (let i = 0; i < len; i++) {
            var c = children[i];
            var type = typeof c;
            switch (type) {
                case 'number':
                case 'string':
                    cdom = document.createTextNode(c);
                    if ((i + 1) < len && (typeof children[i + 1] === 'string')) {
                        cdom.nodeValue += children[i + 1];
                        i++;
                    }
                    hostNode.appendChild(cdom);
                    break;
                case 'object': //vnode
                    if (c.type) {
                        c.context = getContextByTypes(vnode.context, c.type.contextTypes);
                        cdom = mountStrategy[c.mtype](c, isSVG);
                        c.mayInfo.hostNode = cdom;
                        hostNode.appendChild(cdom);
                    } else { //有可能是子数组iterator
                        var iteratorFn = getIteractor(c);
                        if (iteratorFn) {
                            var ret = callIteractor(iteratorFn, c);
                            for (var _i = 0; _i < ret.length; _i++) {
                                cdom = mountStrategy[ret[_i].mtype](ret[_i], isSVG);
                                ret[_i].mayInfo.hostNode = cdom;
                                hostNode.appendChild(cdom);
                            }
                        }
                    }
            }
        }
        vnode.mayInfo.vChildren = transformChildren(vnode, hostNode);
    }

    if (FormElement[vtype]) {
        //如果是受控组件input select之类需要特殊处理下
        if (vnode.props) {
            var _val = vnode.props['value'] || vnode.props['defaultValue'] || '';
            getIsControlled(hostNode, vnode);
            hostNode._lastValue = _val;
        }
    }
    //本来想放在调度模块的 但是这种vnode type为dom类型的 func是要在DidMount之前调用的
    //因为DidMount中可能用到;
    if (vnode.refType === 1) {//func
        vnode.ref(hostNode);
    } else if (vnode.refType === 2) {//string
        Refs.currentOwner.refs[vnode.ref] = hostNode;
    }
    return hostNode;
}



function mountComposite(vnode, isSVG) {
    var hostNode = null;
    var rendered = buildComponentFromVnode(vnode);
    var inst = vnode.mayInfo.instance;
    if (!inst.mayInst.stateless && Refs.isRoot) {
        Refs.currentOwner = inst;
        inst.refs = {};
        Refs.isRoot = false;
    }
    if (rendered) {
        if (!isSVG) {
            //svg的子节点namespace也是svg
            isSVG = rendered.mtype === 3;
        }
        //用于子组件改变同步父组件的hostNode
        // vnode.mayInfo.instance && (rendered.mayInfo.parentInstance = vnode.mayInfo.instance)
        //递归遍历 深度优先
        hostNode = mountStrategy[rendered.mtype](rendered, isSVG);
        //dom diff需要分类一下children以方便diff
        rendered.mayInfo.vChildren = transformChildren(rendered, hostNode);
        rendered.mayInfo.hostNode = hostNode;
        vnode.mayInfo.hostNode = hostNode;
        inst.mayInst.hostNode = hostNode;
    } else { //render 返回null
        hostNode = document.createComment('empty');
        vnode.mayInfo.hostNode = hostNode;
        vnode.mayInfo.isEmpty = true;
        //用于isMounted 判断 即使是null
        inst.mayInst.isEmpty = true;
        inst.mayInst.hostNode = hostNode;
    }
    if (inst.ref || inst.componentDidMount) {
        lifeCycleQueue.push(inst);
    } else {
        //如果没有回调则其render生命周期结束lifeState为0
        inst.mayInst.lifeState = 0;
    }

    return hostNode;
}

function mountText(vnode) {
    if (vnode) {
        return document.createTextNode(vnode.value);
    } else {
        return document.createComment('empty');
    }
}