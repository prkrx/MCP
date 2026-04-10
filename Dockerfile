# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Install dependencies for all parts
RUN npm install
RUN cd backend && npm install
RUN cd mcp-servers/query-server && npm install
RUN cd mcp-servers/modify-server && npm install

# Build the backend (compile TS to JS)
WORKDIR /app/backend
RUN npx tsc

# Production Stage
FROM node:20-slim

WORKDIR /app

# Copy compiled backend and all required dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/mcp-servers ./mcp-servers

# Ensure MCP servers have their dependencies
# They are already in the mcp-servers folders from the builder stage

WORKDIR /app/backend
EXPOSE 4000

# Run the compiled JavaScript using pure Node.js
CMD ["node", "dist/index.js"]
