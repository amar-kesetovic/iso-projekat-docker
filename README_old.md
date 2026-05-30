# Infrastruktura i servisi u oblaku 
## Projekat I - Dockerizacija

### Opis aplikacije
Aplikacija predstavlja jednostavnu web aplikaciju koja je imitacija baze podataka o studentima i njihovim ocjenama koje koriste studenstke službe fakulteta.
Aplikacija autentificira korisnika nakon čega mu je dostupna lista studenata, a klikom na svakog od njih prikazuju se njegovi detalji i daje mogućnost dodavanje nove ocjene. 
Aplikacija je implementirana mikroservisnom arhitekturom, gdje je user agent implementiran koristeći React framework i on vrši client-side rendering, dok podatke iz baze podataka dobiva pristup API endpoint-ima koje eksponira backend servis implementiran koristeći Python FastAPI. U pozadini, koristi se postgresql relaciona baza podataka.

### Repozitorij link
Repozitorij aplikacije dostupan je javno i to na linku: https://github.com/amar-kesetovic/iso-projekat-docker

### Softverski preduslovi 
U razvoju je korištena Docker verzija 29.4.0, build 9d7ad9f. Docker je generalno backward kompatibilan, pa su problemi minimalni.
Docker Compose može praviti problem i minimalno je potrebna verzija v2 za dati docker-compose.yaml, a korištena je Docker Compose version v5.1.2
Operativni sistem nema uticaja na sam docker image, njegov build niti pokrenuti container na bilo kom sistemu na kojoj je instaliran validan docker engine, ali kao napomena korištena verzija operativnog sistema je Ubuntu 24.04.4 LTS x86_64.

### Arhitektura aplikacije , opis servisa, mreža i volumena
Aplikacija koristi tri mikroservisa od kojih svaki ima svoju zadaću i funkcionalnost. 
Baza podataka za spremanje podataka je relaciona postgresql open source baza podataka čiji se oficijalni image koristi.
Korišteni image je postgres:15-alpine koji kao platform image koristi jako malu osnovnu verziju alpine linuxa.

Kako bi frontend mogao prikazivati podatke iz baze potreban je API koji će dohvatati te podatke i dostavljati ih frontend servisu koji ih prikazuje i renderuje na client strani. Backend API je implementiran koristeći FastAPI framework baziran na Python programskom jeziku.
Backend osigurava autentifikaciju korisnika, komunikaciju sa bazom podataka, i definira resurse koji su dostupni frontendu.

Frontend kao što je rečeno vrši client-side rendering modela iz baze podataka, a implementiran je koristeći React framework koji se transpajlira u JavaScript i izvršava nativno u pretraživaču. Frontend ima definirano nekoliko komponenti za prikaz kao što je login komponenta, dashboard lista studenata u bazi te student-details komponenta na kojoj je prikazan jedan student sa svojim ocjenama. Frontend upravlja routiranjem i navigacijom izmedju razlicitih komponenata. 

Svi servisi interno pripadaju mreži koja se kreira automatski kada se izvrši docker compose. Backend servis priča direktno na toj internoj docker mreži sa postgres servisom, dok frontend koji će se izvršavati u browseru na nekoj host mašini mora pričati direktno sa host domenom jer interna docker mreža browseru nije vidljiva, drugi način za ovo je korištenje proxy-a koji će stojati ispred svih servisa, i usmjeravati pozive interno među kontejnerima tamo gdje je definirano (obično se koristi nginx). Također ova mreža se automatski i briše kada containeri prestanu da rade jer više nije potrebna i ne koristi se, pa je docker compose down dovoljan za upravljanje resursima mreže. Svaki kontejner interno na toj mreži osluškuje neki port unutar tog kontejnera, dok da bi se moglo pristupiti tom kontejneru izvan njega potrebno je da kod pokretanja svakog servisa izvršimo mapiranje host portova u container portove. Kako su svi kontejneri na istoj docker internoj mreži svaki servis mora koristiti različi port. Frontend koriti port 5173, backend 8000, a postgres 5432 interno unutar docker mreže, a pristup izvan kontejnera na host mašini nije omogućen. Frontend i backend mapirani su na istim portovima i na host računaru, pa su dostupni preko localhost pseudo domene ali i direktno preko docker bridge virtualnog interfejsa kojeg host računar ima po defaultu.

Kako bi se omogćuila hot reload funkcionalnost osim što je potrebno koristiti funkcionalnosti servisa koje omogućavaju hot reload, prvi zadatak je bind mount source direktorija direktno na docker kontejner. Bind mount omogućava da docker container nema svoju kopiju tog direktorija, nego direktno koristi fajl sistem host računara. Tako svaka promjena u kodu na host računaru vidljiva je i unutar kontejnera, a servisi omogućavaju live preview tih promjena preko svojih internih funkcionalnosti dok aplikacije rade. Postgres ima imenovani volumen tako da sve podatke koje postgres servis (kontejner) u svom radu zapiše u write only sloj, ostaju prezervirane i dostupne su i kod sljedećeg pokretanja kontejnera. Imenovani volumen predstavlja kopiju direktorija sa host računara, pa za taj slučaj hot reload nije moguć ali nije ni potreban za ovaj servis. Frontend react aplikacija, i python backend aplikacija, u kontejnerima imaju bind mount volumen i omogućen hot reload i live preview. Frontend pored bind mount voluma, koristi i anonimni volume u kontejneru na /app/node_modules kako bi izbjegao konflikte sa lokalnim host node_modules, ovim je omogućeno da node_modules koji nastanu tijekom builda image-a komandom npm install budu persistirani u kontejneru.

### Upute za pokretanje 
Dovoljno je klonirati repozitoriju na računar i nakon toga koristeći neki interpreter bash programskog jezika pokrenuti skripte:
<code>pripremi_aplikaciju.sh</code> Radi inicijalni build svih servisa(njihovih image-a).
<code>pokreni_aplikaciju.sh</code> Pokreće kontejnere i istovremeno radi build ukoliko je potrebno.

Za gašenje svih pokrenutih servisa koristiti skriptu <code>zaustavi_aplikaciju.sh</code>
Za brisanje aplikacije, svih servisa, preuzetih image-a, kreiranih volumena koristiti skriptu <code>obrisi_aplikaciju.sh</code>

Nakon pokretanja svih servisa, client aplikaciji (frontend servis) moguće je pristupiti sa URL-om <code>localhost:5173</code>, dok je backend dostupan na <code>localhost:8000</code>.

### AI 
U implementaciji aplikacije korišten je Gemini CLI agent sa gemini-3.1-flash-lite-preview modelom, free tier.

Promptovi:
<code>Implementiraj minimalnu web aplikaciju koja se sastoji od tri servisa, frontend, backend i baza podataka koristeći React, FastAPI i postgresql tehnologije. Web aplikacija je mala baza podataka studenata i njihovih ocjena, postoji admin nalog koji nakon autentifikacije može da gleda sve studente u listi, a klikom na specificnog studenta gleda posebnu stranicu sa njegovim ocjenama i detaljima. Potrebno je implementirati login i logout funkcionalnosti. Treba omogućiti live preview funkcionalnosti za frontend i backend aplikaciju. Servisi će kasnije biti dockerizirani, i komunicirati docker mrežom. Koristi .env fajl i definiraj environment varijable, izbjegavaj hardkodirane vrijednosti.</code>

<code>Add a python script that seeds intial users into the database.</code>

Većina generisanog koda je prihvaćena osim malih izmjena, popravki u verzijama dependencies-a za React dio i problema sa navigacijom nakon login-a.
