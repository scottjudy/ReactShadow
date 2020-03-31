import { useContext } from 'react';
import { decamelize } from 'humps';
import create from './core';
import * as utils from './utils';

const tags = new Map();

export function useShadowRoot() {
    return useContext(utils.Context);
}

export function createProxy(
    target = {},
    id = 'core',
    render = ({ children }) => children,
) {
    return new Proxy(target, {
        get: function get(_, name) {
            const tag = decamelize(name, { separator: '-' });
            const key = `${id}-${tag}`;

            if (!tags.has(key)) tags.set(key, create({ tag, render }));
            return tags.get(key);
        },
    });
}

export default createProxy();
