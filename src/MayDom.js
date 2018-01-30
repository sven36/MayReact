import {
	mergeState,
	mayQueue
} from './util';

import {
	diffProps,
	FormElement
} from './diffProps'

import {
	Refs
} from './Refs';


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
		mayUpdate(lastVnode, vnode, container);
	} else {
		if (vnode && vnode.type) {
			//为什么React使用var markup=renderChilden();这样的形式呢; 2018-1-13
			//因为如果按renderComponentChildren(renderedVnode, rootDom, _isSvg);传入container这种
			//碰上component嵌套不好处理 参见 ReactChildReconciler-test的 warns for duplicated array keys with component stack info
			var isSVG = vnode.mtype === 3;
			rootDom = mountStrategy[vnode.mtype](vnode, isSVG);
			if (rootDom && container && container.appendChild) {
				container.appendChild(rootDom);
			} else {
				throw new Error('container参数错误');
			}
		} else {
			console.error('render参数错误');
			return;
		}
	}
	result = vnode.mayInfo.instance || container;
	if (!vnode.mayInfo.instance && rootDom) {
		result.refs = rootDom.refs;
	}
	//执行render过程中的回调函数lifeCycle ref等
	mayQueue.clearQueue();
	if (callback) { //render的 callback
		callback();
	}
	Refs.currentOwner = null;
	container._lastVnode = vnode;
	return result;
}

function mountDOM(vnode, isSVG) {
	var vtype = vnode.type;
	var hostNode = !isSVG ? document.createElement(vtype) : document.createElementNS("http://www.w3.org/2000/svg", vnode.type);
	if (!Refs.currentOwner) {
		Refs.currentOwner = hostNode;
		hostNode.refs = {};
	}
	vnode.mayInfo.hostNode = hostNode;
	diffProps(null, vnode);
	var children = vnode.props.children || null;
	if (children && !Array.isArray(children)) {
		children = [children];
	}
	var props = vnode.props;
	var cdom, c, parentContext;
	if (vnode.mayInfo.refOwner && vnode.mayInfo.refOwner.context) {
		parentContext = vnode.mayInfo.refOwner.context;
	}
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
						if (parentContext) {
							c.context = getContextByTypes(parentContext, c.type.contextTypes);
						}
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
	//如果是受控组件input select之类需要特殊处理下
	if (FormElement[vtype]) {
		if (vtype === 'select') {
			if (vnode.props['value']) {
				var _val = vnode.props['value'];
				var _optionsChilds = [].slice.call(hostNode.childNodes);
				if (_optionsChilds) {
					for (var k = 0; k < _optionsChilds.length; k++) {
						var oChild = _optionsChilds[k];
						oChild.value !== _val ? oChild.selected = false : oChild.selected = true;
					}
				}

			}
		}
	}
	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode.mayInfo.instance || vnode.mayInfo.hostNode || null;
		if (typeof ref === 'function') {
			lifeCycleQueue.push(ref.bind(owner, refInst));
		} else if (typeof ref === 'string') { //ref 为string
			owner.refs[ref] = refInst;
		}
	}
	return hostNode;
}

