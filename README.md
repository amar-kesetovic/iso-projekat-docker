# Vizualni prikaz infrastrukture


![enter image description here](https://i.imgur.com/ZStf0BZ.png)

# Procjena troškova 
![enter image description here](https://i.imgur.com/XGrOin0.png)
# Softverski preduslovi
- Terraform v1.15.5 on linux_amd64 korišten lokalno
- Deployment koristi skriptu za instaliranje docker servisa koji na osnovu OS instalira najnoviju dostupnu verziju.   
## Koraci za ručni deployment 
- Potrebno je kreirati VPC u VPC dashboardu klikom na opciju Create VPC. 
		- Odabrati opciju VPC and more gdje AWS za nas kreira route tabele i internet gateway 
		- Dati ime VPC 
		- Izabrati dvije AZ sa po jednim public i jednim private subnetom
		- Opcionalno promijeniti subnet prefix-e i kliknuti Create VPC 
		- Ostaviti štiklirano opcije Enable DNS hostnames 
		- Zatim otići u opciju NAT Gateways u lijevom sidebar-u i kliknuti Create NAT gateway 
		- Dodijelitim u ime i izabrati jedan od public subneta 
		- Postaviti connectivity type na Public. 
		- Postaviti alokaciju Elastic IP 
		- Kliknuti na Create NAT gateway
		- Nakon toga pronaći u Route tables tabelu ili tabele koje su povezane sa Private subnetima 
		- Kliknuti na Routes -> Edit routes -> Add route 
		- Postaviti destination 0.0.0.0/0 i target na kreirani NAT gateway.
- Potrebno je kreirati S3 bucket za pohranu slika klikom na Create bucket u S3 dashboard-u 
		- Dati neko ime koje mora biti globalno unikatno 
		- Odštiklirati *block public access* kako bi pristup bio moguć iz vana 
		- Kreirati i upload-ati slike 
- Kreirati security grupe klikom na opciju Security Groups u EC2 dashboard-u 
		- Kreirati 4 grupe redom: 
		- alb-sg, Inbound HTTP 80 from 0.0.0.0/0 
		- fe-sg, Inbound HTTP 80 from alb-sg, SSH 22 from 0.0.0.0/0
		- be-sg, Inbound TCP CUSTOM 8000 from alb-sg, SSH 22 from 0.0.0.0/0 
		- rds-sg, Inbound PostgreSQL 5432 from be-sg
- Kreirati relacijsku bazu podataka sa Aurora & RDS servisom 
		- U RDS dashboard-u kliknu ti na Create database
		- Izabrati template free tier
		- Podesiti master password na željeni password za bazu 
		- Postaviti bazu u kreirani VPC u prvom koraku, i dodati je u kreiranu rds-sg security grupu 
		- Onemogućiti public access do baze podataka 
		- Postaviti je u privatni subnet
- Kreirati target groups u EC2 Dashboard-u klikom na Target Groups pa Create 
		- Kreirati frontend-tg sa listenerom na portu 80, i dodijeliti je kreiranom VPC 
		- Kreirati backend-tg sa listenerom na portu 8000 i dodijeliti kreiranom VPC 
- Kreirati Application Load Balancer u EC2 Dashboardu 
		- Postaviti mapiranje na obje AZ i public subnete 
		- Dodijeliti ga u alb-sg security grupu
		- Postaviti ga da forwarda saobraćaj na portu 80 prema kreiranoj frontend-tg 
		- Kliknuti na ALB -> Listeners -> HTPP:80 -> Manage rules -> Add rule i dodati pravilo koje izvršava forward action prema tg-backend kada je putanja u zahtjevu /api/* (condition). 
		- Kreiranjem ALB dobiva se ALB DNS ime koje se koristi za pristup aplikaciji 
- Kliknuti na EC2 , zatim Launch Templates a zatim Create 
		- Izabrati Ubuntu 24.04 AMI, postaviti instancu na t2.micro i dodijeliti be-sg. 
		- Za CloudWatch potrebno je koristi IAM instance profile koji dolazi po default--u na AWS Academy sandbox-u, dok je u slučaju stvarnih account-a potrebno kreirati isti.
		- U advanced details pod user data ubaciti skriptu koja automatski klonira repozitoriju i pokreće docker kontejner te instalira sve zavisnosti prilikom prvog pokretanja instance.
		- **U user skripti obavezno zamijeniti vrijednosti environment varijabli koje se kreiraju na osnovu imena S3 Bucketa i RDS endpoint-a koji se dobiva kreiranjem baze, te popuniti odgovarajućim AWS kredencijalima.**
	

> Backend user data script
	
	#!/bin/bash
	
	set -e

	apt-get update -y
	apt-get install -y git curl wget

	curl -fsSL https://get.docker.com -o get-docker.sh
	sh get-docker.sh
	usermod -aG docker ubuntu

	wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
	dpkg -i -E ./amazon-cloudwatch-agent.deb

	cat <<EOF > /opt/aws/amazon-cloudwatch-agent/bin/config.json
	{
	  "metrics": {
	    "metrics_collected": {
	      "mem": { "measurement": ["mem_used_percent"] },
	      "disk": { "resources": ["/"], "measurement": ["disk_used_percent"] }
	    }
	  },
	  "logs": {
	    "logs_collected": {
	      "files": {
	        "collect_list": [
	          {
	            "file_path": "/var/lib/docker/containers/*/*.log",
	            "log_group_name": "DockerLogs",
	            "log_stream_name": "{instance_id}-backend"
	          }
	        ]
	      }
	    }
	  }
	}
	EOF

	/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s

	systemctl start docker
	systemctl enable docker

	cd /home/ubuntu
	git clone https://github.com/amar-kesetovic/iso-projekat-docker.git
	cd iso-projekat-docker

	cat <<EOF > .env
	DATABASE_URL=postgresql://postgres:adminpassword123@<RDS_ENDPOINT>:5432/postgres
	S3_BUCKET=<S3_BUCKET_NAME>
	S3_REGION=us-east-1
	AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
	AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
	AWS_SESSION_TOKEN=<AWS_SESSION_TOKEN>
	EOF

	docker compose -f docker-compose.prod.yml up -d backend
