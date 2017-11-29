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
    expect(el.props.children.length).toBe(1);
  });

  it('component', () => {

    class C1 extends Component {

      bindClick(params) {
        console.log('clicked');
        this.setState({
          orgInfo: {},
          isMemberPackage: false
      })
      }
      componentWillMount(){
        console.log('willMount');
      }

      render() {
        return <div onClick={this.bindClick}><span>333</span>C1<C2 />{this.props.val}</div>;
      }
    }
    const C2=()=>{
      return <div>C2<C3 /></div>;
    }
    const C3=()=>{
      return <div>C3</div>;
    }
    expect(C1.prototype.render).toHaveBeenCalled;
    var container = document.createElement('div');
    document.body.appendChild(container);
    render(<C1 val={"233"} />, container);
  });
  it('mayRender', () => {
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
  });


})