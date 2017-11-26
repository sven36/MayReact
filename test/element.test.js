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
  });
  it('mayRender', () => {
    spyOn(console, 'error');
    var container = document.createElement('div');
    class Child extends Component {
      render() {
        return <div> {this.props.key} </div>;
      }
    }
    class Parent extends Component {
      render() {
        return (
          <div>
            <Child key="0" />
            <Child key="1" />
            <Child key="2" />
          </div>
        );
      }
    }
    render(<Parent />, container);
    expect(console.error.calls.count()).toBe(0);
  });


})