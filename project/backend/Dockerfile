
FROM node:22-bookworm-slim
LABEL maintainer="Manuel Rosace <901771@stud.unive.it>"

EXPOSE 8080

WORKDIR /app
COPY . /app
RUN npm install

CMD ["sh", "-c", "npm run compile && node postmessages"]
