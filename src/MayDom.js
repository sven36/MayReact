import {
	setDomAttr,
	removeDomAttr,
	mergeState,
	mayQueue
} from './util';

import {
	Refs,
	RefsQueue
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

	result = vnode._inst || container;
	if (!vnode._inst && rootDom) {
		result.refs = rootDom.refs;
	}
	//执行render过程中的回调函数lifeCycle ref等
	clearQueue();
	if (callback) { //render的 callback
		callback();
	}
	Refs.currentOwner = null;
	container._lastVnode = vnode;
	return result;
}

/**
 * 清空回调队列
 * @param {*} mayQueue 
 */
function clearQueue() {
	//先清空 生命周期 ref 的回调函数
	if (mayQueue.lifeCycleQueue) {
		var lifeCallback;
		while (lifeCallback = mayQueue.lifeCycleQueue.shift()) {
			lifeCallback();
		}
	}
	if (mayQueue.renderInNextCycle) {
		//如果要在下一周期触发回调 
		mayQueue.flushUpdates();
	}
	//再清空 setState传入的回调函数
	if (mayQueue.callbackQueue) {
		var callback;
		while (callback = mayQueue.callbackQueue.shift()) {
			callback();
		}
	}
}

function mountDOM(vnode, isSVG) {
	var hostNode = !isSVG ? document.createElement(vnode.type) : document.createElementNS("http://www.w3.org/2000/svg", vnode.type);
	if (!Refs.currentOwner) {
		Refs.currentOwner = hostNode;
		hostNode.refs = {};
	}
	setDomAttr(hostNode, vnode.props);
	vnode._hostNode = hostNode;
	var children = vnode.props.children || null;
	if (children && !Array.isArray(children)) {
		children = [children];
	}
	var props = vnode.props;
	var cdom, c, parentContext;
	if (vnode._refOwner && vnode._refOwner.context) {
		parentContext = vnode._refOwner.context;
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
						c._hostNode = cdom;
						hostNode.appendChild(cdom);
					} else { //有可能是子数组iterator
						var iteratorFn = getIteractor(c);
						if (iteratorFn) {
							var ret = callIteractor(iteratorFn, c);
							for (var _i = 0; _i < ret.length; _i++) {
								cdom = mountStrategy[ret[_i].mtype](ret[_i], isSVG);
								ret[_i]._hostNode = cdom;
								hostNode.appendChild(cdom);
							}
						}
					}
			}
		}
		vnode._vChildren = transformChildren(vnode, hostNode);
	}

	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode._inst || vnode._hostNode || null;
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
	if (!Refs.currentOwner && vnode._inst) { //!Refs.currentOwner && 
		Refs.currentOwner = vnode._inst;
		vnode._inst.refs = {};
	}
	if (renderedVnode) {
		//递归遍历 深度优先
		hostNode = mountStrategy[renderedVnode.mtype](renderedVnode, isSVG);
		//既然dom diff必然需要分类一下children以方便diff  那就把这步提前 render时就执行
		renderedVnode._vChildren = transformChildren(renderedVnode, hostNode);
		renderedVnode._hostNode = hostNode;
	} else { //render 返回null
		hostNode = document.createComment('empty');
	}
	var inst = vnode._inst || null;
	if (inst && inst.componentDidMount) {
		lifeCycleQueue.push(inst.componentDidMount.bind(inst));
	}
	if (vnode.ref) {
		var ref = vnode.ref;
		var owner = Refs.currentOwner;
		var refInst = vnode._inst || vnode._hostNode || null;
		if (typeof ref === 'function') {
			lifeCycleQueue.push(ref.bind(owner, refInst));
		} else if (typeof ref === 'string') { //ref 为string
			owner.refs[ref] = refInst;
		}
	}
	return hostNode;
}
//React是根据type类型分成不同的Component各自具备各自的mount与update方法
//我们这里简化成根据type类型调用不同的方法
//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
var mountStrategy = {
	1: mountDOM, //dom
	2: mountComposite, //component
	3: mountDOM, //svg dom
	4: updateDOM,
	5: updateComposite,
	6: updateDOM,
}
//存放生命周期中的 DidMount DidUpdate以及ref回调
var lifeCycleQueue = mayQueue.lifeCycleQueue;

