# PM2: vietņu palaišana un procesu saraksta sakārtošana

Vietņu koda un GitHub izmaiņas publicē pats administrators. Šī instrukcija pati
neko nepalaiž. Komandas zemāk ir paredzētas esošajam DigitalOcean serverim,
kurā PM2 darbojas kā `root`.

Pārbaudē visi PM2 ieraksti bija `stopped`. Četri domēni atgrieza 502, jo
Nginx veda uz apturētajiem procesiem. Pēc laidienu publicēšanas vecie PM2
ieraksti bija palikuši sarakstā. Datums nosaukumā atšķir laidienus, bet
nosaukums pats nenosaka, kura versija apkalpo domēnu.

| Pakalpojums | Pārbaudē konfigurētais process | Nginx ports | Nosaukums turpmāk |
| --- | --- | ---: | --- |
| eattogo.nl | `eattogo-footer-20261114` | 4320 | `eattogo` |
| shahrestaurant.nl | `shahrestaurant-20261114` | 4305 | `shahrestaurant` |
| themaison.nl | `themaison-20261114` | 4301 | `themaison` |
| thetandoorcompany.nl | `thetandoorcompany-20261114` | 4302 | `thetandoorcompany` |
| Shah telefona asistents | `shah-phone-agent` | 3010 | `shah-phone-agent` |
| shahtogo.nl | Publicēšana vēl nav paredzēta; `shahtogo-20261114` ir apturēts ieraksts | Nginx pārbaudē nav savienojuma | `shahtogo`, kad publicēsi |

## 1. Atjauno jau izvietotos pakalpojumus

Terminālī pēc pieslēgšanās serverim pārbaudi `pm2 list`. Ja saraksts ir tāds
pats kā tabulā un ieraksti ir apturēti, palaid esošos procesus:

```bash
pm2 start eattogo-footer-20261114 shahrestaurant-20261114 themaison-20261114 thetandoorcompany-20261114 shah-phone-agent
pm2 list
```

Ja kāds jau ir `online`, to nav jāpārstartē. Nelieto `pm2 start all`:
sarakstā ir arī citi un veci procesi. Shah To Go šajā solī nepalaiž.

Atver četrus domēnus un pārbaudi arī zvanu uz telefona asistentu. The Maison
pāreja uz Shah Restaurant ir sagaidāma. Statusu vari pārbaudīt arī no servera:

```bash
for domain in eattogo.nl shahrestaurant.nl themaison.nl thetandoorcompany.nl; do
  printf '%s ' "$domain"
  curl -sS --max-time 15 -o /dev/null -w '%{http_code} %{redirect_url}\n' \
    --resolve "$domain:443:127.0.0.1" "https://$domain/"
done
```

Ja ir 5xx vai process nav stabils, pirms tīrīšanas apskati
`pm2 logs PROCESA_NOSAUKUMS --lines 30 --nostream` un pārbaudi norādīto portu.
`online` apliecina, ka process ir palaists; domēna pārbaude apliecina, ka Nginx
var to sasniegt.

## 2. Paturi pa vienam pastāvīgam nosaukumam

Dari to pēc tam, kad vietnes darbojas. Pārbaudi, vai īsie nosaukumi
`eattogo`, `shahrestaurant`, `themaison` un `thetandoorcompany` joprojām
ir vecie un apturētie ieraksti. Ja kaut kas mainījies, vispirms salīdzini
`pm2 show NOSAUKUMS` norādītās darba mapes un portus ar Nginx.

Pirms PM2 tīrīšanas saglabā iepriekš saglabātā saraksta kopiju, ja fails
pastāv. Atstāj to serverī: tajā var būt vides iestatījumi.

```bash
if [ -f /root/.pm2/dump.pm2 ]; then
  install -m 600 /root/.pm2/dump.pm2 "/root/.pm2/dump.before-cleanup.$(date +%Y%m%d-%H%M%S).pm2"
fi
```

Noņem vecos īso nosaukumu ierakstus un piešķir šos nosaukumus pārbaudītajiem
laidieniem. Drošāk darīt pa vienai vietnei: pēc katra pāra pārbaudi domēnu.
`pm2 delete` noņem PM2 ierakstu; tas nedzēš projekta failus vai datubāzi.
Pārdēvēšanas laikā process īsi pārstartējas.

```bash
pm2 delete eattogo && pm2 restart eattogo-footer-20261114 --name eattogo
pm2 delete shahrestaurant && pm2 restart shahrestaurant-20261114 --name shahrestaurant
pm2 delete themaison && pm2 restart themaison-20261114 --name themaison
pm2 delete thetandoorcompany && pm2 restart thetandoorcompany-20261114 --name thetandoorcompany
```

`shah-phone-agent` jau ir pareizais nosaukums. Ja `shahtogo-20261114`
joprojām ir apturēts un Nginx neizmanto šo laidienu, vari noņemt arī tā PM2
ierakstu ar `pm2 delete shahtogo-20261114`. Kad vēlāk pats publicēsi Shah To Go,
reģistrē to kā `shahtogo`.

`labrasa` un `rotiqueen` ir atsevišķi projekti. Pārbaudē Nginx noklusējuma
serveris veda uz La Brasa portu un `clientshows.com` veda uz Roti Queen portu.
Atstāj šos ierakstus, kamēr nav skaidrs, vai šie pakalpojumi vēl jāsaglabā.
Ja tie vairs nebūs vajadzīgi, noņem tos atsevišķi. Pēc tīrīšanas palaid
`pm2 save`, ja sarakstā ir tikai tie pakalpojumi, kurus vēlies atjaunot pēc
servera pārstartēšanas. Tad pārbaudi `pm2 list`.

## Nākamie laidieni

Pirms publicēšanas pārbaudi `pm2 show NOSAUKUMS` redzamo darba mapi.
Pārdēvēšana nemaina mapi, no kuras darbojas lietotne. Pārbaudē četri domēni
izmantoja laidienus zem `/root/restaurant-transitions/20261114/`, tāpēc
`git pull` vecajā projekta kopijā vien šos domēnus neatjaunos. Vispirms
sagatavo un pārbaudi jauno būvējumu, tad piesaisti to esošajam pastāvīgajam
nosaukumam. Pārbaudi domēnu un saglabā PM2 sarakstu. Datumu glabā laidiena
mapes nosaukumā.

[PM2 procesu pārvaldība](https://pm2.keymetrics.io/docs/usage/process-management/)