- Kreirati auto scaling grupu za backend instance
		- Klikom na ASG u EC2 dashboard-u potrebno je kreirati novu auto scaling grupu na osnovu prethodno kreiranog template-a za backend instance
		- Izabrati kreirani VPC u prvom koraku i oba privatna subneta
		- Postaviti desired, min i max broj instanci koje su nam potrebne 
		- Postaviti Scaling politiku tako da proširuje/smanjuje broj instanci zabisno od utilizacije CPU (70% threshold) 
		- Backend instance automatski će biti kreirane čim kreiranom ASG 
- CloudWatch Dashboard
		- Kreirati novi dashboard i dodati proizvoljne widgete na osnovu podataka koje prikupljanju CloudWatch agenti koji se automatski instaliraju prilikom prvog pokretanja instanci (backend i frontend skripte)
- Kreirati frontend instance ručno 
		- Launch instance opcija u EC2 dashboard-u 
		- Dodijeliti ime instanci 
		- Izabrati AMI koji se želi koristiti (Ubuntu 24.04 LTS) 
		- Izabrati t2.micro za tip instance ili drugi 
		- Kreirati novi key pair za SSH pristup instanci 
		- Dodijeliti instancu u VPC kreiran u prvom koraku 
		- Izabrati jedan public subnet za prvu instancu, drugi za drugu
		- Uključiti opciju auto-assign public IP (ssh pristup)
		- Dodijeliti instance fe-sg security grupi 
		- IAM Instance profile postaviti na default lab role ukoliko je sandbox okruženje ili kreirati novi IAM role za prave account-e 
		- U advanced details dodati u user data bash skriptu koja preuzima sve neophodno i pokreće docker kontejner sa frontend aplikacijom automatski pri prvom boot-u instance, **obavezno zamijeniti VITE_API_URL env varijablu sa ALB DNS imenom koje se dobije nakon kreiranja load balancer-a**.
	

> Frontend user data script
	 
	 #!/bin/bash


	set -e


	apt-get update -y
	apt-get install -y git curl wget


	curl -fsSL https://get.docker.com -o get-docker.sh
	sh get-docker.sh
	usermod -aG docker ubuntu


	wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
	dpkg -i -E ./amazon-cloudwatch-agent.deb


	cat <<EOF > /opt/aws/amazon-cloudwatch-agent/bin/config.json
	{
	  "metrics": {
	    "metrics_collected": {
	      "mem": { "measurement": ["mem_used_percent"] },
	      "disk": { "resources": ["/"], "measurement": ["disk_used_percent"] }
	    }
	  },
	  "logs": {
	    "logs_collected": {
	      "files": {
	        "collect_list": [
	          {
	            "file_path": "/var/lib/docker/containers/*/*.log",
	            "log_group_name": "DockerLogs",
	            "log_stream_name": "{instance_id}-frontend"
	          }
	        ]
	      }
	    }
	  }
	}
	EOF

	/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json -s


	systemctl start docker
	systemctl enable docker


	cd /home/ubuntu

	git clone https://github.com/amar-kesetovic/iso-projekat-docker.git
	cd iso-projekat-docker


	cat <<EOF > .env
	VITE_API_URL=http://<ALB_DNS_NAME>/api
	EOF

	docker compose -f docker-compose.prod.yml up -d frontend

	echo "Frontend deployment complete."

