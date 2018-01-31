import {
    getIteractor
} from './MayDom';
export const Children = {
    only: function (child) {
        if (child && !Array.isArray(child)) {
            return child;
        }
        if (child && child.length === 1 && child[0].mtype) {
            return child[0];
        }
        throw new Error("expect only one child");
    },
    forEach: function (children, callback, context) {
        var ret = [];
        if (!children) {
            return null;
        }
        if (Array.isArray(children)) {
            for (var i = 0; i < children.length; i++) {
                var c = children[i];
                if (c.type) {
                    ret.push(c);
                } else { //有可能是子数组iterator
                    var iteratorFn = getIteractor(c);
                    if (iteratorFn) {
                        var iterators = callIteractor(iteratorFn, c);
                        for (var _i = 0; _i < iterators.length; _i++) {
                            ret.push(iterators[_i]);
                        }
                    } else {
                        ret.push(c);
                    }
                }
            }
        } else {
            ret.push(children);
        }
        ret.forEach(callback, context);
        return ret;

    },
    map: function (children) {

    }
}