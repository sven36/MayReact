import {
    createElement
} from '../src/May';
import {
    Component
} from '../src/Component';

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
        expect(C1.prototype.render).to.have.been.calledOnce;
    });


})