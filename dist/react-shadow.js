(function main($window, $document) {

    "use strict";

    var React;

    if (typeof require === 'function') {
        React = require('react');
    } else {
        React = $window.React;
    }

    /**
     * @constant REACT_ID_ATTRIBUTE
     * @type {String}
     */
    var REACT_ID_ATTRIBUTE = 'data-reactid';

    /**
     * @constant REACT_SHADOW_ROOT
     * @type {String}
     */
    var REACT_SHADOW_ROOT = 'main';

    /**
     * @module ReactShadow
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ReactShadow
     */
    $window.ReactShadow = {

        /**
         * @property _shadowRoot
         * @type {Object}
         * @private
         */
        _shadowRoot: {},

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            var shadowRoot  = this._shadowRoot = this.getDOMNode().parentNode.createShadowRoot(),
                mainElement = $document.createElement(REACT_SHADOW_ROOT);

            // Attach CSS
            if (this.cssDocuments) {
                this._attachCSSDocuments(shadowRoot);
            }
            if (this.cssSource) {
                this._attachCSSSource(shadowRoot);
            }
            // Append the template node's content to our component.
            shadowRoot.appendChild(mainElement);

            // Render component and intercept the DOM events.
            React.render(this.render(), mainElement);
            this._interceptEvents();

            // Wrap current DOM node in `script` tag.
            var scriptElement = $document.createElement('script');
            this.getDOMNode().parentNode.appendChild(scriptElement);
            scriptElement.appendChild(this.getDOMNode());

            // Shadow insertion point for nesting shadow roots.
            //shadowRoot.appendChild($document.createElement('shadow'));

        },

        /**
         * @method componentDidUpdate
         * @return {void}
         */
        componentDidUpdate: function componentDidUpdate() {
            var containerElement = this._shadowRoot.querySelector(REACT_SHADOW_ROOT);
            React.render(this.render(), containerElement);
        },

        /**
         * @method _interceptEvents
         * @return {void}
         * @private
         */
        _interceptEvents: function _interceptEvents() {

            // Memorise the React ID's root ID for intercepting events.
            var rootReactId = this.getDOMNode().getAttribute(REACT_ID_ATTRIBUTE),
                domNode     = this.getDOMNode().parentNode;

            /**
             * @method redirectEvent
             * @param event {Object}
             * @return {void}
             */
            var redirectEvent = function redirectEvent(event) {

                event.stopPropagation();

                var targetId = event.target.getAttribute(REACT_ID_ATTRIBUTE);

                if (targetId) {

                    // Translate current target ID into the React.js element we're shadowing.
                    var translatedId = targetId.replace(/\.[0-9]+/, rootReactId),
                        element      = domNode.querySelector('*[' + REACT_ID_ATTRIBUTE + '="' + translatedId + '"]');

                    if (event.target.value) {

                        // Update the original element's value.
                        element.setAttribute('value', event.target.value);

                    }

                    // Dispatch the event on the original component's element.
                    var customEvent = $document.createEvent('Events');
                    customEvent.initEvent(event.type, true, false);
                    element.dispatchEvent(customEvent);

                }

            }.bind(this);

            // List of all events that should be intercepted and re-routed.
            var eventsList = ['click', 'dblclick', 'mouseup', 'mouseout', 'mouseover', 'mousedown', 'mouseenter',
                              'mouseleave', 'contextmenu', 'keyup', 'keydown', 'change'];

            eventsList.forEach(function forEach(eventName) {
                this._shadowRoot.addEventListener(eventName, redirectEvent);
            }.bind(this));

        },


        /**
         * @method createStyle
         * @param  {HTMLElement} element
         * @param  {string} styleContent Content style for given element
         * @return {HTMLElement}              
         */
        _createStyle: function(element, styleContent) {
            // Construct the HTML for the external stylesheets.
            var styleElement = $document.createElement('style');
            styleElement.innerHTML = styleContent;
            element.appendChild(styleElement);
            return element;
        },


        /**
         * @method _attachCSSSource
         * @param  {HTMLElement} element
         * @return {HTMLElement}      
         */
        _attachCSSSource: function(element) {
            this._createStyle(element, this.cssSource);
        },


        /**
         * @method _attachCSSDocuments
         * @param element {HTMLElement}
         * @return {HTMLElement}
         * @private
         */
        _attachCSSDocuments: function _attachCSSDocuments(element) {
            var that = this;

            if (this.cssDocuments) {

                var isFunction   = typeof this.cssDocuments === 'function',
                    cssDocuments = isFunction ? this.cssDocuments() : this.cssDocuments;

                cssDocuments.forEach(function forEach(cssDocument) {
                    that._createStyle(element, '@import "' + cssDocument + '"');
                });

            }

            return element;

        }

    };

})(window, window.document);