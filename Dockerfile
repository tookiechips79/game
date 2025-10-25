FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies using npm (production only)
RUN npm install --production

# Copy source code
COPY . .

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
