import {
	extend
} from "./util";
import {
	setDomAttr,
	eventProxy,
	removeDomAttr
} from './util';

import {
	Refs,
	RefsQueue
} from './Refs';

// import {
// 	diff
// } from './may-dom/diff';
// import {
// 	renderComponent
// } from './may-dom/component-recycle';

export function render(vnode, container, merge) {
	// return diff(merge, vnode, {}, false, container, false);
	return renderByMay(vnode, container, merge);
}
/**
 * render传入的Component都是一个function 该方法的原型对象上绑定了render方法
 * @param {*} vnode 
 * @param {*} container 
 * @param {*} callback 
 */
var renderByMay = function (vnode, container, callback) {
	var renderedVnode, rootDom;
	var lastVnode = container._lastVnode || null;
	if (lastVnode) { //update
		mayUpdate(lastVnode, vnode, container);
		// diffProps(lastVnode, vnode)
		container._lastVnode = vnode;
	} else {
		if (vnode && vnode.type) {
			//为什么React使用var markup=renderChilden();这样的形式呢; 2018-1-13
			//因为如果按renderComponentChildren(renderedVnode, rootDom, _isSvg);传入container这种
			//碰上component嵌套不好处理 参见 ReactChildReconciler-test的 warns for duplicated array keys with component stack info
			var isSVG = vnode.mtype === 3;
			rootDom = mountComponent(vnode, isSVG);
		} else {
			console.error('render参数错误');
			return;
		}
		if (container && container.appendChild && rootDom) {
			container._lastVnode = vnode;
			container.appendChild(rootDom);
			var q;
			while (q = lifeCycleQueue.shift()) {
				q();
			}

			return container;
		} else {
			throw new Error('container参数错误');
		}
	}

}

function mountDOM(vnode, isSVG) {
	var hostNode = !isSVG ? document.createElement(vnode.type) : document.createElementNS("http://www.w3.org/2000/svg", vnode.type);
	setDomAttr(hostNode, vnode.props);
	vnode._hostNode = hostNode;
	return hostNode;
}

function mountComposite(vnode, isSVG) {
	var renderedVnode = buildComponentFromVnode(vnode);
	//递归遍历 深度优先
	var hostNode = mountComponent(renderedVnode, isSVG);
	//既然dom diff必然需要分类一下children以方便diff  那就把这步提前 render时就执行
	renderedVnode._vChildren = transformChildren(renderedVnode.props.children, hostNode);
	renderedVnode._hostNode = hostNode;
	return hostNode;
}

//mountDOM vnode.type为string直接createElement 然后render children即可
//mountComposite vnode.type为function 需实例化component 再render children
var mountStrategy = {
	1: mountDOM,
	2: mountComposite,
	3: mountDOM,
}
var lifeCycleQueue = [];


function mountComponent(vnode, isSVG) {
	//React是根据type类型分成不同的Component各自具备各自的mount与update方法
	//我们这里简化成根据type类型调用不同的方法
	var hostNode = mountStrategy[vnode.mtype](vnode, isSVG);
	var children = vnode.props.children || null;
	var props = vnode.props;
	var cdom, c;
	if (children) {
		var len = children.length;
		for (let i = 0; i < len; i++) {
			var c = children[i];
			var type = typeof c;
			switch (type) {
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
						cdom = mountComponent(c, isSVG);
						c._hostNode = cdom;
						hostNode.appendChild(cdom);
					} else { //有可能是子数组iterator
						var iteratorFn = getIteractor(c);
						if (iteratorFn) {
							var ret = callIteractor(iteratorFn, c);
							for (var _i = 0; _i < ret.length; _i++) {
								cdom = mountComponent(ret[_i], isSVG);
								ret[_i]._hostNode = cdom;
								hostNode.appendChild(cdom);
							}
						}
					}
			}
		}
	}
	var inst = vnode._inst || null;
	if (inst && inst.componentDidMount) {
		lifeCycleQueue.push(inst.componentDidMount.bind(inst));
		// inst.componentDidMount();
	}
	if (vnode.ref) {
		if (typeof vnode.ref === 'function') {
			lifeCycleQueue.push(vnode.ref.bind(vnode, vnode));
		}
	}
	return hostNode;
}

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
		if (inst.componentWillMount) inst.componentWillMount();

		renderedVnode = inst.render(props, context);
		// vnode.type === 'function' 代表其为Component Component中才能setState
		//setState会触发reRender 故保存有助于domDiff的参数
		vnode._inst = inst;

	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedVnode = Ctor.call(vnode, props, context);
	}
	//添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
	vnode._renderedVnode = renderedVnode;
	return renderedVnode;
}