function mountComposite(vnode, isSVG) {
	var hostNode = null;
	var renderedVnode = buildComponentFromVnode(vnode);
	if (!Refs.currentOwner && vnode.mayInfo.instance) { //!Refs.currentOwner && 
		Refs.currentOwner = vnode.mayInfo.instance;
		vnode.mayInfo.instance.refs = {};
	}
	if (renderedVnode) {
		//递归遍历 深度优先
		hostNode = mountStrategy[renderedVnode.mtype](renderedVnode, isSVG);
		//既然dom diff必然需要分类一下children以方便diff  那就把这步提前 render时就执行
		renderedVnode.mayInfo.vChildren = transformChildren(renderedVnode, hostNode);
		renderedVnode.mayInfo.hostNode = hostNode;
	} else { //render 返回null
		hostNode = document.createComment('empty');
		if (vnode.mayInfo.instance) { //用于isMounted 判断 即使是null
			vnode.mayInfo.hostNode = hostNode;
			vnode.mayInfo.isEmpty = true;
			vnode.mayInfo.instance.mayInst.isEmpty = true;
		}
	}
	var inst = vnode.mayInfo.instance || null;
	if (inst && inst.componentDidMount) {
		inst.mayInst.lifeState = 'beforeComponentDidMount'
		lifeCycleQueue.push(inst.componentDidMount.bind(inst));
	}
	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode.mayInfo.instance || vnode.mayInfo.hostNode || null;
		if (typeof ref === 'function') {
			lifeCycleQueue.push(ref.bind(owner, refInst));
		} else if (typeof ref === 'string') { //ref 为string
			owner.refs[ref] = refInst;
		}
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

//React是根据type类型分成不同的Component各自具备各自的mount与update方法
//我们这里简化成根据type类型调用不同的方法
//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
var mountStrategy = {
	1: mountDOM, //dom
	2: mountComposite, //component
	3: mountDOM, //svg dom
	4: mountText //text
}
//diff根据vnode的不同类型调用不同的diff方法~
//其实写着写着就发现还是类似React 根据不同的类型生成不同的Component
//拥有对应的diff方法;
var updateStrategy = {
	1: updateDOM, //dom
	2: updateComposite, //component
	3: updateDOM, //svg dom
	4: updateText //text
}
//存放生命周期中的 DidMount DidUpdate以及ref回调
var lifeCycleQueue = mayQueue.lifeCycleQueue;
var mountOrder = 0;

function buildComponentFromVnode(vnode) {
	var props = vnode.props;
	var key = vnode.key;
	var ref = vnode.ref;
	var context = vnode.context;
	var inst, renderedVnode;
	var Ctor = vnode.type;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		inst = new Ctor(props, key, ref, context);
		if (!inst.mayInst) {
			//新建个对象存放各种信息
			inst.mayInst = {};
		}
		inst.mayInst.mountOrder = mountOrder;
		mountOrder++;
		if (inst.componentWillMount) {
			//_lifeState来控制生命周期中调用setState的作用
			//刚创建instance componentWillMount调用setState合并state即可
			inst.mayInst.lifeState = 'beforeComponentWillMount';
			inst.componentWillMount();
			inst.mayInst.lifeState = 'afterComponentWillMount';
		}
		if (inst.mayInst.mergeStateQueue) {
			inst.state = mergeState(inst);
		}
		renderedVnode = inst.render(props, context);
		if (inst.getChildContext) {
			var getContext = inst.getChildContext();
			if (getContext && typeof getContext === 'object') {
				if (!context) {
					context = {};
				}
				context = Object.assign(context, getContext);
			}
		}
		if (context) {
			inst.context = context;
		}
		// vnode.type === 'function' 代表其为Component Component中才能setState
		//setState会触发reRender 故保存有助于domDiff的参数
		vnode.mayInfo.instance = inst;
		inst.mayInst.rendered = renderedVnode;
		//设定owner 用于ref绑定
		renderedVnode && (renderedVnode.mayInfo.refOwner = inst);
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedVnode = Ctor.call(vnode, props, context);
	}
	//添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
	vnode.mayInfo.rendered = renderedVnode;
	return renderedVnode;
}

function getContextByTypes(context, typeCheck) {
	var ret = {};
	if (!context || !typeCheck) {
		return ret;
	}
	for (const key in typeCheck) {
		if (context.hasOwnProperty(key)) {
			ret[key] = context[key];
		}
	}
	return ret;
}