function buildComponentFromVnode(vnode) {
	var props = vnode.props;
	var key = vnode.key;
	var ref = vnode.ref;
	var context = vnode.context;
	var inst, renderedVnode;
	var Ctor = vnode.type;
	var mountOrder = 0;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		inst = new Ctor(props, key, ref, context);
		inst._mountOrder = mountOrder;
		mountOrder++;
		//_lifeState来控制生命周期中调用setState的作用
		//_lifeState为0 刚创建instance componentWillMount调用setState合并state即可
		inst._lifeState = 0;
		if (inst.componentWillMount) inst.componentWillMount();
		//执行完 componentWillMount _lifeState为1
		inst._lifeState = 1;
		if (inst._mergeStateQueue) {
			mergeState(inst);
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
		vnode._inst = inst;
		inst._renderedVnode = renderedVnode;
		//设定owner 用于ref绑定
		renderedVnode && (renderedVnode._refOwner = inst);
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedVnode = Ctor.call(vnode, props, context);
	}
	//添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
	vnode._renderedVnode = renderedVnode;
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

// function doRender() {
// 	return this.constructor.apply(this, arguments);
// }


export function reRender(instance) {
	var props = instance.props;
	var context = instance.context;
	var prevState = instance.state;
	var prevRenderedVnode = instance._renderedVnode;
	var hostNode = prevRenderedVnode._hostNode;
	mergeState(instance)
	// if (instance._mergeStateQueue) {
	// 	var updateState = Object.assign({}, prevState);
	// 	for (var i = 0; i < instance._mergeStateQueue.length; i++) {
	// 		updateState = Object.assign(updateState, instance._mergeStateQueue[i]);
	// 	}
	// 	instance.state = updateState;
	// }
	if (instance.shouldComponentUpdate && instance.shouldComponentUpdate(props, instance.state, context) === false) {
		return;
	}

	if (instance.componentWillUpdate) {
		instance.componentWillUpdate(props, instance.state, context);
	}

	var updatedVnode = instance.render(props, context);
	instance._renderedVnode = updatedVnode;
	if (!updatedVnode) {
		disposeVnode(prevRenderedVnode);
		disposeDom(hostNode);
		return;
	}
	if (isSameType(prevRenderedVnode, updatedVnode)) {
		updatedVnode._hostNode = hostNode;
		diffProps(prevRenderedVnode, updatedVnode);
	} else {
		var isSVG = updatedVnode.mtype === 3;
		var dom = mountStrategy[updatedVnode.mtype](updatedVnode, isSVG);
		hostNode.parentNode.replaceChild(dom, hostNode);
	}
	instance._renderedVnode._hostNode = hostNode;
	updatedVnode._vChildren = transformChildren(updatedVnode, hostNode);

	if (instance.componentDidUpdate) {
		instance.componentDidUpdate(props, instance.state, context);
	}
	var q;
	while (q = lifeCycleQueue.shift()) {
		q();
	}
}

function updateDOM(prevVnode, newVnode) {
	if (prevVnode.ref && typeof prevVnode.ref === 'function') {
		prevVnode.ref(null);
	}
	var hostNode = prevVnode._hostNode || null;
	if (!Refs.currentOwner) {
		Refs.currentOwner = hostNode;
		Refs.currentOwner.refs = {};
	}
	diffChildren(prevVnode, newVnode, hostNode);
	if (newVnode.ref) {
		lifeCycleQueue.push(newVnode.ref.bind(newVnode, newVnode));
	}
	return hostNode;
}

function updateComposite(prevVnode, newVnode) {
	if (prevVnode.ref && typeof prevVnode.ref === 'function') {
		prevVnode.ref(null);
	}
	var hostNode = prevVnode._renderedVnode._hostNode;
	var instance = prevVnode._inst;
	var isEmpty = false;
	var newDom;
	if (hostNode.nodeType === 8 && hostNode.nodeValue === 'empty') {
		//empty代表prevVnode为null
		isEmpty = true;
	}
	if (prevVnode !== newVnode) {
		if (instance.componentWillReceiProps) {
			instance.componentWillReceiProps(newVnode.props, newVnode.context);
		}
		instance.props = newVnode.props;
	}
	if (!Refs.currentOwner) {
		Refs.currentOwner = instance;
		Refs.currentOwner.refs = {};
	}
	if (instance.componentWillUpdate) {
		instance.componentWillUpdate();
	}
	var prevRenderedVnode = prevVnode._renderedVnode;
	var newRenderedVnode = instance.render();
	newVnode._renderedVnode = newRenderedVnode;
	newVnode._inst = instance;
	instance._renderedVnode = newRenderedVnode;

	if (newRenderedVnode && !isEmpty) {
		diffChildren(prevRenderedVnode, newRenderedVnode, hostNode);
	} else {
		if (isEmpty && newRenderedVnode) {
			var isSVG = newRenderedVnode.mtype === 3;
			newDom = mountStrategy[newRenderedVnode.mtype](newRenderedVnode, isSVG);
			newRenderedVnode._hostNode = newDom;
			hostNode.parentNode.replaceChild(newDom, hostNode);
		}
		disposeVnode(prevRenderedVnode);
		disposeDom(hostNode);
	}
	if (instance.componentDidUpdate) {
		lifeCycleQueue.push(instance.componentDidUpdate.bind(instance));
	}
	if (newVnode.ref) {
		lifeCycleQueue.push(newVnode.ref.bind(newVnode, newVnode));
	}
	if (newDom) {
		hostNode = newDom;
	}
	return hostNode;
}

function mayUpdate(prevVnode, newVnode, container) {
	var isSVG = newVnode.mtype === 3;
	var hostNode = prevVnode._hostNode || prevVnode._renderedVnode._hostNode;
	var dom;
	if (prevVnode.type === newVnode.type) {
		dom = mountStrategy[newVnode.mtype + 3](prevVnode, newVnode);
	} else {
		dom = mountStrategy[newVnode.mtype](newVnode, isSVG);
		container.replaceChild(dom, hostNode);
		disposeVnode(prevVnode);
		disposeDom(hostNode);
		hostNode = null;
	}
}

function diffChildren(prevVnode, updatedVnode, parent) {
	var prevChildren = prevVnode._vChildren || null;
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
						value: c
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
					if (c.type === vnode.type && !vnode._reused) {
						c._hostNode = vnode._hostNode;
						c._inst = vnode._inst;
						c._prevVnode = vnode;
						vnode._reused = true;
						c._reused = true;
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
			if (!_c[j]._reused) _unMountChildren.push(_c[j]);
		}
	}
	flushMounts(_mountChildren, parent);
	flushUnMounts(_unMountChildren);
}

