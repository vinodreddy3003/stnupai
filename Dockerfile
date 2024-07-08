FROM node:18.20
WORKDIR /data
COPY . .
RUN npm install && npm install dotenv
EXPOSE 4000
CMD [ "node","server.js" ]