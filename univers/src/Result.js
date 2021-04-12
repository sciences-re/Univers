
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import React, { Component } from 'react';


class Result extends Component {
    render() {
        const { position, metadata } = this.props;
        return (
            <Card >
                <Card.Body>
                    <Card.Title>{position["Type"]} - {position["Établissement"]}<Button variant="primary" className="float-right" href={position["URL"]}>Ouvrir la fiche de poste</Button></Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                        {position["Corps"] && position["Corps"] + " - "}
                        {position["Localisation"]}
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
}

export default Result;