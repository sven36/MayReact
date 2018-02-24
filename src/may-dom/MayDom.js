import {
	mergeState
} from '../util';
import {
	mayQueue,
	lifeCycleQueue
} from './scheduler';
import {
	mountStrategy
} from './mountStrategy'
import {
	updateStrategy,
	isSameType
} from './diffStrategy'
import {
	diffProps,
	FormElement,
	getIsControlled
} from '../diffProps'
import {
	Refs
} from '../Refs';
import {
	NAMESPACE
} from './DOMNamespaces';
import {
	getChildContext,
	getContextByTypes
} from './context';
import {
	transformChildren,
	genKey
} from './transformChildren';
import {
	disposeVnode,
	disposeDom,
	emptyElement
} from './dispose';

export function render(vnode, container, callback) {
	return renderByMay(vnode, container, callback);
}
/**
 * render传入的Component都是一个function 该方法的原型对象上绑定了render方法
 * @param {*} vnode 
 * @param {*} container 
 * @param {*} callback 
 */
var renderByMay = function (vnode, container, callback) {
	var renderedVnode, rootDom, result;
	var lastVnode = container._lastVnode || null;
	if (lastVnode) { //update
		Refs.isRoot = true;
		rootDom = mayUpdate(lastVnode, vnode, container);
	} else {
		if (vnode && vnode.type) {
			//为什么React使用var markup=renderChilden();这样的形式呢; 2018-1-13
			//因为如果按renderComponentChildren(renderedVnode, rootDom, _isSvg);传入container这种
			//碰上component嵌套不好处理 参见 ReactChildReconciler-test的 warns for duplicated array keys with component stack info
			var isSVG = vnode.mtype === 3;
			Refs.isRoot = true;
			rootDom = mountStrategy[vnode.mtype](vnode, isSVG);
			if (rootDom && container && container.appendChild) {
				container.appendChild(rootDom);
			} else {
				throw new Error('container参数错误');
			}
		} else {
			throw new Error('render参数错误');
		}
	}
	var instance = vnode.mayInfo.instance;
	result = instance && !instance.mayInst.stateless && instance || rootDom;
	//执行render过程中的回调函数lifeCycle ref等
	mayQueue.clearQueue();
	if (callback) { //render的 callback
		callback();
	}
	if (instance) {
		//render之后lifeState也初始化为0；
		instance.mayInst.lifeState = 0;
		instance.mayInst.hostNode = rootDom;
		//当我开始着手解决 层层嵌套的component 最底层的那个setState触发的时候lifeState并不为0
		//因为我不能确定其是否有componentDidMount的回调，它在这个回调setState是需要放到下一周期处理的
		//一种办法是该instance如果具备componentDidMount我把其lifeState标个值如10 setState的时候判断
		//另一种办法就是我新建一个instance队列 instance.pendingCallback=componentDidMount
		//然后我每次render完再遍历这个队列有回调就调用 这貌似就是ANU的逻辑吧~
		//快写完了我才发现~惭愧~看来还是自己写写好，不如琢如磨，怎么对这流程了如指掌，不胸有成竹又如何找寻这
		//最优方法
	}
	Refs.isRoot = false;
	Refs.currentOwner = null;
	container._lastVnode = vnode;
	return result;
}

