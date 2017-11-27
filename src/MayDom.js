
import { buildComponentFromVNode } from './may-dom/component-recycle';
import {diff} from './may-dom/diff';

export function render(vnode, container, merge) {
    // return diff(merge, vnode, {}, false, container, false);
    return renderByMay(vnode,container,merge);
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

    var C2 = function C2() {
        return React.createElement(
          'div',
          null,
          'C2'
        );
      };*/
/**
 * render传入的都是一个function 该方法的原型对象上绑定了render方法
 * @param {*} vnode 
 * @param {*} container 
 * @param {*} callback 
 */
var renderByMay = function (vnode, container, callback) {

}