export function reRender(instance) {
	var props = instance.props;
	var context = instance.context;
	var prevState = instance.state;
	var prevRenderedVnode = instance.mayInst.rendered;
	var isEmpty = !prevRenderedVnode;
	var hostNode = !isEmpty && prevRenderedVnode.mayInfo.hostNode;
	var skip = false;

	var newState = mergeState(instance);
	//forceUpdate时 忽略shouldComponentUpdate
	if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(props, newState, context) === false) {
		skip = true;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate(props, newState, context);
	}
	instance.state = newState;
	if (skip) {
		instance.mayInst.dirty = false;
		return;
	}
	instance.mayInst.lifeState = 'beforeComponentRerender';
	var updatedVnode = instance.render(props, context);
	instance.mayInst.rendered = updatedVnode;
	if (!updatedVnode) {
		disposeVnode(prevRenderedVnode);
		return;
	}
	if (!isEmpty && isSameType(prevRenderedVnode, updatedVnode)) {
		updatedVnode.mayInfo.hostNode = hostNode;
		//原先这种diffProps 再diffChildren的方式并未考虑到 render返回之后还是
		//组件怎么办，连续几个组件嵌套children都需要render怎么办 这些情况都是diffProps
		//无法处理的，当时想的是一个组件diff diff之后再diff下一个组件；但如果组件之间发生交互的
		//话是需要在一个处理流程的；那diff我们也需要这种递归的思想了，所以setState的时候我们设置
		//instance的_dirty为true如果父组件 子组件都dirty，父组件向下diff的过程中也会diff子组件
		//此时在子组件diff之后我们要把_dirty设为false 否则因为子组件也在diffQueue之中，会再进行
		//一次diff是多余的；不晓得我说明白没有~参考测试ReactCompositeComponentNestedState-state的
		//should provide up to date values for props
		hostNode = updateStrategy[updatedVnode.mtype](prevRenderedVnode, updatedVnode);
		// diffProps(prevRenderedVnode, updatedVnode);
	} else {
		var isSVG = updatedVnode.mtype === 3;
		var dom = mountStrategy[updatedVnode.mtype](updatedVnode, isSVG);
		hostNode.parentNode.replaceChild(dom, hostNode);
	}
	instance.mayInst.rendered.mayInfo.hostNode = hostNode;
	updatedVnode.mayInfo.vChildren = transformChildren(updatedVnode, hostNode);
	instance.mayInst.forceUpdate = null;
	if (instance.componentDidUpdate) {
		//执行完 componentWillUpdate 
		instance.mayInst.lifeState = 'beforeComponentDidUpdate';
		if (instance.mayInst.renderInNextCycle) {
			instance.componentDidUpdate();
			//执行完 componentDidUpdate
			instance.mayInst.lifeState = 'afterComponentDidUpdate';
		} else {
			lifeCycleQueue.push(instance.componentDidUpdate.bind(instance));
		}
	}
	//如果没有再次diff的标识 设置_dirty为false
	if (!instance.mayInst.renderInNextCycle) {
		instance.mayInst.dirty = false;
	}

}

function updateDOM(prevVnode, newVnode) {
	var hostNode = (prevVnode && prevVnode.mayInfo.hostNode) || null;

	diffProps(prevVnode, newVnode);
	diffChildren(prevVnode, newVnode, hostNode);

	return hostNode;
}

