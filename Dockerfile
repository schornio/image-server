# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./build .

EXPOSE 80

CMD [ "node", "index.js" ]