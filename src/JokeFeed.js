import React, { Component } from "react";
import axios from "axios";
import uuid from "uuid/v4";
import "./JokeFeed.css";

const SEARCH_URL = "https://icanhazdadjoke.com/search";
// The API holds roughly 750 jokes; start somewhere random in the first ~30
// pages so the feed feels fresh, then wrap around until every page is seen.
const RANDOM_START_PAGES = 30;

function readSavedJokes() {
  return JSON.parse(window.localStorage.getItem("jokes") || "[]");
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default class JokeFeed extends Component {
  static defaultProps = {
    pageSize: 20,
  };
  constructor(props) {
    super(props);
    this.state = {
      jokes: [],
      loading: false,
      error: null,
      done: false,
      savedTexts: new Set(readSavedJokes().map((j) => j.text)),
    };
    this.nextPage = 1 + Math.floor(Math.random() * RANDOM_START_PAGES);
    this.totalPages = null;
    this.pagesLoaded = 0;
    this.seenIds = new Set();
    this.scrollRef = React.createRef();
    this.sentinelRef = React.createRef();
    this.loadMore = this.loadMore.bind(this);
  }
  componentDidMount() {
    this.loadMore();
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) this.loadMore();
        },
        { root: this.scrollRef.current, rootMargin: "300px" }
      );
      this.observer.observe(this.sentinelRef.current);
    }
  }
  componentWillUnmount() {
    this.unmounted = true;
    if (this.observer) this.observer.disconnect();
  }
  async loadMore() {
    if (this.state.loading || this.state.done || this.state.error) return;
    this.setState({ loading: true });
    try {
      const response = await axios.get(SEARCH_URL, {
        headers: { Accept: "application/json" },
        params: { page: this.nextPage, limit: this.props.pageSize },
      });
      if (this.unmounted) return;
      const data = response.data || {};
      const results = data.results || [];
      // A random start page past the end comes back empty; restart at page 1.
      if (results.length === 0 && this.pagesLoaded === 0 && this.nextPage !== 1) {
        this.nextPage = 1;
        this.setState({ loading: false }, this.loadMore);
        return;
      }
      this.totalPages = data.total_pages || 1;
      this.pagesLoaded += 1;
      this.nextPage = this.nextPage >= this.totalPages ? 1 : this.nextPage + 1;
      const fresh = shuffle(results.filter((j) => !this.seenIds.has(j.id)));
      fresh.forEach((j) => this.seenIds.add(j.id));
      this.setState(
        (st) => ({
          loading: false,
          jokes: [...st.jokes, ...fresh],
          done: this.pagesLoaded >= this.totalPages,
        }),
        this.fillViewport
      );
    } catch (exc) {
      if (this.unmounted) return;
      this.setState({
        loading: false,
        error: "We couldn't reach the joke server. Check your connection and try again.",
      });
    }
  }
  // If the first page doesn't fill the panel the sentinel stays visible and
  // the observer won't fire again, so keep loading until it scrolls.
  fillViewport = () => {
    const el = this.scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight) this.loadMore();
  };
  handleRetry = () => {
    this.setState({ error: null }, this.loadMore);
  };
  handleSave(joke) {
    const saved = readSavedJokes();
    if (!saved.some((j) => j.text === joke.joke)) {
      saved.push({ id: uuid(), text: joke.joke, votes: 0 });
      window.localStorage.setItem("jokes", JSON.stringify(saved));
    }
    this.setState((st) => ({
      savedTexts: new Set([...st.savedTexts, joke.joke]),
    }));
  }
  renderFooter() {
    const { loading, error, done, jokes } = this.state;
    if (error) {
      return (
        <div className="JokeFeed-status JokeFeed-error">
          <i className="fas fa-exclamation-circle" />
          <p>{error}</p>
          <button className="JokeFeed-retry" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="JokeFeed-status">
          <i className="far fa-3x fa-laugh fa-spin" />
          <p>{jokes.length ? "Loading more jokes..." : "Warming up the dad jokes..."}</p>
        </div>
      );
    }
    if (done) {
      return (
        <div className="JokeFeed-status">
          <i className="em em-tada" />
          <p>You've read every joke we've got. Impressive groaning.</p>
        </div>
      );
    }
    return (
      <div className="JokeFeed-status">
        <button className="JokeFeed-retry" onClick={this.loadMore}>
          Load more jokes
        </button>
      </div>
    );
  }
  render() {
    const { jokes, savedTexts } = this.state;
    return (
      <div className="JokeFeed">
        <header className="JokeFeed-header">
          <h1 className="JokeFeed-title">
            <span>Dad Joke</span> Feed
          </h1>
          <p className="JokeFeed-subtitle">
            Scroll forever. Save the groaners you want to vote on later.
          </p>
        </header>
        <div className="JokeFeed-scroll" ref={this.scrollRef}>
          {jokes.map((j) => {
            const saved = savedTexts.has(j.joke);
            return (
              <article className="JokeFeed-card" key={j.id}>
                <i className="fas fa-quote-left JokeFeed-quote" />
                <p className="JokeFeed-text">{j.joke}</p>
                <button
                  className={`JokeFeed-save${saved ? " saved" : ""}`}
                  onClick={() => this.handleSave(j)}
                  disabled={saved}
                >
                  <i className={saved ? "fas fa-check" : "far fa-star"} />
                  {saved ? " Saved to My Jokes" : " Save to My Jokes"}
                </button>
              </article>
            );
          })}
          {this.renderFooter()}
          <div ref={this.sentinelRef} className="JokeFeed-sentinel" />
        </div>
      </div>
    );
  }
}
