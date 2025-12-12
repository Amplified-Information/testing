# BUILD stage
# cd prism
# docker build -f ./web/Dockerfile -t ghcr.io/prismmarketlabs/web:VERSION .
FROM node:24 AS build

WORKDIR /app/web

COPY package*.json ./

RUN npm install

COPY ./web /app/web

RUN npm run build

# RUN stage
# docker run -p 5173:80 ghcr.io/prismmarketlabs/web:VERSION
FROM nginx:alpine

COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
