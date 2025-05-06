## Laskurisovellus

### Sovelluskehitys

Käynnistä tietokanta komennolla _docker compose up_

Tietokantayhteyttä varten tarvitaan tiedosto _.env_ jolla on seuraava sisältö:

```plaintext
DB_URL=postgresql://demo_user:demo_password@localhost:5432/demo_db
```

Käynnistä sovellus komennolla `npm run dev`

### Tuotantoversio

Lokaalisti, komennolla `npm start`.

Parempi idea, luomalla Docker-image.