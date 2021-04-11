var lunr = require('lunr'),
	stdin = process.stdin,
	stdout = process.stdout,
	buffer = []

const columns = [
	  { field: "Type de poste", headerName: "Type de poste", formatter: x => x },
	  { field: "Sections", headerName: "Section(s)", formatter: x => x },
	  { field: "Établissement", headerName: "Établissement", formatter: x => x },
	  { field: "Localisation du poste", headerName: "Localisation", formatter: x => x },
	  { field: "Corps", headerName: "Corps", formatter: x => x },
	  { field: "Date de prise de fonction", headerName: "Date de prise de fonction", formatter: x => x },
	  { field: "Ouverture des candidatures", headerName: "Ouverture des candidatures", formatter: x => x },
	  { field: "Fermeture des candidatures", headerName: "Fermeture des candidatures", formatter: x => x },
	  { field: "URL", headerName: "URL", formatter: x => x},
	  { field: "Profil", headerName: "Profil", formatter: x => x },
	  { field: "Fiche de poste", headerName: "Contenu du PDF", formatter: x => x }
];

stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function (data) {
	buffer.push(data)
})

stdin.on('end', function () {
	var documents = JSON.parse(buffer.join(''))

	var idx = lunr(function () {
		this.pipeline.remove(lunr.stemmer)
		this.searchPipeline.remove(lunr.stemmer)

		this.ref('ID')
		columns.forEach(column => this.field(column.field));

		documents.forEach(function (doc) {
			this.add(doc)
		}, this)
	})

	stdout.write(JSON.stringify(idx))
})
