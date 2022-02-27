
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import preval from 'preval.macro'

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
          <li>Pour l'instant, seuls les postes <b>actuellement listés</b> sur Galaxie sont pris en compte dans ce moteur de recherche.</li>
        </ul>
      </Alert>
      <Alert variant="primary">
        Techniques de recherche:
        <ul>
          <li>terme1 terme2 : cherche les résultats qui contiennent terme1 <b>ou</b> terme2. Par exemple: Lyon Paris</li>
          <li>Le caractère * représente un joker. Par exemple, pour rechercher les mots commençant par Info: Info*</li>
          <li>+terme : force la présence du terme dans les résultats. Par exemple: +ATER</li>
          <li>-terme : empêche la présence du terme dans les résultats. Par exemple: -PRAG/PRCE</li>
          <li>Il est possible de chercher dans certains champs spécifiquement en utilisant la syntaxe "champ:valeur". Les champs disponibles sont:
            <ul>
              <li>Sections: les sections du poste, par exemple +Sections:27 .</li>
              <li>Localisation: la localisation du poste, par exemple +Localisation:Lyon .</li>
              <li>Fiche: la fiche de poste (PDF).</li>
              <li>Profil: le profil du poste tel que posté sur Galaxie (parfois vide).</li>
              <li>Corps: Pour les postes d'enseignants chercheurs, par exemple +Corps:MCF</li>
              <li>Établissement: l'établissement, par exemple +Établissement:Université</li>
              <li>Type: le type de poste (ATER, PRAG/PRCE ou Enseignants Chercheurs)</li>
            </ul>
          </li>
        </ul>
      </Alert>
      Dernière mise à jour: {preval`module.exports = new Date().toLocaleString();`}.
    </Container>
  )
};

export default SearchInfo;