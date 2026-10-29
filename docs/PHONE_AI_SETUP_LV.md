# Shah AI telefona asistenta pieslēgšana

Izvēlētais variants: Twilio + OpenAI Realtime. Klientiem paliek KPN numurs **020 341 2995**. Menedžeris apstiprināja, ka derīgas rezervācijas drīkst apstiprināt automātiski, jo vietas ir pieejamas.

## Sagatavotā darbība

Pirmā frāze: **“Goedendag, u spreekt met Shah Restaurant!”** Tālāk asistents paziņo, ka ir AI, un noskaidro klienta vajadzību. Valodas: nīderlandiešu un angļu.

Rezervācijai noskaidro vārdu, kontakttelefonu, datumu/gadu, laiku, viesu skaitu; e-pasts nav obligāts. Atkārto detaļas un gaida jaunu klienta piekrišanu pirms saglabāšanas. Rezervācija nonāk esošajā vienotajā datubāzē un adminā ar AI telefona atzīmi. Atkārtots apstiprinājums neveido dublikātu. Ja klients vēlas e-pastu, tas izmanto esošo Resend pieslēgumu.

Darba laiki: otrdien–svētdien 15:00–22:00, pirmdien slēgts. Social Deal 14:00 rezervācijas jāveic attiecīgajā platformā. Pēc noklusējuma nav vajadzīga manuāla pieejamības apstiprināšana; adminā var pēc izvēles ierobežot atsevišķu dienu.

## 1. OpenAI API konts

1. Atver https://platform.openai.com/ un izveido/pieslēdz kontu.
2. Izveido atsevišķu projektu, piemēram, “Shah Phone”.
3. Norēķinu sadaļā pievieno maksājumu veidu/kredītus un pārbaudi pieejamos tēriņu ierobežojumus. Brīdinājums pats par sevi nav garantēts izmaksu apturētājs.
4. Projekta API keys sadaļā izveido servera API atslēgu. Glabā droši; čatā/GitHub nesūti.
5. Settings → Project → General nokopē projekta ID, kas sākas ar proj_.

## 2. Twilio konts un jauns numurs

1. Atver https://www.twilio.com/ un izveido kontu.
2. Pievieno norēķinus un izpildi uzņēmuma/adreses pārbaudi.
3. Console → Phone Numbers → Manage → Buy a number.
4. Izvēlies Netherlands un Voice atbalstu. PIRMS pirkuma pārbaudi numura, sarunu un Elastic SIP izmaksas/saderību.
5. Iegādājies jaunu Nīderlandes AI/testa numuru. Esošo KPN numuru nepārnes un neatsaki.

## 3. OpenAI webhook

Settings → Webhooks izveido endpointu:

    https://shahrestaurant.nl/phone-ai/webhook

Notikums: realtime.call.incoming. Saglabā signing secret (whsec_…). Tas atšķiras no projekta API atslēgas. Šis kods izmanto Realtime, nevis GPT-Live notikumus.

## 4. Twilio SIP maršrutēšana

1. Console → Elastic SIP Trunking → Trunks → Create new SIP Trunk.
2. Nosauc “Shah AI”.
3. Origination → Add Origination URI:

    sip:proj_JUSU_PROJEKTA_ID@sip.api.openai.com;transport=tls

4. Aizvieto ID ar īsto projekta ID. API atslēgu šeit neliek.
5. Konfigurē TLS/drošos medijus pēc oficiālās SIP instrukcijas.
6. Trunk sadaļā Phone Numbers piesaisti jauno Twilio numuru.

Eiropas SIP endpointu izmanto tikai pēc projekta rezidences/tiesību pārbaudes; tikai adreses nomaiņa nepierāda visu datu glabāšanu ES.

## 5. Atslēgas serverī

Terminālī:

    ssh root@67.205.141.224
    cd /root/shahrestaurant/phone-agent
    python3 scripts/configure.py
    npm run check

Skripts slēpti paprasīs projekta API atslēgu un webhook signing secret, pēc tam jauno Twilio numuru formātā +31…. Nekopē atslēgas čatā.

Iestatījumi glabājas /root/shahrestaurant/.env.phone-agent ar tiesībām 0600. check izvada tikai stāvokli un trūkstošo iestatījumu nosaukumus.

Kad konti un maršrutēšana gatavi kontrolētam MAKSAS TESTAM:

    python3 scripts/configure.py --enable
    pm2 restart shah-phone-agent --update-env
    npm run check

Sākuma robežas: 30 zvani dienā, 4 minūtes katram, 3 vienlaikus. Izvēlies savam budžetam atbilstošu limitu. Tie nav precīzi eiro tēriņu limiti. KPN pāradresācija ar šīm komandām netiek mainīta.

## 6. Pārbaudi jauno numuru

Vispirms no cita telefona zvani TIKAI uz jauno Twilio numuru. Pārbaudi sveicienu, abas valodas, pārtraukšanu, vārdus/numurus, datumus, pirmdienas/neatļautu laiku, detaļu atkārtošanu un piekrišanu. Adminā jābūt vienai rezervācijai; izvēles e-pastam jāpienāk. Testa rezervāciju pēc pārbaudes atcel.

Pārbaudi arī kļūmes un alternatīvu zvanu maršrutu. Ja webhook atsaka galamērķi, pārbaudi Twilio To/P-Called-Party-ID galvenes un numura atļauto sarakstu; aizsardzību neizslēdz.

## 7. Tikai pēc veiksmīga testa — KPN

KPN standarta fiksētajā tālrunī tiešā pāradresācija:

    *21*JAUNAIS_NIDERLANDES_TWILIO_NUMURS#

Izmanto KPN pieņemto numura formātu. FRITZ!Box un biznesa līnijām instrukcija var atšķirties; KPN FRITZ!Box gadījumā min sākuma *#. Pēc tam no cita telefona zvani uz 020 341 2995 un pārbaudi AI.

Lai standarta KPN līnijai atceltu tiešo pāradresāciju:

    #21#

Darbinieka pārsūtīšanas galamērķim jābūt citam numuram, nevis jau pāradresētajam KPN vai AI numuram, lai neveidotu cilpu.

## Darbības robežas

AI ievēro menedžera norādi, ka vietas ir pieejamas; tas nav automātisks TheFork/Social Deal kalendāru savienojums. Ja nākotnē nepieciešams, Shah adminā konkrētai dienai ieslēdz limitu. Ierobežojuma skaits ir konservatīvs visam vakaram, nevis katram laikam.

Lietotne nesaglabā pilnu audioierakstu vai transkriptu. Pirms publiskas palaišanas pārbaudi OpenAI/Twilio datu apstrādes/glabāšanas iestatījumus un papildini privātuma informāciju par AI telefoniju. Ārējo piegādātāju glabāšana ir atsevišķa konfigurācija. Testi nevar pierādīt īstas balss kvalitāti, operatoru maršrutēšanu vai darbību visu piegādātāju kļūmju laikā.

## Oficiālie avoti

- https://developers.openai.com/api/docs/guides/voice-sip?voice-api=realtime
- https://developers.openai.com/api/docs/pricing
- https://www.twilio.com/en-us/blog/developers/tutorials/product/openai-realtime-api-elastic-sip-trunking
- https://www.twilio.com/en-us/voice/pricing/nl
- https://www.kpn.com/service/ugs/doorschakelen-vaste-telefoon
