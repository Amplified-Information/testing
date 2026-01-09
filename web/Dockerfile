# cd prism # yes, need access to protos in other dirs
# export VERSION=0.1.0
# docker build -f ./web/Dockerfile -t ghcr.io/prismmarketlabs/web:$VERSION .
# docker push ghcr.io/prismmarketlabs/web:$VERSION
#
# docker run -p 5173:80 ghcr.io/prismmarketlabs/web:$VERSION

# BUILD stage
FROM node:24 AS build

WORKDIR /app/web

COPY ./web/package*.json ./

RUN npm install

COPY ./web /app/web

RUN npm run build

# RUN stage
FROM nginx:alpine

COPY --from=build /app/web/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
