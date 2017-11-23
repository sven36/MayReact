import { createElement } from '../src/May';

describe('may.js',()=>{
    it('type',()=>{
        var el= createElement("p",null,'sst');
        expect(el.type).toBe("p");
        expect(typeof el.props.children).toBe("string");
        expect(el.props.children.length).toBe(3);
    }

    );
}
)
