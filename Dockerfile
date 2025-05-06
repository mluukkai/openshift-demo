FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod -R 777 *

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
