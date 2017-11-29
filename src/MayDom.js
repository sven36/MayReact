import {
	diff
} from './may-dom/diff';

export function render(vnode, container, merge) {
	// return diff(merge, vnode, {}, false, container, false);
	return renderByMay(vnode, container, merge);
}
/*
    var C1 = function (_Component) {
        _inherits(C1, _Component);

        function C1() {
            _classCallCheck(this, C1);

            return _possibleConstructorReturn(this, (C1.__proto__ || Object.getPrototypeOf(C1)).apply(this, arguments));
      }

      _createClass(C1, [{
          key: 'render',
          value: function render() {
          return React.createElement(
            'div',
            null,
            'C1',
            React.createElement(C2, null)
          );
        }
      }]);

      return C1;
    }(__WEBPACK_IMPORTED_MODULE_1__src_Component__["a"]); //Component

    var C2 = function C2(t) {
        console.log(t);
          return React.createElement(
            'div',
            null,
            'C2'
          );
    }('sd');*/
/**
 * render传入的都是一个function 该方法的原型对象上绑定了render方法
 * @param {*} vnode 
 * @param {*} container 
 * @param {*} callback 
 */
var renderByMay = function (vnode, container, callback) {
	var props = vnode.props;
	var rendered = renderRootComponent(vnode, props, {});
	container.appendChild(rendered);
}

/**
 * 
 * @param {Component} Ctor //Component构造函数   Component原型对象绑定了传入的render,componentWillMount,onClick等方法
 * @param {*} props 
 * @param {*} context 
 */
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

		if(c&&c.type&&(typeof c.type==='function')){
			var component=buildComponentFromVNode(c);
			cdom=document.createElement(component.type);
			renderComponentChildren(component,cdom);
		}
		var type = typeof c;
		var cdom;
		switch (type) {
			case 'string'://string子节点
			case 'number':
				cdom = document.createTextNode(c);
				dom.appendChild(cdom);
				break;
			case 'object'://vnode 子节点

				cdom = buildDomFromVnode(c, rootDom);
				break;
		}
		cdom = null;
		type = null;
	}

	return rootDom;
}

function renderComponentChildren(component, parent) {
	var children = component.props.children || undefined;
	var len = children ? children.length : 0;
	var cdom;
	for (const c in children) {
		if(c&&!c.type){
			cdom=document.createTextNode(c);
			parent.appendChild(cdom);
		}else if(typeof c.type==='string'){
			cdom=document.createElement(c.type);
			renderComponentChildren(c,cdom);
		}else{//component
			buildComponentFromVNode(c,parent);
		}

	}

}

function buildComponentFromVnode(vnode, parent) {
	var props = vnode.props;
	var context = vnode.context;
	var component, nodeName;
	var Ctor = vnode.type;
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		component = new Ctor(props, context);
		if (component.componentWillMount) component.componentWillMount();
	} else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
		component = Ctor.call(vnode, props, context);
		// component.constructor = Ctor;
		// component.render = doRender;
	}
	return component;
	// nodeName = component.type;
	// var dom = document.createElement(nodeName);
	// var vchildren = component.props.children;
	// var c;
	// while ((c = vchildren.shift())) {
	// 	var type = typeof c;
	// 	var cdom;
	// 	switch (type) {
	// 		case 'string':
	// 		case 'number':
	// 			cdom = document.createTextNode(c);
	// 			dom.appendChild(cdom);
	// 			break;
	// 		case 'object':
	// 			if (parent) parent.appendChild(dom);
	// 			cdom = renderChildrenComponent(c, dom);
	// 			break;
	// 	}
	// 	cdom = null;
	// 	type = null;
	// }




}

function doRender() {
	return this.constructor.apply(this, arguments);
}