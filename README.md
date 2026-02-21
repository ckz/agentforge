# AgentForge

Build and deploy AI agents powered by OpenRouter.

## Features

- **Agent Builder**: Create custom AI agents with name, role, system prompt, and model selection
- **Tool Designer**: Define tools with Zod schemas that agents can use
- **Live Chat**: Chat with your agents with real-time streaming responses
- **Agent Gallery**: Save and manage multiple agents with pre-built templates
- **API Deployment**: Deploy agents as REST endpoints with API key authentication

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Vercel AI SDK + OpenRouter (multi-provider LLM)
- **Database**: SQLite with better-sqlite3

## Getting Started

### Prerequisites

- Node.js 18+
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agentforge.git
cd agentforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your OpenRouter API key to .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Creating an Agent

1. Click "New Agent" or select a template from the gallery
2. Configure the agent:
   - Name: A friendly name for your agent
   - Role: The agent's role/specialty
   - System Prompt: Instructions for how the agent should behave
   - Model: Choose from OpenRouter's available models
   - Temperature: Control response creativity (0-2)
   - Tools: Add custom tools the agent can use

### Chatting with an Agent

1. Click "Chat" on any agent card
2. Type your message and press Enter
3. Watch the agent respond with real-time streaming

### Deploying an Agent API

1. Click the rocket icon on an agent card
2. The API endpoint and key will be copied to your clipboard
3. Use the endpoint to call your agent from any application:

```bash
curl -X POST https://your-domain.vercel.app/api/deploy/AGENT_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

## Available Models

- GPT-4o / GPT-4o Mini (OpenAI)
- Claude 3.5 Sonnet / Haiku (Anthropic)
- Gemini Pro 1.5 (Google)
- Llama 3.1 70B (Meta)
- DeepSeek Chat
- Mistral Large

## Project Structure

```
agentforge/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── agentforge/   # AgentForge-specific components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities and database
│   └── types/            # TypeScript type definitions
├── data/                 # SQLite database (auto-created)
└── public/               # Static assets
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com).

## License

MIT
