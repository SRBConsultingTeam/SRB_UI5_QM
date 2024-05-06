# Verwende das offizielle Node.js 14-Image als Basis
FROM node:18

# Setze das Arbeitsverzeichnis im Container
WORKDIR /usr/src/app

# Kopiere package.json und package-lock.json in das Arbeitsverzeichnis
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den Rest der Anwendung in das Arbeitsverzeichnis
COPY . .

# Setze den Port, den der Container exponieren soll
EXPOSE 3005

# Starte die Anwendung
CMD ["npm", "start"]