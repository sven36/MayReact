import {
  createElement
} from '../src/May';
import {
  Component
} from '../src/Component';
import { render } from '../src/MayDom'
var React = {
  createElement: createElement
}

describe('may.js', () => {

  it('createElement', () => {
    var el = createElement("p", null, 'sst');
    expect(el.type).toBe("p");
    expect(typeof el.props.children).toBe("string");
    expect(el.props.children.length).toBe(3);
  });

  it('component', () => {
    class C1 extends Component {
      render() {
        return <div>C1</div>;
      }
    }
    expect(C1.prototype.render).toHaveBeenCalled;
    var container = document.createElement('div');
    document.body.appendChild(container);
    render(<C1 />, container);
  });
  /*it('mayRender', () => {
    spyOn(console, 'error');
    var container = document.createElement('div');
    class Child extends Component {
      render() {
        return <div> {this.props.key}  {this.props.val} </div>;
      }
    }
    class Parent extends Component {
      render() {
        return (
          <div>
            666
            <Child key="0" val="1" />
            <Child key="1" val="2"  />
            <Child key="2" val="3"  />
          </div>
        );
      }
    }
    render(<Parent />, container);
    document.body.appendChild(container);
    expect(console.error.calls.count()).toBe(0);
  });*/


})