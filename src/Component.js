


export function Component(props,context){
    this.props=props;
    this.context=context;
}

Component.prototype.setState=function(state,callback){

    this._pendingState.push(state);
    
}