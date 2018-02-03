import {
    createElement
} from './MayElement';

export function cloneElement(element, additionalProps) {
    var type = element.type;
    var props = element.props;
    var mergeProps = {};
    Object.assign(mergeProps, props, additionalProps);

    var config = {};
    if (element.key) {
        config.key = element.key;
    }
    if (element.ref) {
        config.ref = element.ref;
    }
    for (const key in mergeProps) {
        if (key !== 'children') {
            config[key] = mergeProps[key];
        }
    }
    var children = mergeProps.children;
    var ret = createElement(type, config, children);
    return ret;
}