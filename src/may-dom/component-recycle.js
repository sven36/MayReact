import { Component } from '../Component';

import {extend} from './render-utils';

import {diff,recollectNodeTree, diffLevel,flushMounts,mounts} from './diff';



const components = {};
// render modes

export const NO_RENDER = 0;
export const SYNC_RENDER = 1;
export const FORCE_RENDER = 2;
export const ASYNC_RENDER = 3;


export function createComponent(Ctor, props, context) {
    var list = components[Ctor.name];
    var inst;
    if (Ctor.prototype && Ctor.prototype.render) {
        inst = new Ctor(props, context);
        Component.call(inst, props, context);
    } else {
        inst = new Component(props, context);
        inst.constructor = Ctor;
        inst.render = doRender;
    }
    if (list) {
        for (let i = list.length; i--;) {
            if (list[i].constructor == Ctor) {
                list.nextBase = list[i].nextBase;
                list.splice(i, 1);
                break;
            }
        }
    }
    return inst;
}
function doRender(props, state, context) {
    return this.constructor(props, context);
}
/**
 * 
 * @param {*} dom 
 * @param {*} vnode 
 * @param {*} context 
 * @param {*} mountAll 
 */
export function buildComponentFromVNode(dom, vnode, context, mountAll) {
    var c = dom && dom._component;
    var originalComponent = c;
    var oldDom = dom;
    var isDirectOwner = c && dom._componentConstructor === vnode.type;
    var isOwner = isDirectOwner;
    var props = vnode.props;//getNodeProps(vnode);
    while (c && isOwner && (c = c._parentComponent)) {
        isOwner = c.constructor === vnode.type;
    }
    if (c && isOwner && (!mountAll || c._component)) {

    } else {
        if (originalComponent && !isDirectOwner) {
            //unmountComponent
        }
    }
    c = createComponent(vnode.type, props, context);
    if (dom && c.nextBase) {
        c.nextBase = dom;
        oldDom = null;
    }
    setCompontProps(c,props,SYNC_RENDER,context,mountAll);
    dom=c.base;
    if(oldDom&&dom!=oldDom){
        oldDom._component=null;
        recollectNodeTree(oldDom,false);
    }
    return dom;

}
export function setCompontProps(component, props, opts, context, mountAll) {
    if (component._disable) return;
    component._disable = true;
    if (component.__ref = props.ref) delete props.ref;
    if (component.__key = props.key) delete props.key;

    if (!component.base || mountAll) {
        if (component.componentWillMount) component.componentWillMount
    } else if (component.componentWillReceiveProps) {
        component.componentWillReceiveProps(props, context);
    }
    if (!component.prevProps) component.prevProps = component.props;
    component.props = props;
    component._disable = false;

    if (opts !== NO_RENDER) {
        if (opts === SYNC_RENDER || !component.base) {
            renderComponent(component, SYNC_RENDER, mountAll);
        } else {
            // enqueueRender(component);
        }
    }

    if (component.__ref) component.__ref(component);

}

export function renderComponent(component, opts, mountAll, isChild) {
    if (component._disable) return;
    var props = component.props;
    var state = component.state;
    var context = component.context;
    var prevProps = component.prevProps || props;
    var prevState = component.prevState || state;
    var prevContext = component.prevContext || context;
    var isUpdate = component.base;
    var nextBase = component.nextBase;
    var initialBase = isUpdate || nextBase;
    var initialChildComponent=component._component;
    var skip=false;
    var rendered,inst,cbase;

    if(isUpdate){
        component.props=prevProps;
        component.state=prevState;
        component.context=prevContext;
        if(opts!==FORCE_RENDER&&component.shouldComponentUpdate&&component.shouldComponentUpdate(props,state,context)===false){
            skip=true;
        }else if(component.componentWillUpdate){
            component.componentWillUpdate(props,state,context);
        }
        component.props=props;
        component.state=state;
        component.context=context;
    }
    component.prevProps=component.prevState=component.prevContext=component.nextBase=null;
    component._dirty=false;
    if(!skip){
        rendered=component.render(props,state,context);
        if(component.getChildContext){
            context=extend(extend({},context),component.getChildContext());
        }
        var childComponent=rendered&&rendered.type;
        var toUnmount,base;
        if (typeof childComponent==='function') {
            var childProps=rendered.props;//getNodeProps(component);
            inst=initialChildComponent;
            if (inst&&inst.constructor===childComponent&&rendered.key==inst.__key) {
                setCompontProps(inst,childProps,SYNC_RENDER,context,false);
            }else{
                toUnmout=inst;
                component._component=inst=createComponent(childComponent,childProps,context);
                inst.nextBase=inst.nextBase||nextBase;
                inst._parentComponent=component;
                setCompontProps(inst,childProps,NO_RENDER,context,false);
                renderComponent(inst,SYNC_RENDER,mountAll,true);

            }
            base=inst.base;
        }else{
            cbase=initialBase;
            // destroy high order component link
            toUnmount = initialChildComponent;
            if (toUnmount) {
                cbase=component._component=null;
            }
            if (initialBase||opts===SYNC_RENDER) {
                if(cbase) cbase._component=null;
                base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
            }
        }

        if(initialBase&&base!==initialBase&&inst!==initialChildComponent){
            var baseParent=initialBase.parentNode;
            if(baseParent&&base!==baseParent){
                baseParent.replaceChild(base,initialBase);

                if(!toUnmount){
                    initialBase._component=null;
                    recollectNodeTree(initialBase,false);
                }
            }
        }
        if(toUnmount){
            // unmountComponent(toUnmount);
        }
        component.base=base;
        if(base&&!isChild){
            var componentRef=component;
            var t=component;
            while(t=t._parentComponent){
                (componentRef=t).base=base;
            }
            base._component=componentRef;
            base._componentConstructor=componentRef.constructor;
        }
    }

    if(!isUpdate||mountAll){
        mounts.unshift(component);
    }else if(!skip){
        if(component.componentDidUpdate){
            component.componentDidUpdate(prevProps,prevState,prevContext);
        }
        // if(Option.afterUpdate) opts
    }
    if(component._renderCallbacks!=null){
        while(component._renderCallbacks.length) component._renderCallbacks.pop().call(component);
    }
    if(!diffLevel && !isChild) flushMounts();

}
