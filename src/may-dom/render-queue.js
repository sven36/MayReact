import { reRender } from '../MayDom'
export var dirtyComponents=[];

export function flushUpdates(queue) {
    if(!queue){
        queue=dirtyComponents;
        var c;
        while(c=dirtyComponents.pop()){
            reRender(c);
        }
    }
    
}