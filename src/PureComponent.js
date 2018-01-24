import {
    Component
} from './Component';
import {
    inherits
} from './util';

export function PureComponent(props, key, ref, context) {
    return Component.apply(this, arguments);
}
var fn = inherits(PureComponent, Component);
fn.shouldComponentUpdate = function (nextProps, nextState, context) {
    var a = shallowEqual(this.props, nextProps);
    var b = shallowEqual(this.state, nextState);
    return !!a || !!b;
}

function shallowEqual(now, next) {

}