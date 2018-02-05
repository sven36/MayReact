import { getIteractor, callIteractor } from './Iteractor';

//https://segmentfault.com/a/1190000010336457  司徒正美先生写的分析
//hydrate是最早出现于inferno(另一个著名的react-like框架)，并相邻的简单数据类型合并成一个字符串。
//因为在react的虚拟DOM体系中，字符串相当于一个文本节点。减少children中的个数，
//就相当减少实际生成的文本节点的数量，也减少了以后diff的数量，能有效提高性能。

//render过程中有Key的 是最有可能变动的，无Key的很可能不会变（绝大部分情况）
//把children带Key的放一起  不带Key的放一起（因为他们很可能不变化，顺序也不变减少diff寻找）
export function transformChildren(renderedVnode, parent) {
    var children = renderedVnode.props.children || null;
    if (children && !Array.isArray(children)) {
        children = [children];
    }
    var len = children ? children.length : 0;
    var childList = [].slice.call(parent.childNodes);
    var result = children ? {} : null;
    //如有undefined null 简单数据类型合并 noCount++;
    var noCount = 0;
    for (var i = 0; i < len; i++) {
        var c = children[i];
        var __type = typeof c;
        switch (__type) {
            case 'object':
                if (c.type) {
                    if (c.mayInfo.reused) {
                        //如果该组件 diff 两次 第一次vnode重用之后_reused为true
                        //生成vchildren时需要其为false 否则第二次diff
                        c.mayInfo.reused = false;
                    }
                    var _key = genKey(c);
                    if (!result[_key]) {
                        result[_key] = [c];
                    } else {
                        result[_key].push(c);
                    }
                    if (c.ref) { //如果子dom有ref 标识一下 
                        var owner = renderedVnode.mayInfo.refOwner;
                        if (owner) {
                            if (owner.refs) {
                                owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
                            } else {
                                owner.refs = {};
                                owner.refs[c.ref] = c.mayInfo.instance || c.mayInfo.hostNode || null;
                            }
                        }
                    }
                } else {
                    var iteratorFn = getIteractor(c);
                    if (iteratorFn) {
                        var ret = callIteractor(iteratorFn, c);
                        for (var _i = 0; _i < ret.length; _i++) {
                            var _key = genKey(ret[_i]);
                            if (!result[_key]) {
                                result[_key] = [ret[_i]];
                            } else {
                                result[_key].push(ret[_i]);
                            }
                        }
                    }
                }

                break;
            case 'number':
            case 'string':
                //相邻的简单数据类型合并成一个字符串
                var tran = {
                    type: '#text',
                    mtype: 4,
                    value: c,
                    mayInfo: {}
                }
                if (childList[i - noCount]) {
                    tran.mayInfo.hostNode = childList[i - noCount];
                }
                if ((i + 1 < len)) {
                    var _ntype = typeof children[i + 1 - noCount];
                    if (_ntype === 'string' || _ntype === 'number') {
                        tran.value += children[i + 1 - noCount];
                        noCount++;
                        i++;
                    }
                }
                var _k = '#text';
                if (!result[_k]) {
                    result[_k] = [tran];
                } else {
                    result[_k].push(tran);
                }
                break;
            default:
                noCount++;
                break;
        }
    }
    return result;
}
export function genKey(child) {
    return !child.key ? (child.type.name || child.type) : ('_$' + child.key);
}