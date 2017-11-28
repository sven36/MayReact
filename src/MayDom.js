
import { diff } from './may-dom/diff';

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
	buildRootComponentFromVnode(vnode, container, {})
}

function buildRootComponentFromVnode(vnode, container, context) {
	var props = vnode.props;
	var rendered = renderRootComponent(vnode, props, context);
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
	} else {//Stateless Function
		component.constructor = Ctor;
		component.render = doRender;
	}
	var renderedVnode = component.render(props, context);
	var nodeName = renderedVnode.type;
	var dom = document.createElement(nodeName);
	var vchildren = renderedVnode.props.children;
	var c;
	while ((c = vchildren.shift())) {
		var type = typeof c;
		var cdom;
		switch (type) {
			case 'string':
			case 'number':
				cdom = document.createTextNode(c);
				dom.appendChild(cdom);
				break;
			case 'object':
				cdom = renderChildrenComponent(c, dom);
				break;
		}
		cdom = null;
		type = null;
	}


	return dom;

}
function renderChildrenComponent(vnode, parent) {
	var vchildren = vnode.props.children || undefined;
	var vtype = typeof vnode.type;
	var vlen = vchildren ? vchildren.length : undefined;
	var c, cdom;
	switch (vtype) {
		case 'string':
		case 'number':
			cdom = document.createTextNode(c);
			parent.appendChild(cdom);
			break;
		case 'object':
			renderChildrenComponent()
			break;
		case 'function':
			buildDomFromComponent(vnode, parent)
			break;
	}

}
function buildDomFromComponent(vnode, parent) {
	var Ctor = vnode.type;
	var props = vnode.props;
	var context = vnode.context;
	var component; //= new Ctor(props, context);如果是函数式组件不需要生命周期方法所以无需 继承
	//Component  PureComponent
	if (Ctor.prototype && Ctor.prototype.render) {
		//创建一个原型指向Component的对象 不new的话需要手动绑定props的作用域
		component = new Ctor(props, context);
		if (component.componentWillMount) component.componentWillMount();
	} else {//Stateless Function 函数式组件无需要生命周期方法
		component = Ctor.call(vnode, props, context);
		// component.constructor = Ctor;
		// component.render = doRender;
	}
	var nodeName = component.type;
	var dom = document.createElement(nodeName);
	var vchildren = component.props.children;
	var c;
	while ((c = vchildren.shift())) {
		var type = typeof c;
		var cdom;
		switch (type) {
			case 'string':
			case 'number':
				cdom = document.createTextNode(c);
				dom.appendChild(cdom);
				break;
			case 'object':
				if (parent) parent.appendChild(dom);
				cdom = renderChildrenComponent(c, dom);
				break;
		}
		cdom = null;
		type = null;
	}
}
function doRender() {
	return this.constructor.apply(this, arguments);
}
