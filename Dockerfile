# Use Node.js 18 or 20
FROM node:20-slim

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies for everything
RUN npm install
RUN cd backend && npm install
RUN cd mcp-servers/query-server && npm install
RUN cd mcp-servers/modify-server && npm install

# In Docker, we can safely use ts-node
WORKDIR /app/backend
EXPOSE 4000

CMD ["npx", "ts-node", "src/index.ts"]
