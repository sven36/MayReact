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
    forEach:function (children) {
        
    }
}