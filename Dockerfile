FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN adduser appuser
RUN chown -R appuser /app

USER appuser

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
