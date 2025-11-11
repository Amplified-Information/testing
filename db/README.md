# postgres

## Command to run postgres

```bash
cd db
mkdir -p postgres_data

source .config.local
source .secrets.local 
docker run --rm -it -p $DB_PORT:$DB_PORT -e POSTGRES_USER=$DB_UNAME -e POSTGRES_PASSWORD=$DB_PWORD -e POSTGRES_DB=$DB_NAME -v ./postgres_data:/var/lib/postgresql/data postgres:15
```

## postgres cli client

`sudo apt-get install postgresql-client`

`psql`

You can connect with (prompted for password):

`psql -h 127.0.0.1 -d your_db_name -U your_db_user`

## postgresql extension

Use the VSCode postgresql extension (`ms-ossdata.vscode-pgsql`) for connecting to the database.
