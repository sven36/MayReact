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
    expect(el.props.children.length).toBe(3);
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
    //render(<C1 val={"233"} />, container);
  });
  it('mayRender', () => {
    spyOn(console, 'error');
    var container = document.createElement('div');
	  class Child extends Component {
		//   constructor(props){
		// 	  super(props);
		// 	  this.state={val2:'I wonder'};
		//   }
			
		  render() {
			  return (
				  <div>
					{/* {this.state.val2} */}
					{this.props.key}
					  {this.props.val}
				  </div>);
		  }
	  }
    class Parent extends Component {
		constructor(){
			super();
			this.state={val:'I wonder'};
			// this.Change=this.Change.bind(this);
		}
		Change=()=>{
			this.setState({val:'I see'});
    }
    Click(){
      
    }
		onFocus(){
			this.refs.inputRef.focus()
		   }
		render() {
			return (
				<div className="mystyle" style={{ width: '40%', marginLeft: '30px' }}>
					{this.state.val === 'I wonder' ? '':<Child key="1" val="2" />}
					<input onChange={this.Change} type="radio" value={0} />
					{this.state.val !== 'I wonder' ? <Child key="1" val="2" /> : <Child key="3" val="4" />}
					<Child key="0" val={this.state.val} />
					<Child key="0" val={"last"} />
				</div>
			);
		}
    }
    render(<Parent />, container);
    document.body.appendChild(container);
    expect(console.error.calls.count()).toBe(0);
  });


})