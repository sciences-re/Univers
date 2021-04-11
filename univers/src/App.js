import React, { Component, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Card from 'react-bootstrap/Card';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Container from 'react-bootstrap/Container';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-virtualized/styles.css';
import './App.css';
import lunr from "lunr";

const API = '';
const DATA_QUERY = 'output.json';
const IDX_QUERY = 'index.json';
const re = new RegExp(/[\s*+-]+($|\s)/);

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
        console.log(data);
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

        <div className="App">
          <Container fluid>
            <Search idx={idx} raw_data={raw_data} />
          </Container>
        </div>
      );
    }
  }
}


const Search = (props) => {
  const { idx, raw_data } = props;
  const [query, setQuery] = useState(null);
  var invalid = false;
  var results = [];
  if (query) {
    if (re.test(query)) {
      invalid = true;
    } else {
      results = idx.search(query);
    }
  }

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Recherche :</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Form inline onSubmit={e => { e.preventDefault(); }}>
          <FormControl
            type="text"
            placeholder="Tapez ici les mots-clefs recherchés…"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            isInvalid={invalid} />
          <Form.Control.Feedback type="invalid">
            La recherche est invalide ! Pour forcer ou empêcher un terme à apparaitre: "+terme" ou "-terme". Wildcard: *
          </Form.Control.Feedback>
        </Form>

      </Navbar>
      {results.map(result => {
        const position = raw_data[result.ref];
        return (
          <Result key={position.ID} position={position} />
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
        </ul>
      </Alert>
      <Alert variant="primary">
        Techniques de recherche:
          <ul>
          <li>terme1 terme2 : cherche les résultats qui contiennent terme1 ou terme2. Par exemple: Lyon Paris</li>
          <li>Le caractère * représente un joker. Par exemple, pour rechercher les mots commençant par Info: Info*</li>
          <li>+terme : force la présence du terme dans les résultats. Par exemple: +ATER</li>
          <li>-terme : empêche la présence du terme dans les résultats. Par exemple: -PRAG/PRCE</li>
        </ul>
      </Alert>
    </Container>
  )
};

const Result = (props) => {
  const { position } = props;
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
      </Card.Body>
    </Card>
  );
}

export default App;