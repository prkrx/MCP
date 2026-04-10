import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "rental-query-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

const VEHICLES = [
  { id: "V1", type: "Car", model: "Toyota Avanza", pricePerDay: 500000, status: "Available" },
  { id: "V2", type: "Car", model: "Mitsubishi Xpander", pricePerDay: 600000, status: "Rented" },
  { id: "V3", type: "Motorcycle", model: "Honda Vario 160", pricePerDay: 150000, status: "Available" },
  { id: "V4", type: "Motorcycle", model: "Yamaha NMAX", pricePerDay: 200000, status: "Available" },
  { id: "V5", type: "Car", model: "Honda Brio", pricePerDay: 400000, status: "Available" },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_available_vehicles",
        description: "List all vehicles available for rent",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["Car", "Motorcycle"], description: "Filter by vehicle type" },
          },
        },
      },
      {
        name: "get_vehicle_details",
        description: "Get detailed information about a specific vehicle by ID or Model name",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Vehicle ID or Model name" },
          },
          required: ["search"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_available_vehicles") {
    let filtered = VEHICLES.filter(v => v.status === "Available");
    if (args?.type) {
      filtered = filtered.filter(v => v.type === args.type);
    }
    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
    };
  }

  if (name === "get_vehicle_details") {
    const search = String(args.search).toLowerCase();
    const vehicle = VEHICLES.find(v =>
      v.id.toLowerCase() === search || v.model.toLowerCase().includes(search)
    );
    if (vehicle) {
      return {
        content: [{ type: "text", text: JSON.stringify(vehicle, null, 2) }],
      };
    }
    return {
      content: [{ type: "text", text: "Vehicle not found." }],
      isError: true,
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Rental Query MCP Server running");
