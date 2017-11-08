
export function createElement(type,props,children) {

    var element = {

    }
    element.type = type;
    extend(element.props, props)
    if (arguments.length > 2) {
        var args=[].slice.call(arguments);
        while(){
            
        }
    }else{
        element.children=children;
    }
    return element;
}

function extend(target, src) {
    for (var key in src) {
        target[key] = src[key];
    }

}