import React from "../../src/May";
var cloneElement=React.cloneElement;
describe("cloneElement", function () {
    it("test", () => {
        var a = {
            type: "div",
            props: {
                v: 1,
                children: []
            }
        };
        expect(cloneElement(a).props.v).toBe(1);
    });

    it("array", () => {
        var a =  {
            type: "div",
            props: {
                v: 2,
                children: []
            }
        };
 
        expect(cloneElement(a).props.v).toBe(2);
    });
    it("should transfer the key property", ()=> {
        class Component extends React.Component{
            render() {
                return null;
            }
        }
        var clone = cloneElement(<Component />, {key: "xyz"});
        expect(clone.key).toBe("xyz");
    });
    it("children", () => {
        function A() { }
        var b = React.cloneElement({
            type: A,
            vtype: 2,
            props: {}
        }, {
            children: [111, 222],
            onChange: function () { },
            key: "tabContent"
        });
        expect(b.props.children.length).toBe(2);
    });
});
