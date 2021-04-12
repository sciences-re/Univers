import React, { Component, useState, useEffect, useCallback } from 'react';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import preval from 'preval.macro'
import FormControl from 'react-bootstrap/FormControl';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-virtualized/styles.css';
import './App.css';
import lunr from "lunr";
import debounce from 'lodash.debounce';
import queryString from 'query-string';

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
const re = new RegExp(/(\W|^)[*+-](\W|$)|:/);

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

const Search = (props) => {
  const location = useLocation();
  let params = queryString.parse(location.search);
  const { idx, raw_data } = props;
  const [query, setQuery] = useState(params.search);
  const [input, setInput] = useState(params.search);
  const history = useHistory()
  var invalid = false;
  var results = [];

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) {
      params.append("search", query)
    } else {
      params.delete("search");
    }
    history.push({ search: params.toString() })
  }, [query, history])

  const debouncedSearch = useCallback(
    debounce(nextValue => {
      return setQuery(nextValue);
    }, 250),
    [],
  );

  const handleChange = event => {
    setInput(event.target.value);
    const { value: nextValue } = event.target;
    debouncedSearch(nextValue);
  };

  if (query) {
    if (re.test(query)) {
      invalid = true;
    } else {
      try {
        results = idx.search(query);
      } catch (error) {
        console.log(error);
      }
    }
  }

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Recherche :</Navbar.Brand>
        <Form inline onSubmit={e => { e.preventDefault(); }}>
          <FormControl
            type="text"
            placeholder="Tapez ici les mots-clefs recherchés…"
            value={input}
            onChange={handleChange}
            isInvalid={invalid} />
          <Form.Control.Feedback type="invalid">
            La recherche est invalide ! Pour forcer ou empêcher un terme à apparaitre: "+terme" ou "-terme". Wildcard: *
          </Form.Control.Feedback>
        </Form>

      </Navbar>
      {results.map(result => {
        const position = raw_data[result.ref];
        return (
          <Result key={position.ID} position={position} score={result.score} metadata={result.matchData.metadata} />
        )
      })}
      {results && results.length === 0 &&
        <SearchInfo />
      }
    </div>
  );
};

const SearchInfo = () => {
  return (
    <Container className='mt-5'>
      <Alert variant="info">
        Ce site web permet de rechercher dans les postes et fiches de postes publiés sur Galaxie. La base de données est mise à jour toutes les 6 heures. On peut par exemple rechercher…
         <ul>
          <li>… les postes d'ATER ou de PRAG à Lyon en Informatique: PRAG ATER +Lyon +Informatique</li>
          <li>… les postes de géographie qui ne sont pas à Paris: géographie -paris</li>
          <li>… les postes de mathématiques qui n'ont pas de lien avec l'informatique: mathématiques -informatique</li>
        </ul>
      </Alert>
      <Alert variant="warning">
        <ul>
          <li>La recherche s'effectue sur des mots complets ! Ainsi, chercher " infor " ne permettra pas de trouver " informatique ": il faut utiliser un joker et chercher " infor* " ou rechercher l'expression complète " informatique ".</li>
          <li>Pour l'instant, seuls les postes listés sur Galaxie sont pris en compte dans ce moteur de recherche.</li>
        </ul>
      </Alert>
      <Alert variant="primary">
        Techniques de recherche:
          <ul>
          <li>terme1 terme2 : cherche les résultats qui contiennent terme1 <b>ou</b> terme2. Par exemple: Lyon Paris</li>
          <li>Le caractère * représente un joker. Par exemple, pour rechercher les mots commençant par Info: Info*</li>
          <li>+terme : force la présence du terme dans les résultats. Par exemple: +ATER</li>
          <li>-terme : empêche la présence du terme dans les résultats. Par exemple: -PRAG/PRCE</li>
        </ul>
      </Alert>
      Dernière mise à jour: {preval`module.exports = new Date().toLocaleString();`}.
    </Container>
  )
};

const Result = (props) => {
  const { position, score, metadata } = props;
  return (
    <Card >
      <Card.Body>
        <Card.Title>{position["Type de poste"]} - {position["Établissement"]}<Button variant="primary" className="float-right" href={position["URL"]}>Ouvrir la fiche de poste</Button></Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {position["Corps"] && position["Corps"] + " - "}
          {position["Localisation du poste"]}
        </Card.Subtitle>
        <Card.Text>
          {position["Profil"]}
        </Card.Text>
        <Card.Text className="mb-2 text-muted">
          {Object.getOwnPropertyNames(metadata).map(key => { return "\"" + key + "\" présent dans : " + Object.getOwnPropertyNames(metadata[key]).join(", ") + " ; "; })}
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default App;