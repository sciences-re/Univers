#!/usr/bin/env python3
import nltk
nltk.download('stopwords')
from io import StringIO, BytesIO
from collections import defaultdict
import pandas as pd
from bs4 import BeautifulSoup
import urllib.request
from pdfminer.high_level import extract_text_to_fp
from nltk.corpus import stopwords 
from nltk.tokenize import word_tokenize 
import asyncio
import aiohttp

stop_words = set(stopwords.words('french'))

URLS = {
    "Enseignants chercheurs": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_TrieParCorps.html",
    "Enseignants chercheurs du Muséum national d'histoire naturelle": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_Museum_TrieParCorps.html",
    "ATER": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ATERListesOffresPubliees/ATEROffres_publiees_TriParSection.html",
    "PRAG/PRCE": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_2nd_TrieParDiscipline.html"
}

all_dfs = []

for key, url in URLS.items():
    with urllib.request.urlopen(url) as f:
        html = f.read().decode('utf-8')
    soup = BeautifulSoup(html, features="lxml")
    tables = soup.find_all('table', attrs={'class': 'tab'})
    if not tables:
        tables = soup.find_all('table', attrs={'id': '__bookmark_1'})
    table_body = tables[0]
    data = []
    rows = table_body.find_all('tr')
    for row in rows:
        cols = row.find_all('th')
        if not len(cols):
            cols = row.find_all('td')
        row_data = []
        for element in cols:
            link = element.find('a', href=True)
            if link:
                row_data.append(link['href'])
            else:
                row_data.append(element.text.strip())
        data.append(row_data)
    local_df = pd.DataFrame(data)
    header = local_df.iloc[0] 
    local_df = local_df[1:]
    local_df.columns = header
    local_df['Type de poste'] = key
    all_dfs.append(local_df)

df = pd.concat(all_dfs)

with open('raw_output.json', 'w') as f:
    f.write(df.to_json(orient='records'))
# Data Cleaning

labels = {
    "Établissement": ["Etablissement", "Etab"],
    "Sections": ["Section", "Section2", "Section3", "Sec1", "Sec2", "Sec3", "Sec4", "Sec5", "Sec6"],
    "Corps": ["Corps"],
    "Type de poste": ["Type de poste"],
    "Date de prise de fonction": ["Date de prise de fonction", "DatePriseDeFonct."],
    "Ouverture des candidatures": ["Date ouverture cand", "DateOuv.Cand."],
    "Fermeture des candidatures": ["Date cl\u00f4ture cand", "DateClo.Cand."],
    "Localisation du poste": ["Localisation", "Localisation\u00a0 appel \u00e0 candidatures"],
    "URL": ["R\u00e9f\u00e9rence GALAXIE", "NAppel \u00e0candidatures"],
    "Profil": ["Profil", "Profil\u00a0Appel \u00e0 candidatures"]
}

reverse_labels = {}
for new_label, old_labels in labels.items():
    for old_label in old_labels:
        reverse_labels[old_label] = new_label

new_rows = []

for columns, row in df.iterrows():
    new_row = defaultdict(lambda: set())
    for new_label, old_labels in labels.items():
        for old_label in old_labels:
            if old_label in row and not pd.isna(row[old_label]) and row[old_label]:
                new_row[new_label].add(row[old_label])

    flatten_row = {}
    for label, values in new_row.items():
        if len(values) == 1:
            flatten_row[label] = values.pop()
        else:
            flatten_row[label] = ", ".join(values)
    if 'URL' not in flatten_row:
        print("Error: skipping row because of missing URL")
        continue
    new_rows.append(flatten_row)

df = pd.DataFrame(new_rows)
df['ID'] = df.index

async def gather_with_concurrency(n, *tasks):
    semaphore = asyncio.Semaphore(n)

    async def sem_task(task):
        async with semaphore:
            return await task
    return await asyncio.gather(*(sem_task(task) for task in tasks))

async def process_url(df, url):
    async with aiohttp.ClientSession() as session:
        resp = await session.get(url)
        content = await resp.read()
        output_string = StringIO()
        pdf_file = BytesIO(content)
        extract_text_to_fp(pdf_file, output_string)
        print(url)
        df.loc[df['URL'] == url, ['pdf_content']] = output_string.getvalue()
        output_string.close()
        pdf_file.close()

async def main(df):
    await gather_with_concurrency(20, (*[process_url(df, url) for url in df['URL']]))

loop = asyncio.get_event_loop()
loop.run_until_complete(main(df))
loop.close()

custom_stop_words = {
    "heure de Paris",
}

for stop_word in custom_stop_words:
    df['pdf_content'] = df['pdf_content'].str.replace(stop_word, "")

df['pdf_content'] = df['pdf_content'].apply(lambda x: ' '.join([word for word in x.split() if word not in (stop_words)]))

with open('output.json', 'w') as f:
    f.write(df.to_json(orient='records'))
