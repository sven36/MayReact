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
	var renderedComponent, rootDom;
	if (vnode && vnode.type) {
		if (typeof vnode.type === 'function') {
			renderedComponent = buildComponentFromVnode(vnode);
			rootDom = document.createElement(renderedComponent.type);
			renderComponentChildren(renderedComponent, rootDom);
		} else if (typeof vnode.type === 'string') {
			rootDom = document.createElement(vnode.type)
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
				case 'object'://vnode
					if (typeof c.type === 'string') {
						cdom = document.createElement(c.type);
						renderComponentChildren(c, cdom);
					} else {
						//component  vnode.type 为function
						var renderedComponent = buildComponentFromVnode(c);
						cdom = document.createElement(renderedComponent.type);
						renderComponentChildren(renderedComponent, cdom);
					}
					parent.appendChild(cdom);
				case 'undefined':
					break;
			}
		}
	}
	if (component.componentDidMount) component.componentDidMount();
}

function buildComponentFromVnode(vnode) {
	var props = vnode.props;
	var key = vnode.key;
	var ref = vnode.ref;
	var context = vnode.context;
	var component, renderedComponent;
	var Ctor = vnode.type;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		component = new Ctor(props, key, ref, context);
		if (component.componentWillMount) component.componentWillMount();
		renderedComponent = component.render(props, context);
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		renderedComponent = Ctor.call(vnode, props, context);
	}
	return renderedComponent;
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
		if (key !== 'children' && key !== 'className' &&key!=='key') {
			if(key.indexOf('on')!==0){
				dom.setAttribute(key, props[key]);
			}else{
				var e=key.substring(2).toLowerCase();
				dom.addEventListener(e,eventProxy);
				(dom._listener||(dom._listener={}))[e]=props[key];
			}
		}
	}
	if(props['className']){
		dom.setAttribute('class', props['className']);
	}
	
	// var currentVal = dom.getAttribute(name);

}
function eventProxy(e) {
	return this._listener[e.type](e);
}
export function reRender(component) {
	var props=component.props;
	var state=component.state;
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