// function doRender() {
// 	return this.constructor.apply(this, arguments);
// }

export function reRender(component) {
	var props = component.props;
	var context = component.context;
	var prevstate = component.state;
	var prevRenderedVnode = component._renderedVnode;
	var hostNode = prevRenderedVnode._hostNode;
	if (component._mergeStateQueue) {
		var updateState = {};
		for (var i = 0; i < component._mergeStateQueue.length; i++) {
			updateState = extend(updateState, component._mergeStateQueue[i]);
		}
		component.state = updateState;
	}
	if (component.shouldComponentUpdate && component.shouldComponentUpdate(props, component.state, context) === false) {
		return;
	}
	if (component.componentWillUpdate) {
		component.componentWillUpdate(props, component.state, context);
	}

	var updatedVnode = component.render(props, context);
	component._renderedVnode = updatedVnode;

	diffChildren(prevRenderedVnode, updatedVnode, hostNode);

	if (component.componentDidUpdate) {
		component.componentDidUpdate(props, component.state, context);
	}
}

function mayUpdate(prevVnode, newVnode, container) {
	var isSVG = newVnode.mtype === 3;
	var hostNode = prevVnode._renderedVnode._hostNode;
	if (prevVnode.type === newVnode.type) {

	} else {
		var dom = mountComponent(vnode, isSVG);
		container.replaceChild(dom, hostNode);
		disposeVnode(prevVnode);
		disposeDom(hostNode);
	}
}

