import Database from 'better-sqlite3';
import path from 'path';
import { Agent, Conversation, Deployment } from '@/types/agent';

const dbPath = path.join(process.cwd(), 'data', 'agentforge.db');
const sqlite = new Database(dbPath);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    systemPrompt TEXT DEFAULT '',
    model TEXT DEFAULT 'openai/gpt-4o-mini',
    tools TEXT DEFAULT '[]',
    temperature REAL DEFAULT 0.7,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    messages TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    agentId TEXT NOT NULL,
    apiKey TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    requestCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agentId) REFERENCES agents(id)
  );
`);

export const db = {
  agents: {
    getAll: (): Agent[] => {
      const rows = sqlite.prepare('SELECT * FROM agents ORDER BY updatedAt DESC').all() as any[];
      return rows.map(row => ({
        ...row,
        tools: JSON.parse(row.tools || '[]'),
      }));
    },

    getById: (id: string): Agent | null => {
      const row = sqlite.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
      if (!row) return null;
      return {
        ...row,
        tools: JSON.parse(row.tools || '[]'),
      };
    },

    create: (agent: Agent): Agent => {
      const stmt = sqlite.prepare(`
        INSERT INTO agents (id, name, role, systemPrompt, model, tools, temperature, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        agent.id,
        agent.name,
        agent.role,
        agent.systemPrompt,
        agent.model,
        JSON.stringify(agent.tools),
        agent.temperature,
        agent.createdAt,
        agent.updatedAt
      );
      return agent;
    },

    update: (id: string, updates: Partial<Agent>): Agent | null => {
      const existing = db.agents.getById(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      const stmt = sqlite.prepare(`
        UPDATE agents SET name = ?, role = ?, systemPrompt = ?, model = ?, tools = ?, temperature = ?, updatedAt = ?
        WHERE id = ?
      `);
      stmt.run(
        updated.name,
        updated.role,
        updated.systemPrompt,
        updated.model,
        JSON.stringify(updated.tools),
        updated.temperature,
        updated.updatedAt,
        id
      );
      return updated;
    },

    delete: (id: string): boolean => {
      const result = sqlite.prepare('DELETE FROM agents WHERE id = ?').run(id);
      return result.changes > 0;
    },
  },

  conversations: {
    getByAgentId: (agentId: string): Conversation | null => {
      const row = sqlite.prepare('SELECT * FROM conversations WHERE agentId = ?').get(agentId) as any;
      if (!row) return null;
      return {
        ...row,
        messages: JSON.parse(row.messages || '[]'),
      };
    },

    save: (conversation: Conversation): Conversation => {
      const existing = sqlite.prepare('SELECT id FROM conversations WHERE id = ?').get(conversation.id);
      
      if (existing) {
        sqlite.prepare('UPDATE conversations SET messages = ? WHERE id = ?').run(
          JSON.stringify(conversation.messages),
          conversation.id
        );
      } else {
        sqlite.prepare(`
          INSERT INTO conversations (id, agentId, messages, createdAt)
          VALUES (?, ?, ?, ?)
        `).run(
          conversation.id,
          conversation.agentId,
          JSON.stringify(conversation.messages),
          conversation.createdAt
        );
      }
      return conversation;
    },

    delete: (id: string): boolean => {
      const result = sqlite.prepare('DELETE FROM conversations WHERE id = ?').run(id);
      return result.changes > 0;
    },
  },

  deployments: {
    getByAgentId: (agentId: string): Deployment | null => {
      const row = sqlite.prepare('SELECT * FROM deployments WHERE agentId = ?').get(agentId) as any;
      return row || null;
    },

    create: (deployment: Deployment): Deployment => {
      sqlite.prepare(`
        INSERT INTO deployments (id, agentId, apiKey, isActive, requestCount, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        deployment.id,
        deployment.agentId,
        deployment.apiKey,
        deployment.isActive ? 1 : 0,
        deployment.requestCount,
        deployment.createdAt
      );
      return deployment;
    },

    incrementRequestCount: (id: string): void => {
      sqlite.prepare('UPDATE deployments SET requestCount = requestCount + 1 WHERE id = ?').run(id);
    },

    toggleActive: (id: string, isActive: boolean): void => {
      sqlite.prepare('UPDATE deployments SET isActive = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    },

    delete: (id: string): boolean => {
      const result = sqlite.prepare('DELETE FROM deployments WHERE id = ?').run(id);
      return result.changes > 0;
    },
  },
};

export default db;
