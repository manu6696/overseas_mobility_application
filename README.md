## 🌍 Gestione Mobilità Overseas - Ca' Foscari

**Progetto per l'esame di Tecnologie e Applicazioni Web (A.A. 2025/2026) - Università Ca' Foscari Venezia.**

---

## 📝 Descrizione del Progetto

Questa applicazione web nasce per semplificare e digitalizzare la gestione delle principali fasi amministrative della mobilità Overseas: prima della partenza, durante la mobilità e dopo il rientro. 
L'applicativo gestisce il flusso completo per gli studenti di Ca' Foscari, includendo l'approvazione del Learning Agreement, il monitoraggio della mobilità e il riconoscimento degli esami tramite il Transcript of Records[cite: 1].

## ✨ Funzionalità Principali

Il sistema gestisce tre tipologie di utenti, ciascuno con permessi e viste dedicate[cite: 1] (utilizzando token JWT per l'autenticazione[cite: 1]):

### 🎓 Studenti
* Creazione e gestione delle domande di mobilità (scelta istituzione ospitante, periodo, docente referente)[cite: 1].
* Compilazione del mapping tra gli esami esteri e quelli del piano di studi a Ca' Foscari[cite: 1].
* Upload del Learning Agreement[cite: 1].
* Proposta di modifiche al piano di studi e upload di versioni aggiornate del Learning Agreement durante la mobilità[cite: 1].
* Upload del Transcript of Records al rientro[cite: 1].

### 👨‍🏫 Docenti Referenti
* Visualizzazione delle domande a loro assegnate[cite: 1].
* Valutazione (approvazione o rifiuto con motivazione) del Learning Agreement e delle successive modifiche[cite: 1].
* Approvazione finale degli esami sostenuti all'estero e dei relativi voti[cite: 1].

### 🏢 Staff Ufficio Overseas
* Monitoraggio globale di tutte le pratiche[cite: 1].
* Validazione e registrazione del completamento della fase pre-partenza[cite: 1].
* Chiusura definitiva della pratica una volta completato l'intero iter[cite: 1].

## 🏗️ Architettura

L'applicazione è sviluppata come una Single Page Application (SPA)[cite: 1] con architettura a servizi (eseguiti in container separati[cite: 1]):

* **Frontend:** Angular[cite: 1]
* **Backend:** Node.js con Express (API RESTful in TypeScript o JavaScript)[cite: 1]
* **Database:** MongoDB[cite: 1]
* **Infrastruttura:** Docker + Docker Compose[cite: 1]

## 🚀 Istruzioni per l'avvio (How to Run)

L'intero ambiente è dockerizzato per garantire un'esecuzione semplice e riproducibile, in linea con le specifiche del progetto[cite: 1].

### Prerequisiti
* **Docker** e **Docker Compose** installati sul proprio sistema.

### Avvio dell'Applicazione
Apri un terminale, spostati nella root del progetto e avvia i container:

```bash
cd project/
docker compose up --build --detach
