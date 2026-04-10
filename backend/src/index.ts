import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

async function createMcpClient(command: string) {
  if (!command) throw new Error("MCP server path command is missing");
  const [cmd, ...args] = command.split(' ');
  const transport = new StdioClientTransport({ command: cmd!, args });
  const client = new Client({ name: "orchestrator", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  return client;
}

let queryClient: Client;
let modifyClient: Client;

async function initMcp() {
  try {
    queryClient = await createMcpClient(process.env.QUERY_SERVER_PATH!);
    modifyClient = await createMcpClient(process.env.MODIFY_SERVER_PATH!);
    console.log("✅ Connected to MCP servers");
  } catch (error) {
    console.error("❌ Failed to connect to MCP servers:", error);
    process.exit(1); // Exit if critical dependencies fail
  }
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  try {
    const queryTools = await queryClient.listTools();
    const modifyTools = await modifyClient.listTools();

    const allTools = [
      ...queryTools.tools.map(t => ({
        type: 'function' as const,
        function: {
          name: `query_${t.name}`,
          description: t.description,
          parameters: t.inputSchema,
        }
      })),
      ...modifyTools.tools.map(t => ({
        type: 'function' as const,
        function: {
          name: `modify_${t.name}`,
          description: t.description,
          parameters: t.inputSchema,
        }
      }))
    ];

    let currentMessages = [...messages];
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: process.env.AI_MODEL || 'deepseek-chat',
        messages: currentMessages as any,
        tools: allTools.length > 0 ? allTools : undefined,
        tool_choice: allTools.length > 0 ? 'auto' : undefined,
      });

      const message = response.choices[0]!.message;

      // Clean the message object to remove extra fields that OpenAI SDK might add
      const cleanMessage = {
        role: message.role,
        content: message.content || "",
        tool_calls: message.tool_calls
      };

      currentMessages.push(cleanMessage);

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return res.json({ messages: currentMessages });
      }

      for (const toolCall of message.tool_calls) {
        const fullMethodName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        console.log(`🛠️ Calling tool: ${fullMethodName}`);

        try {
          if (fullMethodName.startsWith('query_')) {
            const methodName = fullMethodName.replace('query_', '');
            result = await queryClient.callTool({ name: methodName, arguments: args });
          } else if (fullMethodName.startsWith('modify_')) {
            const methodName = fullMethodName.replace('modify_', '');
            result = await modifyClient.callTool({ name: methodName, arguments: args });
          }

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        } catch (toolError: any) {
          console.error(`Error executing tool ${fullMethodName}:`, toolError);
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: toolError.message }),
          });
        }
      }
    }

    res.json({ messages: currentMessages });
  } catch (error: any) {
    console.error("❌ Chat error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await initMcp();
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
