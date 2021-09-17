
import React, { Component, useState, useEffect, useCallback } from 'react';

import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Result from './Result';
import SearchInfo from './SearchInfo';

// Fugly regex to detect incorrect searchs
const re = new RegExp(/([^A-zÀ-ú]|^)[*+-]([^A-zÀ-ú0-9]|$)|([^A-zÀ-ú]:)|(:[^0-9A-zÀ-ú])/);


const Search = React.memo(function Search(props) {
    const inputDelay = 300;
    const { idx, raw_data } = props;
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query != "") {
                if (query.match(re)) {
                    console.log("invalid query");
                    setInvalid(true);
                } else {
                    try {
                        setResults(idx.search(query));
                        setInvalid(false);
                    } catch (error) {
                        setInvalid(true);
                    }
                }
            } else {
                setResults([]);
                setInvalid(false);
            }
        }, inputDelay);
        return () => clearTimeout(timer);
    }, [query, inputDelay, setResults]);

    const handleChange = event => {
        setQuery(event.target.value);
    };

    return (
        <div>
            <Navbar bg="light" expand="lg">
                <Navbar.Brand>Recherche :</Navbar.Brand>
                <Form inline onSubmit={e => { e.preventDefault(); }}>
                    <FormControl
                        type="text"
                        placeholder="Tapez ici les mots-clefs recherchés…"
                        value={query}
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
                    <Result key={position.ID} position={position} metadata={result.matchData.metadata} />
                )
            })}
            {results && results.length === 0 &&
                <SearchInfo />
            }
        </div>
    );
});

export default Search;