- Dodati novokreirane frontend instance u frontend-tg target grupu koja je kreirana.
- Nakon toga aplikacije je dostupna preko ALB DNS imena (nakon inicijalizacije i healthy statusa svih instanci koje su pokrenute)

## Koraci za pokretanje Terraform automatizacije 
U repozitoriju nakon ulaska u direktorij /terraform, ukucati sljedeće komande:
	- terraform init 
	- terraform plan (revizirati plan)
	- terraform apply (ukoliko smo zadovoljni sa planom, **i pokrećemo na AWS academy sandbox**)
	Nakon pokretanja posljednje komande dobivaju se tri prompta za unos AWS kredencijala nakon čega kreće kreiranje infrastrukture koja je definirana u terraform fajlovima. 
	Na kraju deploymenta kao izlaz dobivaju se ALB DNS name preko kojeg pristupa aplikaciji, S3 Bucket name koji je u ovom slučaju prepušten AWS-u da generiše unikatno ime, te RDS Endpoint kreirane baze podataka. 
	Nakon toga putem ALB DNS imena moguće je pristupiti aplikaciji. 
	Prilikom pokretanja terraform skripte za deployment izvan Sandbox okruženja, potrebno je koristiti komandu :
	***- terraform apply -var="use_existing_lab_role=false"***

Brisanje infrastrukture moguće je komandom: 
- terraform destroy

### Koraci za pristup aplikaciji 
Login očekuje korisnika sa sljedećim kredencijalima:
- Username : admin 
- Password : adminpassword

### Izazovi i problemi 
Osnovni izazov bio je priprema aplikacije za deployment. 
Prestali smo koristiti development servera na frontend i backend kontejnerima sa hot reload funkcijama, te uveli nginx na front end koji osigurava ispravno rutiranje unutar SPA, vite dev smo u potpunosti izbacili a fajlove buildane aplikacije poslužuje nginx. 
Kreiran je poseban docker compose config za produkciju u kojem je izbačen servis za bazu jer sada koristimo AWS RDS servis, i postavljeno je da svi kontejneri imaju restart : always opciju kako bi prilikom restara instance aplikacija automatski radila. 

Drugi problem bilo je pisanje user data skripti i osiguravanje da instance imaju skripte koje automatski instaliraju potreban software, kloniraju repozitorij i pokreću aplikaciju. 

### Korištenje AI alata 
AI alati su korišteni za refaktorisanje aplikacije tako da bude deployment ready, integracija nginx server-a, i dodavanje "proof of concept" prikaza slika dohvaćenih sa S3 bucket AWS servisa. 
Također, korišteno je za generisanje CloudFormation ekvivalenta sa terraform skriptom. 
Promptovi su usputno korišteni za otklanjanje raznih permission grešaka koje su se javljale zbog Sandbox okruženja. 
Korišteni alat je Gemini CLI Code Assist, a model je gemini-3-flash-preview (free tier).

 - [x] Refactor the project in this directory to be production-ready, stop using hot reload functionalities and development severs, switch to nginx instead. We don't need the database service anymore, create a new docker compose file to be used in production environment.
 - [x] How to configure a CloudWatch agent on EC2 instances?
 - [x] Introduce a new section on Dashboard.tsx to fetch and show images from S3 bucket.
 - [x] I need a smart way to handle IAM roles differently when using Sandbox Environment, and when someone with a real account runs terraform script. When in Sandbox, user lacks permission for creating IAM roles which are neccessary for CloudWatch, but we can use existing LabUser role. On real accounts, we can create an IAM role, and gemini said there are no default ones.
 - [x] Go into /terraform directory and generate a CloudFormation equivalent yaml.
 - [x] Internal 502 Gateway error...
			 -  Problem je bio što sam zaboravio postaviti port u DATABASE_URL.

### Link do video snimka prolaska kroz aplikaciju i infrastrukturu
https://www.youtube.com/watch?v=UmhdxyEVBJ8
