/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

// NOTE: We're explicitly not using JSX here. This is intended to test
// the current stack addendum without having source location added by babel.

'use strict';

import React from '../../src/May';
import { render } from '../../src/MayDom'
var ReactDOM = {
	render: render
}

// import React from "../../dist/ReactANU";
// var ReactDOM = {
// 	render: React.render
// }
// var React = require('react');//hyphenate
// var ReactDOM = require('react-dom');

var ReactTestUtils = {};
ReactTestUtils.renderIntoDocument = function (component) {
	var div = document.createElement('div');
	ReactDOM.render(component, div);
}

describe('ReactChildReconciler', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  // beforeEach(() => {
  //   // jest.resetModules();

  //   React = require('react');
  //   ReactTestUtils = require('react-dom/test-utils');
  // });

  function createIterable(array) {
    return {
      '@@iterator': function() {
        var i = 0;
        return {
          next() {
            const next = {
              value: i < array.length ? array[i] : undefined,
              done: i === array.length,
            };
            i++;
            return next;
          },
        };
      },
    };
  }

  /*it('warns for duplicated array keys', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{[<div key="1" />, <div key="1" />]}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
    );
  });

  it('warns for duplicated array keys with component stack info', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <p>{[<span key="1" />, <span key="1" />]}</p>;
      }
    }

    class Parent extends React.Component {
        componentWillMount(){
            console.log('Parent Will Mount');
        }
        componentDidMount(){
            console.log('Parent Did Mount');
        }
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
        componentWillMount(){
            console.log('GrandParent Will Mount');
        }
        componentDidMount(){
            console.log('GrandParent Did Mount');
        }
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    expect(console.error.calls.count()).toBe(1);
    expect(
      normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
    ).toContain(
      'Encountered two children with the same key, `1`. ' +
        'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
      '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });

  it('warns for duplicated iterable keys', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
    );
  });*/

  /*it('warns for duplicated iterable keys with component stack info', () => {
    spyOn(console, 'error');

    class Component extends React.Component {
      render() {
        return <div>{createIterable([<div key="1" />, <div key="1" />])}</div>;
      }
    }

    class Parent extends React.Component {
      render() {
        return React.cloneElement(this.props.child);
      }
    }

    class GrandParent extends React.Component {
      render() {
        return <Parent child={<Component />} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<GrandParent />);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(
      normalizeCodeLocInfo(console.error.calls.argsFor(0)[0]),
    ).toContain(
      'Encountered two children with the same key, `1`. ' +
        'Keys should be unique so that components maintain their identity ' +
        'across updates. Non-unique keys may cause children to be ' +
        'duplicated and/or omitted — the behavior is unsupported and ' +
        'could change in a future version.',
      '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });*/
});
