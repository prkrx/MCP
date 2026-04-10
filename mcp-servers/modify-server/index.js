import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "rental-booking-server",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

const bookings = [];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "book_vehicle",
        description: "Create a new booking for a car or motorcycle",
        inputSchema: {
          type: "object",
          properties: {
            vehicleId: { type: "string", description: "The ID of the vehicle to rent" },
            customerName: { type: "string", description: "Name of the customer" },
            durationDays: { type: "number", description: "Number of days for rental" },
            startDate: { type: "string", description: "Start date of rental (YYYY-MM-DD)" },
          },
          required: ["vehicleId", "customerName", "durationDays"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "book_vehicle") {
    const bookingId = `BK-${Math.floor(Math.random() * 10000)}`;
    const newBooking = {
      bookingId,
      timestamp: new Date().toISOString(),
      ...args
    };
    bookings.push(newBooking);

    return {
      content: [{
        type: "text",
        text: `Booking Successful!\nBooking ID: ${bookingId}\nVehicle ID: ${args.vehicleId}\nCustomer: ${args.customerName}\nDuration: ${args.durationDays} days.\nOur team will contact you shortly for confirmation.`
      }],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Rental Booking MCP Server running");
