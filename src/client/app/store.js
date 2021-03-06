import logger from 'debug';
import hasValue from './utils/hasValue';
import { createStore, applyMiddleware } from 'redux';
import taskReducer from './reducers/tasks';
import tagReducer from './reducers/tags';
import routeReducer from './reducers/routes';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { SortCriterions } from './constants/AppConstants';

const debug = logger('app:store:init');

export function configureStore(serverData = {}) {
    debug('Initialize store');
    debug('Add redux middlewares.');

    // Use the same indicator as `debug` to know wether the middleware should
    // log or not.
    const debugMode = localStorage.getItem('debug');
    const shouldLog = process.env.NODE_ENV === 'development' ||
                      (hasValue(debugMode) &&
                       debugMode !== 'null' && debugMode !== 'undefined' &&
                       debugMode !== '');
    const loggerMiddleware = createLogger({
        level: 'info',
        collapsed: true,
        duration: true,
        predicate: () => shouldLog,
    });
    const createStoreWithMiddleware = applyMiddleware(
        thunkMiddleware,
        loggerMiddleware
    )(createStore);

    debug('Retrieve configuration from local storage.');
    let favoriteSearch;
    try {
        const localStorageKey = 'tasky.favorite_search';
        const storedFavoriteSearch = localStorage.getItem(localStorageKey);
        favoriteSearch = JSON.parse(storedFavoriteSearch);
    } catch (err) {
        const message = `An error occured while retrieving favorite search ` +
                        `(${err.message})`;
        debug(message);
        favoriteSearch = null;
    }

    let storedSortCriterion;
    try {
        storedSortCriterion = localStorage.getItem('sort-criterion');
    } catch (err) {
        const message = `An error occured while retrieving sort criterion ` +
                        `(${err.message})`;
        debug(message);
        storedSortCriterion = null;
    }
    const sortCriterion = storedSortCriterion || SortCriterions.COUNT;

    debug('Build initial state object based on server data.');
    const initialState = {
        selectedTags: null,
        tasks: serverData.tasks,
        archivedTasks: serverData.archivedTasks,
        searchQuery: null,
        cid: serverData.cid,
        isArchivedModeEnabled: false,
        isReindexing: false,
        sortCriterion,
        favoriteTags: serverData.favoriteTags || [],
        favoriteSearch,
    };

    const rootReducer = (state, action) => {
        let newState = taskReducer(state, action);
        newState = tagReducer(newState, action);
        newState = routeReducer(newState, action);
        return newState;
    };

    return createStoreWithMiddleware(rootReducer, initialState);
}
