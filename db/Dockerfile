# cd prism/db
# export VERSION=0.1.0
# docker build -t ghcr.io/prismmarketlabs/db:$VERSION .
# docker push ghcr.io/prismmarketlabs/db:$VERSION
# 
# source loadEnv.sh local
# docker run -p 5432:5432 -v /mnt/external/postgresdata:/var/lib/postgresql/data -e POSTGRES_USER=${DB_UNAME} -e POSTGRES_PASSWORD=${DB_PWORD} -e POSTGRES_DB=${DB_NAME} ghcr.io/prismmarketlabs/db:$VERSION

FROM postgres:18-alpine

CMD ["postgres"]
