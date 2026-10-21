import React, { Component } from 'react';
import './App.css';
import JokeList from './JokeList';
import JokeFeed from './JokeFeed';

const SCREENS = [
  { key: 'list', hash: '#/', label: 'My Jokes', icon: 'fas fa-star' },
  { key: 'feed', hash: '#/feed', label: 'Joke Feed', icon: 'fas fa-stream' },
];

function screenFromHash() {
  return window.location.hash === '#/feed' ? 'feed' : 'list';
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { screen: screenFromHash() };
    this.handleHashChange = this.handleHashChange.bind(this);
  }
  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange);
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }
  handleHashChange() {
    this.setState({ screen: screenFromHash() });
  }
  render() {
    const { screen } = this.state;
    return (
      <div className="App">
        <nav className="App-nav">
          {SCREENS.map((s) => (
            <a
              key={s.key}
              href={s.hash}
              className={`App-nav-link${screen === s.key ? ' active' : ''}`}
            >
              <i className={s.icon} /> {s.label}
            </a>
          ))}
        </nav>
        {screen === 'feed' ? <JokeFeed /> : <JokeList />}
      </div>
    );
  }
}
