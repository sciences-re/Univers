var lunr = require('lunr'),
	stdin = process.stdin,
	stdout = process.stdout,
	buffer = []

const columns = [
	  { field: "Type", headerName: "Type de poste", formatter: x => x },
	  { field: "Sections", headerName: "Section(s)", formatter: x => x },
	  { field: "√Čtablissement", headerName: "√Čtablissement", formatter: x => x },
	  { field: "Localisation", headerName: "Localisation", formatter: x => x },
	  { field: "Corps", headerName: "Corps", formatter: x => x },
	  { field: "Prise", headerName: "Date de prise de fonction", formatter: x => x },
	  { field: "Ouverture", headerName: "Ouverture des candidatures", formatter: x => x },
	  { field: "Fermeture", headerName: "Fermeture des candidatures", formatter: x => x },
	  { field: "URL", headerName: "URL", formatter: x => x},
	  { field: "Profil", headerName: "Profil", formatter: x => x },
	  { field: "Fiche", headerName: "Fiche de poste", formatter: x => x }
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