function diffChildren(prevVnode, updatedVnode, parent) {
	// var childList = [].slice.call(parent.childNodes);
	// var newChildren = transformChildren(updatedVnode.props.children);
	// updatedVnode._vChildren = newChildren;
	var prevChildren = prevVnode._vChildren || null;
	var newRenderedChild = updatedVnode.props.children;
	//diff之前 遍历prevchildren 与newChildren 如有相同key的只对其props diff
	var _mountChildren = [];
	var _unMountChildren = [];
	var k, prevK, _prevK, _tran;
	for (var i = 0; i < newRenderedChild.length; i++) {
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
				if ((i + 1 < newRenderedChild.length) && (typeof newRenderedChild[i + 1] === 'string')) {
					c.value += newRenderedChild[i + 1];
					i++;
				}
				break;
			case 'undefined':
				break;
		}
		prevK = prevChildren[k];
		if (prevK && prevK.length > 0) { //试试=0 else
			for (var _i = 0; _i < prevK.length; _i++) {
				var vnode = prevK[_i];
				if (c.type === vnode.type && !vnode._reused) {
					c._hostNode = vnode._hostNode;
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
	for (var name in prevChildren) {
		var _c = prevChildren[name];
		for (let j = 0; j < _c.length; j++) {
			if (!_c[j]._reused) _unMountChildren.push(_c[j]);
		}
	}
	flushUnMounts(_unMountChildren);
	flushMounts(_mountChildren, parent);

}

function flushMounts(newChildren, parent) {
	// var childList = [].slice.call(parent.childNodes);
	// var len = childList.length;
	//如果添加节点之后 children len 会增长 insertCount+1 让其插入位置正确
	// var insertCount = 0;
	for (var _i = 0; _i < newChildren.length; _i++) {
		var child = newChildren[_i];
		var type = typeof child.type;
		var newDom;
		switch (type) {
			case 'function':
				var renderedVnode = buildComponentFromVnode(child);
				//如果能复用之前节点
				if (child._reused) {
					var node = parent.childNodes[_i];
					renderedVnode._hostNode = child._hostNode;
					diffProps(child._prevVnode._renderedVnode, renderedVnode);
					if (node) {
						if (node !== child._hostNode) {
							newDom = parent.removeChild(child._hostNode);
							parent.insertBefore(newDom, parent.childNodes[_i])
						}
					} else {
						newDom = child._hostNode;
						parent.appendChild(newDom);
					}
				} else {
					newDom = mountComponent(renderedVnode);
					renderedVnode._vChildren = transformChildren(renderedVnode.props.children, newDom);
					renderedVnode._hostNode = newDom;
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
				if (child.type !== '#text') {
					if (child._reused) {
						diffProps(child._prevVnode, child);
					} else {
						newDom = mountComponent(child);
						child._hostNode = newDom;
						parent.insertBefore(newDom, parent.childNodes[_i]);
					}
				} else {
					if (child._reused) {
						var node = parent.childNodes[_i];
						if (node && node.nodeName.toLowerCase() !== child.type) {
							newDom = parent.removeChild(child._hostNode);
							parent.insertBefore(newDom, parent.childNodes[_i])
						}
						child._hostNode.nodeValue = child.value;
					}
				}
				break;

		}


	}
}

function flushUnMounts(oldChildren) {
	for (var i = 0; i < oldChildren.length; i++) {
		var c = oldChildren[i];
		disposeVnode(c);
		c._hostNode && disposeDom(c._hostNode);
	}
}

//https://segmentfault.com/a/1190000010336457  司徒正美先生写的分析
//hydrate是最早出现于inferno(另一个著名的react-like框架)，并相邻的简单数据类型合并成一个字符串。
//因为在react的虚拟DOM体系中，字符串相当于一个文本节点。减少children中的个数，
//就相当减少实际生成的文本节点的数量，也减少了以后diff的数量，能有效提高性能。

//render过程中有Key的 是最有可能变动的，无Key的很可能不会变（绝大部分情况）
//把children带Key的放一起  不带Key的放一起（因为他们很可能不变化，顺序也不变减少diff寻找）
function transformChildren(children, parent) {
	var len = children && children.length;
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
				if ((i + 1 < len) && (typeof children[i + 1 - noCount] === 'string')) {
					tran.value += children[i + 1 - noCount];
					noCount++;
					i++;
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
	if (vnode._renderedVnode) {
		vnode._renderedVnode = null;
		if (vnode._inst && vnode._inst.componentWillUnmount) {
			vnode._inst.componentWillUnmount();
		}
		vnode._inst = null;
		vnode = null;
	}
}

function disposeDom(dom) {
	if (dom._listener) {
		for (const key in dom._listener) {
			dom.removeEventListener(key, eventProxy);
		}
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
	for (var prev in prevProps) {
		if (prev !== 'children' && (props[prev] === void 666)) {
			removeDomAttr(hostNode, prevProps, prev);
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
	if (lastVnode) {
		disposeVnode(lastVnode);
		emptyElement(dom);
		dom._lastVnode = null;
	}
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

/**
 * //如果看不懂递归渲染节点  最好自己从根节点开始写 慢慢迭代 抽出公共方法
 * @param {Component} Ctor //Component构造函数   Component原型对象绑定了传入的render,componentWillMount,onClick等方法
 * @param {*} props 
 * @param {*} context 

function renderRootComponent(vnode, props, context) {
	var Ctor = vnode.type;
	var constructor;
	var component = new Ctor(props, context);
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		if (component.componentWillMount) component.componentWillMount();
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		component.constructor = Ctor;
		component.render = doRender;
	}
	var renderedVnode = component.render(props, context);
	var nodeName = renderedVnode.type;
	var rootDom = document.createElement(nodeName);
	//递归子节点 添加到container
	var vchildren = renderedVnode.props.children;
	var c;
	while ((c = vchildren.shift())) {
		var cdom;
		if(c&&c.type&&(typeof c.type==='function')){
			var renderedComponent=buildComponentFromVnode(c);
			cdom=document.createElement(renderedComponent.type);
			renderComponentChildren(renderedComponent,cdom);
			rootDom.appendChild(cdom);
		}
		var type = typeof c;
		switch (type) {
			case 'string'://string子节点
			case 'number':
				cdom = document.createTextNode(c);
				rootDom.appendChild(cdom);
				break;
			case 'object'://vnode 子节点
				//cdom = buildDomFromVnode(c, rootDom);
				break;
		}
		cdom = null;
		type = null;
	}

	return rootDom;
} */