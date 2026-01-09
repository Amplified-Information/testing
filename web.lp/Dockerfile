# export VERSION=0.3.0
# docker build -f ./Dockerfile -t ghcr.io/prismmarketlabs/web:$VERSION .
# docker push ghcr.io/prismmarketlabs/web:$VERSION
#
# docker run -p 5173:80 ghcr.io/prismmarketlabs/web:$VERSION
# http://localhost:5173

# BUILD stage
FROM node:24 AS build

WORKDIR /app/web

COPY ./package*.json ./

RUN npm install

COPY . /app/web

RUN npm run build

# RUN stage
FROM nginx:alpine

COPY --from=build /app/web/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
