# 🌍 Overseas Mobility Application - Ca' Foscari

Progetto per l'esame di **Tecnologie e Applicazioni Web (A.A. 2025/2026)** - Università Ca' Foscari Venezia.

## 📝 Descrizione del Progetto

Questa applicazione nasce per semplificare e digitalizzare la gestione delle principali fasi amministrative del periodo di studio fuorisede *Overseas* (pre-partenza, durante la mobilità e post-rientro) per gli studenti dell'Università Ca' Foscari.
L'applicativo gestisce il flusso completo dell'approvazione del Learning Agreement, il monitoraggio della mobilità e il riconoscimento degli esami tramite il Transcript of Records.

## ✨ Funzionalità Principali

Il sistema gestisce tre tipologie di utenti, ciascuno con permessi e viste dedicate (basic authentication in HTTP + token JWT):

🎓 **Studenti:**

* Creazione e gestione delle domande di mobilità (scelta istituzione ospitante, periodo, docente referente).
* Compilazione del mapping degli esami (esami esteri vs esami Ca' Foscari).
* Upload del *Learning Agreement* e proposta di modifiche durante la mobilità.
* Upload del *Transcript of Records* al rientro.

👨‍🏫 **Docenti Referenti:**

* Visualizzazione delle domande a loro assegnate.
* Valutazione (approvazione/rifiuto con motivazione) del *Learning Agreement* e delle sue successive modifiche.
* Approvazione finale degli esami sostenuti e dei relativi voti.

🏢 **Staff Ufficio Overseas:**

* Monitoraggio globale di tutte le pratiche.
* Validazione della fase pre-partenza.
* Chiusura definitiva della pratica una volta completato l'intero iter.

## 🏗️ Architettura

L'applicazione è sviluppata come una **Single Page Application (SPA)** con architettura a microservizi (eseguiti in container separati):

* **Frontend:** Angular.
* **Backend:** Node.js con Express (API RESTful in TypeScript).
* **Database:** MongoDB.
* **Infrastruttura:** Docker + Docker Compose.

## 🚀 Istruzioni per l'avvio (How to Run)

L'intero ambiente è dockerizzato per garantire un'esecuzione semplice e riproducibile, come richiesto dalle specifiche.

### Prerequisiti

* [Docker](https://www.docker.com/?utm_source=gemini) e [Docker Compose](https://docs.docker.com/compose/?utm_source=gemini) installati sul proprio sistema.

### Avvio dell'Applicazione

1. ```
   cd project/
   ```

2. ```
   docker compose up --build --detach
   ```

   *Nota: Il comando scaricherà le dipendenze, compilerà i sorgenti (Angular e Node.js) ed esporrà i servizi.*

3. **Accesso ai servizi:**

   * **Frontend (SPA Angular):** `http://localhost:4200`
   * **Backend (API REST):** `http://localhost:8080`
   * **DB (MongoDB):** `http://localhost:27017` 

### 🧪 Dati caricati al bootstrap dell’applicazione

Come da specifiche, all'avvio del backend il database viene **popolato automaticamente** con un set di dati di test (istituzioni partner, utenti fittizi per i tre ruoli, application di prova).

Puoi accedere al sistema utilizzando le seguenti credenziali di test:

* **Studente:** `student@student.it` / password: `student`/ role: `STUDENT`
* **Docente:**` lecturer@lecturer.it` / password: `lecturer`/ role: `LECTURER`
* **Ufficio:** `staff@staff.it` / password: `staff`/ role: `STAFF`

## 👥 Autori

* Manuel Rosace - 901771
