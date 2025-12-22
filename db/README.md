# postgres

## Command to run postgres

```bash
cd db
mkdir -p /mnt/external/postgresdata

source ./loadEnv.sh local
docker run --rm -it -p 5432:5432 -e POSTGRES_USER=$DB_UNAME -e POSTGRES_PASSWORD=$DB_PWORD -e POSTGRES_DB=$DB_NAME -v /mnt/external/postgresdata:/var/lib/postgresql postgres:18
```

## postgres cli client

`sudo apt-get install postgresql-client`

`psql`

You can connect with (prompted for password):

`psql -h 127.0.0.1 -d your_db_name -U your_db_user`

## postgresql extension

Use the VSCode postgresql extension (`ms-ossdata.vscode-pgsql`) for connecting to the database.
