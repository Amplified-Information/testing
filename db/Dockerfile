FROM postgres:18

# Set environment variables
ENV POSTGRES_USER=$POSTGRES_USER
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV POSTGRES_DB=$POSTGRES_DB

# Expose PostgreSQL port
EXPOSE 5432

# Any custom initialization scripts can be placed in /docker-entrypoint-initdb.d/
# They will be automatically executed during container startup
# COPY ./init.sql /docker-entrypoint-initdb.d/

# Custom PostgreSQL configuration could be added like this:
# COPY ./postgresql.conf /etc/postgresql/postgresql.conf