function updateComposite(prevVnode, newVnode) {
	if (prevVnode.ref && typeof prevVnode.ref === 'function') {
		prevVnode.ref(null);
	}
	var instance = prevVnode.mayInfo.instance;
	//empty代表prevVnode为null
	var isEmpty = !prevVnode.mayInfo.rendered;
	var hostNode = !isEmpty && prevVnode.mayInfo.hostNode;
	var newDom;

	//用于mergeState如果setState传入一个function s.call(instance, newState, instance.nextProps || instance.props);
	//其参数应当是newState nextProps
	instance.nextProps = newVnode.props;
	var newState = mergeState(instance);
	instance._lifeState = 'beforeComponentWillReceiveProps';
	if (prevVnode !== newVnode || prevVnode.context !== newVnode.context) {
		if (instance.componentWillReceiveProps) {
			instance.componentWillReceiveProps(newVnode.props, newVnode.context);
		}
		instance.props = newVnode.props;
	}
	instance._lifeState = 'beforeShouldComponentUpdate';
	//shouldComponentUpdate 返回false 则不进行子组件渲染
	if (!instance.mayInst.forceUpdate && instance.shouldComponentUpdate && instance.shouldComponentUpdate(newVnode.props, newState, newVnode.context) === false) {
		return hostNode;
	} else if (instance.componentWillUpdate) {
		instance.componentWillUpdate();
	}
	instance.state = newState;
	if (!Refs.currentOwner) {
		Refs.currentOwner = instance;
		Refs.currentOwner.refs = {};
	}

	var prevRenderedVnode = prevVnode.mayInfo.rendered;
	instance.mayInst.lifeState = 'beforeComponentRerender';
	var newRenderedVnode = instance.render();
	newVnode.mayInfo.rendered = newRenderedVnode;
	newVnode.mayInfo.instance = instance;
	instance.mayInst.rendered = newRenderedVnode;
	if (!isEmpty && newRenderedVnode) {
		if (isSameType(prevRenderedVnode, newRenderedVnode)) {
			hostNode = updateStrategy[newRenderedVnode.mtype](prevRenderedVnode, newRenderedVnode);
			newRenderedVnode.mayInfo.hostNode = hostNode;
		} else {
			var isSVG = newRenderedVnode.mtype === 3;
			newDom = mountStrategy[newRenderedVnode.mtype](newRenderedVnode, isSVG);
			newRenderedVnode.mayInfo.hostNode = newDom;
			hostNode.parentNode.replaceChild(newDom, hostNode);
			disposeVnode(prevRenderedVnode);
		}
	} else {
		if (isEmpty && newRenderedVnode) {
			var isSVG = newRenderedVnode.mtype === 3;
			newDom = mountStrategy[newRenderedVnode.mtype](newRenderedVnode, isSVG);
			newRenderedVnode.mayInfo.hostNode = newDom;
			hostNode.parentNode.replaceChild(newDom, hostNode);
		}
		//如果之前node为空 或 新render的为空 直接释放之前节点
		disposeVnode(prevRenderedVnode);
	}
	//如果没有再次diff的标识 设置_dirty为false
	if (!instance.mayInst.renderInNextCycle) {
		instance.mayInst.dirty = false;
	}
	if (instance.componentDidUpdate) {
		instance.mayInst.lifeState = 'beforeComponentDidUpdate';
		lifeCycleQueue.push(instance.componentDidUpdate.bind(instance));
	}
	if (newVnode.ref && typeof newVnode.ref === 'function') {
		lifeCycleQueue.push(newVnode.ref.bind(newVnode, newVnode));
	}
	if (newDom) {
		hostNode = newDom;
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

function mayUpdate(prevVnode, newVnode, parent) {
	var dom;
	if (prevVnode.type === newVnode.type) {
		dom = updateStrategy[newVnode.mtype](prevVnode, newVnode);
	} else {
		var isSVG = newVnode.mtype === 3;
		dom = mountStrategy[newVnode.mtype](newVnode, isSVG);
		var hostNode = prevVnode.mayInfo.hostNode || null;
		if (!parent) {
			parent = hostNode && hostNode.parentNode;
		}
		parent.replaceChild(dom, hostNode);
		disposeVnode(prevVnode);
		hostNode = null;
	}
	return dom;
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
						c.mayInfo.hostNode = vnode.mayInfo.hostNode;
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
}

function flushMounts(newChildren, parent) {
	for (var _i = 0; _i < newChildren.length; _i++) {
		var child = newChildren[_i];
		var _node = parent.childNodes[_i];
		var newDom;
		if (child.mayInfo.prevVnode) { //如果可以复用之前节点
			newDom = updateStrategy[child.mtype](child.mayInfo.prevVnode, child);
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
			child.mayInfo.hostNode = newDom;
			if (_node) {
				parent.insertBefore(newDom, _node);
			} else {
				parent.appendChild(newDom);
			}
		}
	}
}

function flushUnMounts(oldChildren) {
	var c;
	while (c = oldChildren.shift()) {
		disposeVnode(c);
		c = null;
	}
}

//https://segmentfault.com/a/1190000010336457  司徒正美先生写的分析
//hydrate是最早出现于inferno(另一个著名的react-like框架)，并相邻的简单数据类型合并成一个字符串。
//因为在react的虚拟DOM体系中，字符串相当于一个文本节点。减少children中的个数，
//就相当减少实际生成的文本节点的数量，也减少了以后diff的数量，能有效提高性能。

//render过程中有Key的 是最有可能变动的，无Key的很可能不会变（绝大部分情况）
//把children带Key的放一起  不带Key的放一起（因为他们很可能不变化，顺序也不变减少diff寻找）
function transformChildren(renderedVnode, parent) {
	var children = renderedVnode.props.children || null;
	if (children && !Array.isArray(children)) {
		children = [children];
	}
	var len = children ? children.length : 0;
	var childList = [].slice.call(parent.childNodes);
	var result = children ? {} : null;
	//如有undefined null 简单数据类型合并 noCount++;
	var noCount = 0;
	for (var i = 0; i < len; i++) {
		var c = children[i];
		var __type = typeof c;
		switch (__type) {
			case 'object':
				if (c.type) {
					if (c.mayInfo.reused) {
						//如果该组件 diff 两次 第一次vnode重用之后_reused为true
						//生成vchildren时需要其为false 否则第二次diff
						c.mayInfo.reused = false;
					}
					var _key = genKey(c);
					if (!result[_key]) {
						result[_key] = [c];
					} else {
						result[_key].push(c);
					}
					if (c.ref) { //如果子dom有ref 标识一下 
						var owner = renderedVnode.mayInfo.refOwner;
						if (owner) {
							if (owner.refs) {
								owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
							} else {
								owner.refs = {};
								owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
							}
						}
					}
				} else {
					var iteratorFn = getIteractor(c);
					if (iteratorFn) {
						var ret = callIteractor(iteratorFn, c);
						for (var _i = 0; _i < ret.length; _i++) {
							var _key = genKey(ret[_i]);
							if (!result[_key]) {
								result[_key] = [ret[_i]];
							} else {
								result[_key].push(ret[_i]);
							}
						}
					}
				}

				break;
			case 'number':
			case 'string':
				//相邻的简单数据类型合并成一个字符串
				var tran = {
					type: '#text',
					mtype: 4,
					value: c,
					mayInfo: {}
				}
				if (childList[i - noCount]) {
					tran.mayInfo.hostNode = childList[i - noCount];
				}
				if ((i + 1 < len)) {
					var _ntype = typeof children[i + 1 - noCount];
					if (_ntype === 'string' || _ntype === 'number') {
						tran.value += children[i + 1 - noCount];
						noCount++;
						i++;
					}
				}
				var _k = '#text';
				if (!result[_k]) {
					result[_k] = [tran];
				} else {
					result[_k].push(tran);
				}
				break;
			default:
				noCount++;
				break;
		}
	}
	return result;
}

function disposeVnode(vnode) {
	var children = vnode.props && vnode.props.children;
	if (vnode.ref && typeof vnode.ref === 'function') {
		vnode.ref(null);
		vnode.ref = null;
	}

	if (vnode.mayInfo.instance) {
		if (vnode.mayInfo.instance.setState) {
			vnode.mayInfo.instance.setState = noop;
		}
		if (vnode.mayInfo.instance.componentWillUnmount) {
			//componentWillUnmount中触发setState 忽略
			vnode.mayInfo.instance.mayInst.lifeState = 'beforeComponentWillUnmount';
			vnode.mayInfo.instance.componentWillUnmount();
		}
		vnode.mayInfo.instance.refs = null;
		vnode.mayInfo.instance = null;
	}
	if (vnode.mayInfo.rendered) {
		disposeVnode(vnode.mayInfo.rendered);
		vnode.mayInfo.rendered = null;
	}
	if (children && children.length > 0) {
		for (var i = 0; i < children.length; i++) {
			var c = children[i];
			var type = typeof c;
			if (c && type === 'object') {
				disposeVnode(c);
			}
		}
	} else if (children) {
		disposeVnode(children);
	}
	if (vnode.mayInfo.prevVnode) {
		vnode.mayInfo.prevVnode = null;
	}
	if (vnode.mayInfo.hostNode) {
		disposeDom(vnode.mayInfo.hostNode);
	}
	vnode.mayInfo = null;
	vnode = null;
}

function disposeDom(dom) {
	if (dom._listener) {
		dom._listener = null;
	}
	if (dom.parentNode) {
		dom.parentNode.removeChild(dom);
		dom = null;
	}
}

function genKey(child) {
	return !child.key ? (child.type.name || child.type) : ('_$' + child.key);
}

function isSameType(prev, now) {
	return prev.type === now.type && prev.key === now.key;
}
export function unmountComponentAtNode(dom) {
	var lastVnode = dom._lastVnode;
	if (dom.refs) {
		dom.refs = null;
	}
	if (lastVnode) {
		disposeVnode(lastVnode);
		emptyElement(dom);
		dom._lastVnode = null;
	}
}
export function findDOMNode(ref) {
	var ret = null;
	if (ref) {
		if (ref.nodeType === 1) {
			return ref;
		} else {
			if (ref.mayInfo.hostNode) {
				ret = ref.mayInfo.hostNode;
			}
		}
	}
	return ret;
}

function emptyElement(dom) {
	var c;
	while (c = dom.firstChild) {
		emptyElement(c);
		dom.removeChild(c);
	}
}


var REAL_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
var FAKE_SYMBOL = "@@iterator";

function getIteractor(a) {
	var iteratorFn = REAL_SYMBOL && a[REAL_SYMBOL] || a[FAKE_SYMBOL];
	if (iteratorFn && iteratorFn.call) {
		return iteratorFn;
	}
}

function callIteractor(iteratorFn, children) {
	var iterator = iteratorFn.call(children),
		step,
		ret = [];
	if (iteratorFn !== children.entries) {
		while (!(step = iterator.next()).done) {
			ret.push(step.value);
		}
	} else {
		//Map, Set
		while (!(step = iterator.next()).done) {
			var entry = step.value;
			if (entry) {
				ret.push(entry[1]);
			}
		}
	}
	return ret;
}

function noop() { };