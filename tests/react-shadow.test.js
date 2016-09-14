import test from 'ava';
import React, { Component } from 'react';
import ShadowDOM from '../src/react-shadow';
import { spy } from 'sinon';
import { mount } from 'enzyme';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

// We configure JSDOM here because setting it up before the imports causes NLP to error.
global.document = require('jsdom').jsdom('<body></body>');
global.window = document.defaultView;
global.navigator = window.navigator;

// Spy and mock the attachShadow function.
const attachShadow = window.HTMLElement.prototype.attachShadow = spy(function() {

    const boundary = window.document.createElement('fake-boundary');
    this.appendChild(boundary);
    return boundary;

});

test.beforeEach(t => {

    t.context.mockAdapter = new MockAdapter(axios);
    t.context.dateNow = Date.now();

    t.context.create = (props, wrapped = true) => {

        const html = wrapped ? (
            <section className="simple-clock">
                <h1>Simple Clock</h1>
                <datetime>{t.context.dateNow}</datetime>
            </section>
        ) : (
            <section className="simple-clock">
                <h1>Simple Clock</h1>
            </section>
        );

        return () => <ShadowDOM {...props}>{html}</ShadowDOM>;

    };

});

test('Should be able to create the shadow boundary;', t => {

    const { create, dateNow } = t.context;
    const Clock = create();

    const wrapper = mount(<Clock />);

    t.is(attachShadow.callCount, 1);
    t.true(attachShadow.calledWith({ mode: 'open' }));

    const host = wrapper.find('section');
    t.true(host.hasClass('simple-clock'));
    t.true(host.hasClass('resolved'));

    const h1 = { text: () => host.node.querySelector('fake-boundary span h1').innerHTML };
    t.is(h1.text(), 'Simple Clock');

    const dateTime = { text: () => host.node.querySelector('fake-boundary span datetime').innerHTML };
    t.is(dateTime.text(), String(dateNow));

});

test('Should be able to change the boundary mode;', t => {

    const Clock = t.context.create({ boundaryMode: 'closed' });

    mount(<Clock />);
    t.true(attachShadow.calledWith({ mode: 'closed' }));

});

test('Should be able to change the nested node;', t => {

    const Clock = t.context.create({ nodeName: 'test-wrapper' });

    const wrapper = mount(<Clock />);
    const h1 = { text: () => wrapper.find('section').node.querySelector('fake-boundary test-wrapper h1').innerHTML };
    t.is(h1.text(), 'Simple Clock');

});

test('Should be able to exclude wrapper if only single child;', t => {

    const Clock = t.context.create({}, false);

    const wrapper = mount(<Clock />);
    const h1 = { text: () => wrapper.find('section').node.querySelector('fake-boundary > h1').innerHTML };
    t.is(h1.text(), 'Simple Clock');

});

test('Should be able to include CSS documents', t => {

    return new Promise(resolve => {

        const firstStylesheet = '* { border: 1px solid red }';
        const secondStylesheet = '* { background-color: orange }';

        t.context.mockAdapter.onGet('/first.css').reply(200, firstStylesheet);
        t.context.mockAdapter.onGet('/second.css').reply(200, secondStylesheet);

        const Clock = t.context.create({ cssDocuments: ['/first.css', '/second.css'] });
        const wrapper = mount(<Clock />);

        const host = wrapper.find('section');
        t.true(host.hasClass('simple-clock'));
        t.true(host.hasClass('resolving'));

        setTimeout(() => {

            const style = { text: () => host.node.querySelector('style').innerHTML };
            t.is(style.text(), `${firstStylesheet} ${secondStylesheet}`);
            t.true(host.hasClass('simple-clock'));
            t.true(host.hasClass('resolved'));
            resolve();

        });

    });

});

test('Should be able to raise exceptions from sanity checks;', t => {

    console.error = () => {};

    t.throws(() => {
        const Example = <div />;
        mount(<ShadowDOM><Example /></ShadowDOM>);
    }, 'ReactShadow: Passed child must be a concrete HTML element rather than another React component.');

    t.throws(() => {
        mount(<ShadowDOM><div /><div /></ShadowDOM>);
    }, 'ReactShadow: You must pass a single child rather than multiple children.');

});
