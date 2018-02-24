import {
    getChildContext,
    getContextByTypes
} from './context';
import {
    mergeState
} from '../util';
var mountOrder = 0;
export function buildComponentFromVnode(vnode) {
    var props = vnode.props;
    var key = vnode.key;
    var ref = vnode.ref;
    var context = vnode.context;
    var inst, rendered;
    var Ctor = vnode.type;
    //Component  PureComponent
    if (Ctor.prototype && Ctor.prototype.render) {
        //props, context需要放在前俩
        inst = new Ctor(props, context, key, ref);
        //constructor里面props不可变
        inst.props = props;
        inst.refType = vnode.refType;
        inst.mayInst.mountOrder = mountOrder;
        mountOrder++;
        //_lifeState来控制生命周期中调用setState的作用
        //为0代表刚创建完component实例 (diff之后也会重置为0)
        inst.mayInst.lifeState = 0;

        if (inst.componentWillMount) {
            //此时如果在componentWillMount调用setState合并state即可
            //为1代表componentWillMount
            inst.mayInst.lifeState = 1;
            inst.componentWillMount();
        }
        if (inst.mayInst.mergeStateQueue) {
            inst.state = mergeState(inst);
        }
        //为2代表开始render
        //children 初次render的生命周期render DidMount
        //调用父组件的setState 都放在父组件的下一周期;
        inst.mayInst.lifeState = 2;
        rendered = inst.render(props, context);
        if (inst.getChildContext) {
            context = getChildContext(inst, context);
        }
        if (vnode.getContext) {
            inst.context = getContextByTypes(context, Ctor.contextTypes);
        }
        rendered && (rendered.mayInfo.refOwner = inst);
    } else {
        //StatelessComponent 我们赋给它一个inst 省去之后判断inst是否为空等;
        inst = {
            mayInst: {
                stateless: true
            },
            render: function (type) {
                return type(this.props, this.context);
            }
        }
        rendered = inst.render.call(vnode, Ctor);
        //should support module pattern components
        if (rendered && rendered.render) {
            console.warn('不推荐使用这种module-pattern component建议换成正常的Component形式,目前只支持render暂不支持其它生命周期方法')
            rendered = rendered.render.call(vnode, props, context);
        }
    }
    if (rendered) {
        //需要向下传递context
        rendered.context = context;
    }
    vnode.mayInfo.instance = inst;
    inst.mayInst.rendered = rendered;
    return rendered;
}