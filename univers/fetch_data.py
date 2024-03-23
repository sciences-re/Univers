#!/usr/bin/env python3
import nltk
nltk.download('stopwords')
from io import StringIO, BytesIO
from collections import defaultdict
import pandas as pd
from bs4 import BeautifulSoup
import urllib.request
import pdfminer
from pdfminer.high_level import extract_text_to_fp
from pdfminer.pdfparser import PDFSyntaxError
from nltk.corpus import stopwords 
from nltk.tokenize import word_tokenize 
import asyncio
import aiohttp
from urllib.parse import urlparse
import json
import time

def download_galaxie(url):
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
    return local_df

def download_imt(url):
    with urllib.request.urlopen(url) as f:
        html = f.read().decode('utf-8')
    soup = BeautifulSoup(html, features="lxml")

    data = soup.find("div", attrs={"data-component":"PublicApp"})
    data = json.loads(data['data-props'])
    appConfig = data['appConfig']
    host = appConfig['site']['host']
    jobs = appConfig['offers']

    rows = []
    for job in jobs:
        job_href = f"https://{host}/o/{job['slug']}"
        values = {}
        values['city'] = job['city']
        values['tag'] = ", ".join(job['tags'])
        with urllib.request.urlopen(job_href) as f:
            html = f.read().decode('utf-8')
        soup = BeautifulSoup(html, features="lxml")
        application_data = soup.find('script', {'type':'application/ld+json'})
        try:
            data = json.loads("".join(application_data.contents))
            row = {}
            desc = BeautifulSoup(data['description'], features="lxml")
            row['Type de poste'] = "Enseignants chercheurs contractuels"
            row['Fiche'] = desc.text.lower()
            row['Établissement'] = values['tag']
            row['Ouverture des candidatures'] = data['datePosted']
            row['Localisation du poste'] = data['jobLocation'][0]['address']['addressLocality']
            row['Profil'] = data['title']
            row['URL'] = job_href

            keywords = set(map(str.lower, ["Maître", "Maitre", "Professeur", "Professor", "associate", "conférence"]))
            if len(keywords.intersection(set(soup.find('title').string.lower().split()))) == 0:
                continue
            print(job_href)
            rows.append(row)
        except AttributeError:
            print(f"Error with {job_href}")
    return rows



stop_words = set(stopwords.words('french'))

# Perform layout analysis for all text
laparams = pdfminer.layout.LAParams()
for param in ("all_texts", "detect_vertical", "word_margin", "char_margin", "line_margin", "boxes_flow"):
    paramv = locals().get(param, None)
    if paramv is not None:
        setattr(laparams, param, paramv)
setattr(laparams, 'all_texts', True)

GALAXIE_URLS = {
    "Enseignants chercheurs": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_TrieParCorps.html",
    "Enseignants chercheurs - prépublication": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_prepublies_TrieParCorps.html",
    "Enseignants chercheurs du Muséum national d'histoire naturelle": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_Museum_TrieParCorps.html",
    "Enseignants chercheurs du Muséum national d'histoire naturelle - prépublication": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_prepublies_Museum_TrieParCorps.html",
    "ATER": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ATERListesOffresPubliees/ATEROffres_publiees_TriParSection.html",
    "PRAG/PRCE": "https://www.galaxie.enseignementsup-recherche.gouv.fr/ensup/ListesPostesPublies/Emplois_publies_2nd_TrieParDiscipline.html"
}


all_dfs = []
imt = download_imt("https://institutminestelecom.recruitee.com/nos-offres-d-emploi")
all_dfs.append(pd.DataFrame(imt))
for key, url in GALAXIE_URLS.items():
    all_dfs.append(download_galaxie(url))

df = pd.concat(all_dfs)

with open('raw_output.json', 'w') as f:
    f.write(df.to_json(orient='records'))
# Data Cleaning

short_labels = {
    "Établissement": "Établissement",
    "Sections": "Sections",
    "Corps": "Corps",
    "Type de poste": "Type",
    "Date de prise de fonction": "Prise",
    "Ouverture des candidatures": "Ouverture",
    "Fermeture des candidatures": "Fermeture",
    "Localisation du poste": "Localisation",
    "URL": "URL",
    "Profil": "Profil",
    "Article": "Article",
    "Fiche": "Fiche"
}

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
    "Profil": ["Profil\u00a0Appel \u00e0 candidatures"],
    "Article": ["Article"],
    "Fiche": ["Fiche"],
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
                new_row[short_labels[new_label]].add(row[old_label])
        if new_label in row and not pd.isna(row[new_label]) and row[new_label]:
            new_row[short_labels[new_label]].add(row[new_label])

    flatten_row = {}
    for label, values in new_row.items():
        if len(values) == 1:
            flatten_row[label] = values.pop()
        else:
            flatten_row[label] = ", ".join(values)
    if 'URL' not in flatten_row:
        print("Error: skipping row because of missing URL")
        print(f"Row: {row}")
        continue
    new_rows.append(flatten_row)

df = pd.DataFrame(new_rows)
df['ID'] = df.index
df['Fiche'] = ""

async def gather_with_concurrency(n, *tasks):
    semaphore = asyncio.Semaphore(n)

    async def sem_task(task):
        async with semaphore:
            return await task
    return await asyncio.gather(*(sem_task(task) for task in tasks))

async def process_url(df, url):
    async with aiohttp.ClientSession() as session:
        print(f"Fetching {url}")
        for attempt in range(0,5):
            try:
                resp = await session.get(url)
            except aiohttp.client_exceptions.ClientConnectorError:
                continue
            except aiohttp.client_exceptions.ClientOSError:
                continue
            except aiohttp.client_exceptions.ClientPayloadError:
                continue
            break
        else:
            print(f"Could not fetch {url}, skipping.")
            return
        content = await resp.read()
        output_string = StringIO()
        pdf_file = BytesIO(content)
        try:
            extract_text_to_fp(pdf_file, output_string, laparams=laparams)
            df.loc[(df['URL'] == url), ['Fiche']] = output_string.getvalue().lower()
        except PDFSyntaxError:
            print(f"Error dealing with {url}, skipping it.")
            df.loc[df['URL'] == url, ['Fiche']] = ""
        output_string.close()
        pdf_file.close()

async def main(df):
    print(df.head())
    await gather_with_concurrency(20, *[process_url(df, url) for url in df[df['URL'].str.endswith('.pdf')]['URL']])

loop = asyncio.get_event_loop()
loop.run_until_complete(main(df))
loop.close()

custom_stop_words = {
    "heure de Paris",
}

for stop_word in custom_stop_words:
    df['Fiche'] = df['Fiche'].str.replace(stop_word, "")

# TODO: find a better way to filter out stop words
df['Fiche'] = df['Fiche'].apply(lambda x: ' '.join([word for word in x.split() if word not in (stop_words)]))

with open('output.json', 'w', encoding='utf-8') as f:
    f.write(df.to_json(orient='records', force_ascii=False))
