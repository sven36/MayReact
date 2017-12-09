import {
	extend,
	isSameNodeType
} from "./may-dom/render-utils";

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

	if (vnode && vnode.type) {
		if (typeof vnode.type === 'function') {
			renderedVnode = buildComponentFromVnode(vnode);
			rootDom = document.createElement(renderedVnode.type);
			renderComponentChildren(renderedVnode, rootDom);
			renderedVnode._component._updater && (renderedVnode._component._updater._hostNode = rootDom);
		} else if (typeof vnode.type === 'string') {
			rootDom = document.createElement(vnode.type);
			renderComponentChildren(vnode, rootDom);
		}
	} else {
		console.error('render参数错误');
		return;
	}
	if (container && container.appendChild && rootDom) {
		container.appendChild(rootDom);
	} else {
		throw new Error('container参数错误');
	}
}



function renderComponentChildren(component, parent) {
	//component实例化的DOM setState需要知道其真实DOM 然后diff其children
	// component._hostNode = parent;

	var children = component.props.children || undefined;
	var props = component.props;
	setDomAttr(parent, props);
	var cdom, c;
	if (children) {
		for (let i = 0; i < children.length; i++) {
			var c = children[i];
			var type = typeof c;
			switch (type) {
				case 'string':
					cdom = document.createTextNode(c);
					parent.appendChild(cdom);
					break;
				case 'object': //vnode
					if (typeof c.type === 'string') {
						cdom = document.createElement(c.type);
						c._hostNode = cdom;
						renderComponentChildren(c, cdom);
					} else {
						//component  vnode.type 为function
						var renderedVnode = buildComponentFromVnode(c);
						cdom = document.createElement(renderedVnode.type);
						renderComponentChildren(renderedVnode, cdom);
						renderedVnode._component._updater && (renderedVnode._component._updater._hostNode = cdom);
					}
					parent.appendChild(cdom);
				case 'undefined':
					break;
			}
		}
	}
	if (component.componentDidMount) component.componentDidMount();
}
//给可能含有setState方法的Child 添加Key
export var _internalObj = {
	mayKeyUid: 0,
	maybe: false
}

function buildComponentFromVnode(vnode) {
	var props = vnode.props;
	var key = vnode.key;
	var ref = vnode.ref;
	var context = vnode.context;
	var component, renderedVnode;
	var Ctor = vnode.type;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		component = new Ctor(props, key, ref, context);
		if (component.state) {
			//如果该component 含有初始化的state 则其很有可能绑定setState方法
			//为了方便diff 对其未设置Key的child 设置一个Key
			_internalObj.maybe = true;
		}

		if (component.componentWillMount) component.componentWillMount();

		renderedVnode = component.render(props, context);
		//只对可能含有setState方法的component设置
		_internalObj.maybe = false;

		//后加 vnode.type === 'function' 代表其为Component Component中才能setState
		//setState会触发reRender 故只需对Comonent添加一个updater 保存有助于domDiff的参数
		component._updater = {};
		component._updater.renderedVnode = renderedVnode;
		renderedVnode._component = component;
		//
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedVnode = Ctor.call(vnode, props, context);
	}
	//添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
	vnode._renderedVnode = renderedVnode;
	return renderedVnode;
}

function doRender() {
	return this.constructor.apply(this, arguments);
}

function setDomAttr(dom, props) {
	var nodeType = dom.nodeType;
	// Don't get/set attributes on text, comment and attribute nodes
	if (nodeType === 3 || nodeType === 8 || nodeType === 2) {
		return;
	}
	for (const key in props) {
		if (key !== 'children' && key !== 'className' && key !== 'key') {
			if (key.indexOf('on') !== 0) {
				if (dom.nodeName !== 'INPUT' && key !== 'value') {
					dom.setAttribute(key, props[key]);
				} else { //input value setAttribute会失败 故直接赋值
					dom[key] = props[key];
				}
			} else {
				var e = key.substring(2).toLowerCase();
				dom.addEventListener(e, eventProxy);
				(dom._listener || (dom._listener = {}))[e] = props[key];
			}
		}
	}
	if (props['className']) {
		dom.setAttribute('class', props['className']);
	}

	// var currentVal = dom.getAttribute(name);

}

