import Application from './components/application';
import logger from 'debug';
import React from 'react';
import { Provider } from 'react-redux';
import startRouter from './router';
import { configureStore } from './store.js';

const debug = logger('app:boot');

export default function boot(data) {
    debug('Prepare application to boot.');

    debug('Get localization strings based on given locale.');
    const locale = data.locale;

    const localesLoader = {
        en: require('./locales/en'),
        fr: require('./locales/fr'),
    };

    let phrases = localesLoader[locale];

    if (!phrases) {
        debug(`Localized strings could not be found for locale ${locale}, `
              `using EN locale instead.`);
        phrases = localesLoader.en;
    }

    // Initialize polyglot object with phrases.
    const Polyglot = require('node-polyglot');
    const polyglot = new Polyglot({locale: locale});
    polyglot.extend(phrases);

    const store = configureStore(data);
    const history = startRouter(store);

    const application = (
        <Provider store={store}>
            <Application />
        </Provider>
    );

    debug('Application configured, ready to start.');

    return {
        router: history,
        store,
        t: polyglot.t.bind(polyglot),
        application,
    };
}
