/**
 * 如果instance具备getChildContext方法 则调用
 * @param {component实例} instance 
 * @param {当前上下文} context 
 */
export function getChildContext(instance, context) {
    var prevProps = instance.props;
    if (instance.nextProps) {
        instance.props = instance.nextProps;
    }
    var getContext = instance.getChildContext();
    if (instance.nextProps) {
        instance.props = prevProps;
    }
    if (getContext && typeof getContext === 'object') {
        if (!context) {
            context = {};
        }
        context = Object.assign(context, getContext);
    }
    return context;
}
export function getContextByTypes(context, typeCheck) {
    var ret = {};
    if (!context || !typeCheck) {
        return ret;
    }
    for (const key in typeCheck) {
        if (context.hasOwnProperty(key)) {
            ret[key] = context[key];
        }
    }
    return ret;
}