import './index.html';
import React from 'react';
import dva from '../../src/index';
import { connect } from '../../index';
import { Router, Route, useRouterHistory } from '../../router';
import { put, call } from '../../effects';
import fetch from '../../fetch';
import styles from './index.less';
import SearchInput from './components/SearchInput';
import FriendList from './components/FriendList';

// 1. Initialize
const app = dva();

// 2. Model
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
app.model({
  namespace: 'friends',
  state: {
    query: '',
    friends: [],
  },
  subscriptions: [
    function(dispatch) {
      hashHistory.listen(location => {
        if (location.action === 'POP') {
          dispatch({
            type: 'friends/setQuery',
            payload: location.query.q,
          });
        }
      });
    }
  ],
  effects: {
    ['friends/setQuery']: [function*({ payload }) {
      yield delay(300);
      yield call(hashHistory.push, {
        query: { q: payload || '' },
      });
      const { success, data } = yield fetch(`/api/search?q=${payload}`)
        .then(res => res.json());
      if (success) {
        yield put({
          type: 'friends/setFriends',
          payload: data,
        });
      }
    }, { type: 'takeLatest' }],
  },
  reducers: {
    ['friends/setQuery'](state, { payload }) {
      return { ...state, query: payload };
    },
    ['friends/setFriends'](state, { payload }) {
      return { ...state, friends: payload };
    },
  },
});

// 3. View
const App = connect(({ friends }) => ({
  query: friends.query,
  friends: friends.friends,
}))(function(props) {
  function handleSearch(value) {
    props.dispatch({
      type: 'friends/setQuery',
      payload: value,
    });
  }
  return (
    <div className={styles.app}>
      <SearchInput
        value={props.query}
        placeholder="Search friends..."
        handleSearch={handleSearch}
      />
      <FriendList friends={props.friends} />
    </div>
  );
});

// 4. Router
app.router(({ history }) =>
  <Router history={history}>
    <Route path="/" component={App} />
  </Router>
);

// 5. Start
app.start(document.getElementById('root'));
