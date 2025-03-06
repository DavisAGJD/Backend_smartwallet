# Usa una imagen base de Node.js
FROM node:14

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia el archivo package.json y package-lock.json (si lo tienes)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de tu código al contenedor
COPY . .

# Exponer el puerto en el que tu aplicación estará escuchando
EXPOSE 3000

# Comando para iniciar tu aplicación
CMD ["npm", "start"]