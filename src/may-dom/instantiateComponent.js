import { getChildContext, getContextByTypes } from './context';
import { mergeState } from '../util';
var mountOrder = 0;
export function buildComponentFromVnode(vnode) {
    var props = vnode.props;
    var key = vnode.key;
    var ref = vnode.ref;
    var context = vnode.context;
    var inst, renderedVnode;
    var Ctor = vnode.type;
    //Component  PureComponent
    if (Ctor.prototype && Ctor.prototype.render) {
        //props, context需要放在前俩
        inst = new Ctor(props, context, key, ref);
        //constructor里面props不可变
        inst.props = props;
        if (!inst.mayInst) {
            //新建个对象存放各种信息
            inst.mayInst = {};
        }
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
        renderedVnode = inst.render(props, context);
        if (inst.getChildContext) {
            context = getChildContext(inst, context);
        }
        if (context) {
            inst.context = getContextByTypes(context, Ctor.contextTypes);
            renderedVnode && (renderedVnode.context = context);
        }
        // vnode.type === 'function' 代表其为Component Component中才能setState
        //setState会触发reRender 故保存有助于domDiff的参数
        vnode.mayInfo.instance = inst;
        inst.mayInst.rendered = renderedVnode;
        //设定owner 用于ref绑定
        renderedVnode && (renderedVnode.mayInfo.refOwner = inst);
    } else { //Stateless Function 函数式组件无需要生命周期方法 所以无需 继承 不需要= new Ctor(props, context);
        renderedVnode = Ctor.call(vnode, props, context);
        vnode.mayInfo.stateless = true;
        //should support module pattern components
        if (renderedVnode && renderedVnode.render) {
            console.warn('不推荐使用这种module-pattern component建议换成正常的Component形式,目前只支持render暂不支持其它生命周期方法')
            renderedVnode = renderedVnode.render.call(vnode, props, context);
        }
        //Stateless Component也需要向下传递context
        renderedVnode && (renderedVnode.context = context);
    }
    //添加一个指针用于删除DOM时释放其component 对象,事件,ref等占用的内存
    vnode.mayInfo.rendered = renderedVnode;
    return renderedVnode;
}