function eventProxy(e) {
	return this._listener[e.type](e);
}
export function reRender(component) {
	var props = component.props;
	var context = component.context;
	var prevstate = component.state;
	var prevRenderedVnode = component._updater.renderedVnode;
	var hostNode = component._updater._hostNode;
	var updateState = {};
	for (var i = 0; i < component._mergeStateQueue.length; i++) {
		updateState = extend(updateState, component._mergeStateQueue[i]);
	}
	component.state = updateState;
	if (component.shouldComponentUpdate && component.shouldComponentUpdate(props, component.state, context) == false) {
		return;
	}
	if (component.componentWillUpdate) {
		component.componentWillUpdate(props, component.state, context);
	}

	var updatedVnode = component.render(props, context);
	component._updater.renderedVnode = updatedVnode;

	mayDiff(prevRenderedVnode, updatedVnode, hostNode);

}

function mayDiff(prevVnode, updatedVnode, parent) {
	var keyStore = {};
	var childNodes = parent.childNodes;

	if (!prevVnode._transformedChildren && prevVnode.props.children) {
		var _tran = transformChildren(prevVnode.props.children, keyStore)
		prevVnode._transformedChildren = _tran;
		_tran = null;
	}

	var _tranNew = transformChildren(updatedVnode.props.children);

	for (var i = 0; i < _tranNew.length; i++) {
		var c = _tranNew[i];
		var key = c.key;
		if (keyStore[key]) {
			c.prevProps = keyStore[key].props;
			if (keyStore[key]._hostNode) {
				c._hostNode = _hostNode;
			}
		}

	}

	//diff之前 遍历之前的children 与newChildren 如有相同key的只对其props diff
	//有移动的dom标识
	var _diffPrevChildren = [];

	for (let _i = 0; _i < newChildren.length; _i++) {
		var child = newChildren[_i];
		var type = typeof child;
		var newDom;
		switch (type) {
			case 'object':
				if (isSameType(prevChildren[_i], newChildren[_i])) {
					diffProps(prevChildren[_i], newChildren[_i]);
				} else {
					var _type = typeof child.type;
					switch (_type) {
						case 'string':
							newDom = document.createElement(_type);
							renderComponentChildren(child, newDom)
							break;
						case 'function':
							var renderedVnode = buildComponentFromVnode(child);
							newDom = document.createElement(renderedVnode.type);
							renderComponentChildren(renderedVnode, newDom);
							break;
					}
					disposeVnode(prevChildren[_i]);
					disposeDom(childNodes[_i]);
					parent.replaceChild(newDom, childNodes[_i]);
				}
				break;
			case 'string':
				if (prevChildren[_i] !== newChildren[_i]) {
					childNodes[_i].nodeValue = newChildren[_i];
				}
				break;

		}


	}

}
//https://segmentfault.com/a/1190000010336457  司徒正美大大写的分析
//hydrate是最早出现于inferno(另一个著名的react-like框架)，并相邻的简单数据类型合并成一个字符串。
//因为在react的虚拟DOM体系中，字符串相当于一个文本节点。减少children中的个数，
//就相当减少实际生成的文本节点的数量，也减少了以后diff的数量，能有效提高性能。
function transformChildren(children, keyStore) {
	var len = children.length;
	var result = new Array(len);
	for (var i = 0; i < len; i++) {
		var c = children[i];
		var __type = typeof c;
		switch (__type) {
			case 'object':
				result[i] = c;
				break;
			case 'number':
			case 'string':
				//都变成obj 否则dom diff时再if else 运算量更大
				var tran = {
					type: '#text',
					value: c
				}
				result[i] = tran;
				break;
		}

	}
	return result;
}

function disposeVnode(vnode) {
	if (vnode._renderedVnode) {
		if (vnode._renderedVnode.component) {
			vnode._renderedVnode.component = null;
		}
		vnode._renderedVnode = null;
		vnode = null;
	}
}

function disposeDom(dom) {
	if (dom._listener) {
		for (const key in dom._listener) {
			dom.removeEventListener(key, eventProxy);
		}
	}
}

function diffProps(prev, now) {
	var prevProps = prev.props;
	var props = now.props;
	now._hostNode = prev._hostNode;
	for (var name in props) {
		if (!(props[name] === prevProps[name])) {
			setDomAttr(now._hostNode, props);
			return;
		}
	}
}

function genKey(child) {
	return child.key || child.type;
}

function isSameType(prev, now) {
	return prev.type === now.type && prev.key === now.key;
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