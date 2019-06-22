import React, { useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import DocumentTitle from 'react-document-title';
import * as duck from '../../duck';
import * as utils from '../../utils';
import Countries from '../Countries';

function Country({ weather, country, countries, fetch }) {
    const { title, label, fahrenheit, timezone, date } = utils.getWeather(
        weather,
        country,
    );
    useEffect(() => void fetch(country), [country]);

    return (
        <DocumentTitle title={`Weather for ${country}`}>
            <span>
                <button
                    className="refresh"
                    onClick={() => void fetch(country, { cache: false })}
                />
                <main>
                    <img src={utils.getFilename(country)} alt={country} />
                    <h1>
                        {title} at{' '}
                        {timezone
                            ? date.add(timezone, 'seconds').format('HH:mm:ss')
                            : String.fromCharCode(8212)}
                    </h1>
                    <h2 title={fahrenheit}>{label}</h2>
                    <Countries list={countries} />
                </main>
            </span>
        </DocumentTitle>
    );
}

Country.propTypes = {
    weather: PropTypes.array.isRequired,
    country: PropTypes.string.isRequired,
    countries: PropTypes.array.isRequired,
    fetch: PropTypes.func.isRequired,
};

Country.defaultProps = { weather: null };

function mapStateToProps(state) {
    return state;
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(duck.actions, dispatch);
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Country);
