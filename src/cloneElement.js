import {
    createElement
} from './MayElement';

export function cloneElement(element, additionalProps) {
    var type = element.type;
    var props = element.props;
    if (additionalProps) {
        props = Object.assign(props, additionalProps);
    }
    var config = {};
    for (const key in props) {
        if (key !== 'children') {
            config[key] = element.props[key];
        }
    }
    // if (props.key) {
    //     config.key = props.key;
    // }
    // if (props.ref) {
    //     config.ref = props.ref;
    // }
    var children = props.children;
    var ret = createElement(type, config, children);
    return ret;
}