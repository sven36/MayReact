import {
    createElement
} from './MayElement';

export function cloneElement(element) {
    var type = element.type;
    var props = element.props;
    var config = {};
    for (const key in props) {
        if (key !== 'children') {
            config[key] = element.props[key];
        }
    }
    if (props.key) {
        config.key = props.key;
    }
    if (props.ref) {
        config.ref = props.ref;
    }
    var children = props.children;
    var ret = createElement(type, config, children);
    return ret;
}