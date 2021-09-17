import React, { Component, useState, useEffect, useCallback } from 'react';

import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-virtualized/styles.css';
import './App.css';
import lunr from "lunr";
import Search from "./Search";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  useLocation
} from "react-router-dom";

const API = '';
const DATA_QUERY = 'output.json';
const IDX_QUERY = 'index.json';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      raw_data: [],
      idx: null,
      loaded: false,
    };
  }

  componentDidMount() {
    fetch(API + IDX_QUERY)
      .then(response => response.json())
      .then(data => {
        var idx = lunr.Index.load(data);
        fetch(API + DATA_QUERY)
          .then(response => response.json())
          .then(data => {
            this.setState({ raw_data: data, idx: idx, loaded: true })
          });
      });
  }

  render() {
    const { raw_data, idx, loaded } = this.state;

    if (!loaded) {
      return (
        <div className="App">
          Chargement en cours…
        </div>
      )
    } else {
      return (
        <Router>
          <div>
            <Switch>
              <Route path="/">
                <div className="App">
                  <Container fluid>
                    <Search idx={idx} raw_data={raw_data} />
                  </Container>
                </div>
              </Route>
            </Switch>
          </div>
        </Router>
      );
    }
  }
}

export default App;