# Chatbot Expo with MCP Integration (Option A)

This project implements a polished chatbot application using Expo (Frontend) and a Node.js orchestrator (Backend) that integrates with two custom MCP (Model Context Protocol) servers for vehicle rental services.

## Features
- **Modern UI Showcase**: A professional homepage showing available vehicles (Cars & Motorcycles), inspired by premium rental services.
- **AI Rental Assistant**: A smart chatbot that can list vehicles, check prices, and handle bookings using MCP tools.
- **Backend Orchestrator**: Node.js/Express server that bridges the AI model and MCP servers.
- **MCP Servers**:
    - **Rental Query Server**: Handles vehicle availability and detail lookups.
    - **Rental Booking Server**: Handles the booking process for customers.

## Project Structure
- `backend/`: Node.js Express orchestrator.
- `frontend/`: Expo (React Native) mobile application.
- `mcp-servers/`: Custom MCP servers (Query & Modify).

## Setup & Running

### 1. Requirements
- Node.js (v18+)
- An OpenAI-compatible AI provider (Ollama, OpenRouter, or custom provider).

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your AI provider details:
   - `AI_BASE_URL`: The custom API endpoint.
   - `AI_API_KEY`: Your API key.
   - `AI_MODEL`: The model name (e.g., `deepseek-chat`).
4. `npm start`

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. Update `API_URL` in `App.tsx` with your computer's local IP address if testing on a real device.
4. `npx expo start`

## How it Works
The AI model uses the Model Context Protocol to interact with the local rental database.
- **Listing**: The model calls `query_list_available_vehicles` to show what's in stock.
- **Details**: The model calls `query_get_vehicle_details` for specific pricing.
- **Booking**: The model calls `modify_book_vehicle` to log a new rental request.

## Security Note
The `.env` file is ignored by Git to protect your API keys. Always use `.env.example` as a template for new environments.
