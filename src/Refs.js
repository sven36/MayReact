
export var Refs = {
    //当子component含有ref的时候,需要把对应的instance或dom添加到 父component的refs属性中
    //如果在mountComponent中做这样的操作需要每一层都要添加owner 放在外面更好些;
    currentOwner: null,
}