function flushMounts(newChildren, parent) {

	for (var _i = 0; _i < newChildren.length; _i++) {
		var child = newChildren[_i];
		var type = typeof child.type;
		var newDom;
		switch (type) {
			case 'function':
				//如果能复用之前节点
				if (child._reused) {
					var hostNode = updateComposite(child._prevVnode, child);
				} else {
					newDom = mountStrategy[child.mtype](child);
					var node = parent.childNodes[_i];
					if (node) {
						parent.insertBefore(newDom, node);
						// insertCount++;
					} else {
						parent.appendChild(newDom);
					}
				}

				break;
			case 'string':
				var _node = parent.childNodes[_i];
				if (child._reused) {
					if (_node && _node !== child._hostNode) {
						newDom = parent.removeChild(child._hostNode);
						parent.insertBefore(newDom, _node)
					}
					if (child.type !== '#text') {
						diffProps(child._prevVnode, child);
					} else { //text
						child._hostNode.nodeValue = child.value;
					}
				} else {
					if (child.type !== '#text') {
						newDom = mountStrategy[child.mtype](child);
						child._hostNode = newDom;
						parent.insertBefore(newDom, _node);
					} else {
						newDom = document.createTextNode(child.value);
						parent.insertBefore(newDom, _node);
					}

				}

				break;

		}


	}
}

function flushUnMounts(oldChildren) {
	var c;
	while (c = oldChildren.shift()) {
		disposeVnode(c);
		c._hostNode && disposeDom(c._hostNode);
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
					var _key = genKey(c);
					if (!result[_key]) {
						result[_key] = [c];
					} else {
						result[_key].push(c);
					}
					if (c.ref) { //如果子dom有ref 标识一下 
						var owner = renderedVnode._refOwner;
						if (owner) {
							if (owner.refs) {
								owner.refs[c.ref] = c._inst || c._hostNode || null;
							} else {
								owner.refs = {};
								owner.refs[c.ref] = c._inst || c._hostNode || null;
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
					value: c
				}
				if (childList[i - noCount]) {
					tran._hostNode = childList[i - noCount];
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
	if (vnode.ref && typeof vnode.ref === 'function') {
		vnode.ref(null);
		vnode.ref = null;
	}
	if (vnode._inst) {
		if (vnode._inst.componentWillUnmount) {
			vnode._inst.componentWillUnmount();
		}
		vnode._inst.refs = null;
		vnode._inst = null;
	}
	if (vnode._renderedVnode) {
		disposeVnode(vnode._renderedVnode);
		vnode._renderedVnode = null;
	}
	if (vnode._prevVnode) {
		vnode._prevVnode = null;
	}
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

function diffProps(prev, now) {
	var prevProps = prev.props;
	var props = now.props;
	var hostNode = now._hostNode;
	for (var name in props) {
		if (name !== 'children' && !(props[name] === prevProps[name])) {
			setDomAttr(hostNode, props);
			break;
		}
	}
	for (var prop in prevProps) {
		if (prop !== 'children' && (props[prop] === void 666)) {
			removeDomAttr(hostNode, prevProps, prop);
		}
	}
	var _ref = prev.ref;
	var ref = now.ref;
	if (_ref) {
		if (typeof _ref === 'function') {
			prev.ref(null);
			prev.ref = null;
		} else {
			if (Refs.currentOwner && Refs.currentOwner.refs[_ref]) {
				Refs.currentOwner.refs[_ref] = null;
			}
		}
	}
	if (ref) {
		if (typeof ref === 'function') {
			lifeCycleQueue.push(now.ref.bind(now, now));
		}
		if (typeof ref === 'string') {
			if (Refs.currentOwner) {
				if (Refs.currentOwner.refs) {
					Refs.currentOwner.refs[ref] = hostNode;
				} else {
					Refs.currentOwner.refs = {};
					Refs.currentOwner.refs[ref] = hostNode;
				}
			}
		}
	}

	if (props['children']) {
		diffChildren(prev, now, now._hostNode);
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
			if (ref._renderedVnode && ref._renderedVnode._hostNode) {
				ret = ref._renderedVnode._hostNode;
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