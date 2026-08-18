export interface AgentUserLike {
  id: string;
  name: string;
  email: string;
  role?: string;
}

/**
 * Utility function to format and deduplicate a list of raw agents/users
 * into standardized display names ("Admin", "Agent 1", "Agent 2", "Test User").
 */
export function formatAgents<T extends AgentUserLike>(rawAgents: T[]): T[] {
  const formattedMap = new Map<string, T>();

  for (const agent of rawAgents) {
    let displayName = agent.name;
    const lowerName = agent.name.toLowerCase();
    const lowerEmail = agent.email.toLowerCase();

    if (lowerName.includes("admin") || lowerEmail.includes("admin")) {
      displayName = "Admin";
    } else if (lowerName.includes("one") || lowerName.includes("1") || lowerEmail.includes("agent1")) {
      displayName = "Agent 1";
    } else if (lowerName.includes("two") || lowerName.includes("2") || lowerEmail.includes("agent2")) {
      displayName = "Agent 2";
    } else if (lowerName.includes("test") || lowerEmail.includes("test")) {
      displayName = "Test User";
    }

    if (!formattedMap.has(displayName)) {
      formattedMap.set(displayName, { ...agent, name: displayName });
    }
  }

  return Array.from(formattedMap.values());
}
