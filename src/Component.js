import {reRender} from './MayDom';


export function Component(props,key,ref,context){
    this.props=props;
    this.key=key;
    this.ref=ref;
    this.context=context;
}

Component.prototype.setState=function(state,callback){
    this._dirty=true;
    this._updateState=state;
    reRender(this);
    // this._pendingState.push(state);
    
}