export function reRender(instance) {
	var prevProps = instance.props;
	var context = instance.context;
	var prevState = instance.state;
	var prevRendered = instance.mayInst.rendered;
	var isEmpty = instance.mayInst.isEmpty;
	var hostNode = instance.mayInst.hostNode;
	var skip = false;
	//lifeState为3组件开始diff
	//WillReceive WillUpdate render DidUpdate等周期setState放到下一周期;
	instance.mayInst.lifeState = 3;
	var newState = mergeState(instance);
	//forceUpdate时 忽略shouldComponentUpdate
	if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(prevProps, newState, context) === false) {
		skip = true;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate(prevProps, newState, context);
	}
	instance.state = newState;
	//getChildContext有可能setState 所以需要newState再调用
	if (instance.getChildContext) {
		context = getChildContext(instance, context);
	}
	if (skip) {
		instance.mayInst.dirty = false;
		return hostNode;
	}
	if (Refs.isRoot) {
		Refs.currentOwner = instance;
		Refs.isRoot = false;
	}
	var updated = instance.render(prevProps, context);
	instance.mayInst.rendered = updated;
	updated && (updated.context = context);
	if (!updated) {
		disposeVnode(prevRendered);
		return;
	}
	if (!isEmpty && isSameType(prevRendered, updated)) {

		// updated.mayInfo.instance = instance;
		// updated.mayInfo.hostNode = hostNode;
		hostNode = updateStrategy[updated.mtype](prevRendered, updated);
		//mtype === 1在这在设置instance会循环引用
		// updated.mtype === 2 && ();
		updated.mayInfo.vChildren = transformChildren(updated, hostNode);
		instance.mayInst.forceUpdate = null;
		//原先这种diffProps 再diffChildren的方式并未考虑到 render返回之后还是
		//组件怎么办，连续几个组件嵌套children都需要render怎么办 这些情况都是diffProps
		//无法处理的，当时想的是一个组件diff diff之后再diff下一个组件；但如果组件之间发生交互的
		//话是需要在一个处理流程的；那diff我们也需要这种递归的思想了，所以setState的时候我们设置
		//instance的_dirty为true如果父组件 子组件都dirty，父组件向下diff的过程中也会diff子组件
		//此时在子组件diff之后我们要把_dirty设为false 否则因为子组件也在diffQueue之中，会再进行
		//一次diff是多余的；不晓得我说明白没有~参考测试ReactCompositeComponentNestedState-state的
		//should provide up to date values for props
		// diffProps(prevRenderedVnode, updatedVnode);
	} else {

		var isSVG = updated.mtype === 3;
		var dom = mountStrategy[updated.mtype](updated, isSVG);
		//component上的hostNode保持最新
		// var lastVnode = hostNode.parentNode._lastVnode;
		// lastVnode && (lastVnode.mayInfo.hostNode = dom);
		hostNode.parentNode.replaceChild(dom, hostNode);
		// updated.mayInfo.hostNode = dom;
		hostNode = dom;
		instance.mayInst.hostNode = dom;
		updated.mayInfo.vChildren = transformChildren(updated, hostNode);
		instance.mayInst.forceUpdate = null;
		disposeVnode(prevRendered);
	}

	if (instance.componentDidUpdate) {
		instance.componentDidUpdate(prevProps, prevState, instance.context);
		// lifeCycleQueue.push(instance.componentDidUpdate.bind(instance, prevProps, prevState, instance.context));
	} else {
		instance.mayInst.lifeState = 0;
	}
	//needNextRender情况是 子组件在diff生命周期(如WillReceiveProps)调用父组件的setState
	//这种情况下父组件需要再进行一次diff，不过本地diff完成时c.mayInst.dirty 会为false 所以需要
	//mayInst.dirty为true;ReactCompositeComponentState-test 的should update state when called from child cWRP
	if (!instance.mayInst.needNextRender) {
		instance.mayInst.dirty = false;
		instance.mayInst.needNextRender = false;
	}

}

function mayUpdate(prevVnode, newVnode, parent) {
	var dom;
	if (isSameType(prevVnode, newVnode)) {
		dom = updateStrategy[newVnode.mtype](prevVnode, newVnode);
	} else {
		var isSVG = newVnode.mtype === 3;
		dom = mountStrategy[newVnode.mtype](newVnode, isSVG);
		var hostNode = (prevVnode && prevVnode.mtype === 1) ? prevVnode.mayInfo.hostNode : prevVnode.mayInfo.instance.mayInst.hostNode;
		if (!parent) {
			parent = hostNode && hostNode.parentNode;
		}
		parent.replaceChild(dom, hostNode);
		disposeVnode(prevVnode);
		hostNode = null;
	}
	// newVnode.mtype === 2 && (newVnode.mayInfo.instance.mayInst.hostNode = dom);
	// newVnode.mayInfo.hostNode = dom;
	return dom;
}

export function unmountComponentAtNode(dom) {
	var lastVnode = dom._lastVnode;
	if (dom.refs) {
		dom.refs = null;
	}
	if (lastVnode) {
		disposeVnode(lastVnode);
		emptyElement(dom);
		//unmount之后又render
		//参见ReactComponentLifeCycle-test
		//should not reuse an instance when it has been unmounted
		dom._lastVnode.mayInfo = {};
		dom._lastVnode = null;
	}
}
export function findDOMNode(ref) {
	var ret = null;
	if (ref) {
		if (ref.nodeType === 1) {
			return ref;
		} else {
			var c = ref.mayInst.rendered;
			while (c) {
				if (c.mtype === 1) {
					return c.mayInfo.hostNode;
				} else if (c.mayInfo.hostNode) {
					return c.mayInfo.hostNode;
				}
				c = c.mayInfo.instance.mayInst.rendered;
			}
		}
	}
	return ret;
}