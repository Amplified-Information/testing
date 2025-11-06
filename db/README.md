# postgres

## Command to run postgres

```bash
cd db
mkdir -p postgres_data

source .config.local
source .secrets.local 
docker run --rm -it -p $DB_PORT:$DB_PORT -e POSTGRES_USER=$DB_USER -e POSTGRES_PASSWORD=$DB_PASSWORD -e POSTGRES_DB=$DB_NAME -v ./postgres_data:/var/lib/postgresql/data postgres:15
```
