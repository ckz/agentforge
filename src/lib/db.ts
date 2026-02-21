import { Redis } from '@upstash/redis';
import { Agent, Conversation, Deployment } from '@/types/agent';

const redis = Redis.fromEnv();

const KEYS = {
  AGENTS_LIST: 'agentforge:agents:list',
  AGENT: (id: string) => `agentforge:agent:${id}`,
  CONVERSATION: (id: string) => `agentforge:conversation:${id}`,
  DEPLOYMENT: (id: string) => `agentforge:deployment:${id}`,
  DEPLOYMENT_BY_AGENT: (agentId: string) => `agentforge:deployment:agent:${agentId}`,
};

export const db = {
  agents: {
    getAll: async (): Promise<Agent[]> => {
      const ids = await redis.smembers(KEYS.AGENTS_LIST);
      if (!ids || ids.length === 0) return [];
      
      const agents = await Promise.all(
        ids.map((id) => redis.get<Agent>(KEYS.AGENT(id as string)))
      );
      
      return agents
        .filter((a): a is Agent => a !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    getById: async (id: string): Promise<Agent | null> => {
      return await redis.get<Agent>(KEYS.AGENT(id));
    },

    create: async (agent: Agent): Promise<Agent> => {
      await redis.set(KEYS.AGENT(agent.id), agent);
      await redis.sadd(KEYS.AGENTS_LIST, agent.id);
      return agent;
    },

    update: async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
      const existing = await db.agents.getById(id);
      if (!existing) return null;

      const updated: Agent = { 
        ...existing, 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await redis.set(KEYS.AGENT(id), updated);
      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      const result = await redis.del(KEYS.AGENT(id));
      await redis.srem(KEYS.AGENTS_LIST, id);
      return result > 0;
    },
  },

  conversations: {
    getByAgentId: async (agentId: string): Promise<Conversation | null> => {
      const ids = await redis.smembers(KEYS.AGENTS_LIST);
      for (const id of ids) {
        const conv = await redis.get<Conversation>(KEYS.CONVERSATION(id as string));
        if (conv && conv.agentId === agentId) return conv;
      }
      return null;
    },

    save: async (conversation: Conversation): Promise<Conversation> => {
      await redis.set(KEYS.CONVERSATION(conversation.id), conversation);
      return conversation;
    },

    delete: async (id: string): Promise<boolean> => {
      const result = await redis.del(KEYS.CONVERSATION(id));
      return result > 0;
    },
  },

  deployments: {
    getByAgentId: async (agentId: string): Promise<Deployment | null> => {
      const deploymentId = await redis.get<string>(KEYS.DEPLOYMENT_BY_AGENT(agentId));
      if (!deploymentId) return null;
      return await redis.get<Deployment>(KEYS.DEPLOYMENT(deploymentId as string));
    },

    create: async (deployment: Deployment): Promise<Deployment> => {
      await redis.set(KEYS.DEPLOYMENT(deployment.id), deployment);
      await redis.set(KEYS.DEPLOYMENT_BY_AGENT(deployment.agentId), deployment.id);
      return deployment;
    },

    incrementRequestCount: async (id: string): Promise<void> => {
      const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
      if (deployment) {
        deployment.requestCount += 1;
        await redis.set(KEYS.DEPLOYMENT(id), deployment);
      }
    },

    toggleActive: async (id: string, isActive: boolean): Promise<void> => {
      const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
      if (deployment) {
        deployment.isActive = isActive;
        await redis.set(KEYS.DEPLOYMENT(id), deployment);
      }
    },

    delete: async (id: string): Promise<boolean> => {
      const deployment = await redis.get<Deployment>(KEYS.DEPLOYMENT(id));
      if (deployment) {
        await redis.del(KEYS.DEPLOYMENT_BY_AGENT(deployment.agentId));
      }
      const result = await redis.del(KEYS.DEPLOYMENT(id));
      return result > 0;
    },
  },
};

export default db;
