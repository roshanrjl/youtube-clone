# 1. Use official Node.js LTS image
FROM node:18-alpine

# 2. Set working directory inside the container
WORKDIR /youtube

# 3. Copy package files first (for caching)
COPY package*.json ./

# 4. Install dependencies
RUN npm install --production

# 5. Copy rest of the application code
COPY . .

# 6. Expose the port your server will run on
EXPOSE 5000

# 7. Start the backend server
CMD ["node", "src/index.js"]
