# Usa una imagen base más reciente
FROM node:18

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia y verifica dependencias antes de copiar todo el código
COPY package*.json ./
COPY .env .env


# Instala las dependencias con --omit=dev para evitar paquetes innecesarios en producción
RUN npm install --omit=dev

# Copia el resto del código
COPY . .

# Exponer el puerto de la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
