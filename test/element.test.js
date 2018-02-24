
import React from '../src/May'
// import React from "../dist/ReactANU";

describe('may.js', () => {

	it('mayRender', () => {
		spyOn(console, 'error');
		var container = document.createElement('div');
		class Child extends React.Component {


			render() {
				return (
					<div>
						{this.props.val}
					</div>);
			}
		}
		class Parent extends React.Component {
			constructor() {
				super();
				this.state = { val: 'I wonder' };
			}
			Change = () => {
				this.setState({ val: 'I see' });
			}
			render() {
				return (
					<div className="mystyle" style={{ width: '40%', marginLeft: '30px', backgroundColor: 'blue' }} onClick={this.Change}>
						{this.state.val === 'I wonder' ? <Child key="1" val="1" /> : <Child key="1" val="1" />}
						{this.state.val === 'I wonder' ? <Child key="2" val="2" /> : <Child key="3" val="3" />}
					</div>
				);
				// if (this.state.val === 'I wonder') {
				// 	return (
				// 		<div className="mystyle" style={{ width: '40%', marginLeft: '30px', backgroundColor: 'blue' }} onClick={this.Change}>
				// 			<Child key="1" val="1" />
				// 			<Child key="2" val="2" />
				// 		</div>
				// 	);
				// } else {
				// 	return (
				// 		<div className="mystyle" style={{ width: '40%', marginLeft: '30px', backgroundColor: 'blue' }} onClick={this.Change}>
				// 			<Child key="2" val="2" />
				// 			<Child key="1" val="1" />
				// 		</div>
				// 	);
				// }

			}
		}
		React.render(<Parent />, container);
		document.body.appendChild(container);
		expect(console.error.calls.count()).toBe(0);
	});


})