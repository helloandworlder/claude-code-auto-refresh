import { config } from 'dotenv';
import { ClaudeGroup, AgentConfig } from './types';

config();

export function loadConfig(): AgentConfig {
  const groups: ClaudeGroup[] = [];
  
  // 优先使用新的统一配置方式
  const endpoint = process.env.CLAUDE_ENDPOINT;
  const apiKeysStr = process.env.CLAUDE_API_KEYS;
  
  if (endpoint && apiKeysStr) {
    const apiKeys = apiKeysStr.split(',').map(key => key.trim()).filter(key => key);
    
    apiKeys.forEach((apiKey, index) => {
      groups.push({
        id: `key_${index + 1}`,
        endpoint,
        apiKey
      });
    });
    
    console.log(`Loaded unified configuration: ${apiKeys.length} API keys with endpoint: ${endpoint}`);
  } else {
    // 回退到传统分组配置
    let groupIndex = 1;
    while (true) {
      const groupEndpoint = process.env[`CLAUDE_GROUP_${groupIndex}_ENDPOINT`];
      const groupApiKey = process.env[`CLAUDE_GROUP_${groupIndex}_API_KEY`];
      
      if (!groupEndpoint || !groupApiKey) {
        break;
      }
      
      groups.push({
        id: `group_${groupIndex}`,
        endpoint: groupEndpoint,
        apiKey: groupApiKey
      });
      
      groupIndex++;
    }
    
    console.log(`Loaded ${groups.length} Claude groups (legacy mode):`);
    groups.forEach(group => {
      console.log(`- ${group.id}: ${group.endpoint}`);
    });
  }
  
  if (groups.length === 0) {
    throw new Error('No valid Claude configuration found. Please set CLAUDE_ENDPOINT and CLAUDE_API_KEYS or use CLAUDE_GROUP_N_* format.');
  }
  
  return {
    groups,
    logLevel: process.env.LOG_LEVEL || 'info'
  };
}