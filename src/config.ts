import { config } from 'dotenv';
import { ClaudeGroup, AgentConfig, ScheduleConfig } from './types';

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
  
  // 加载调度配置
  const schedule = loadScheduleConfig();
  
  return {
    groups,
    logLevel: process.env.LOG_LEVEL || 'info',
    schedule
  };
}

// 默认调度配置
const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  mode: 'hourly'
};

const DEFAULT_CUSTOM_CONFIG = {
  startHour: 9,
  endHour: 18,
  weekdays: [1, 2, 3, 4, 5] // 周一到周五
};

function loadScheduleConfig(): ScheduleConfig {
  const mode = process.env.SCHEDULE_MODE;
  
  if (!mode) {
    console.log('[CONFIG] SCHEDULE_MODE not set, using default: hourly');
    return DEFAULT_SCHEDULE_CONFIG;
  }
  
  if (mode === 'hourly') {
    console.log('[CONFIG] Using hourly schedule mode (24*7)');
    return { mode: 'hourly' };
  }
  
  if (mode === 'custom') {
    console.log('[CONFIG] Loading custom schedule configuration...');
    
    // 读取并校验开始小时
    let startHour = DEFAULT_CUSTOM_CONFIG.startHour;
    if (process.env.CUSTOM_START_HOUR) {
      const parsed = parseInt(process.env.CUSTOM_START_HOUR, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 23) {
        console.warn(`[CONFIG] Invalid CUSTOM_START_HOUR: ${process.env.CUSTOM_START_HOUR}, using default: ${DEFAULT_CUSTOM_CONFIG.startHour}`);
      } else {
        startHour = parsed;
      }
    } else {
      console.log(`[CONFIG] CUSTOM_START_HOUR not set, using default: ${DEFAULT_CUSTOM_CONFIG.startHour}`);
    }
    
    // 读取并校验结束小时
    let endHour = DEFAULT_CUSTOM_CONFIG.endHour;
    if (process.env.CUSTOM_END_HOUR) {
      const parsed = parseInt(process.env.CUSTOM_END_HOUR, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 23) {
        console.warn(`[CONFIG] Invalid CUSTOM_END_HOUR: ${process.env.CUSTOM_END_HOUR}, using default: ${DEFAULT_CUSTOM_CONFIG.endHour}`);
      } else {
        endHour = parsed;
      }
    } else {
      console.log(`[CONFIG] CUSTOM_END_HOUR not set, using default: ${DEFAULT_CUSTOM_CONFIG.endHour}`);
    }
    
    // 读取并校验工作日
    let weekdays = DEFAULT_CUSTOM_CONFIG.weekdays;
    if (process.env.CUSTOM_WEEKDAYS) {
      try {
        const parsed = process.env.CUSTOM_WEEKDAYS.split(',')
          .map(day => parseInt(day.trim(), 10))
          .filter(day => !isNaN(day) && day >= 0 && day <= 6);
        
        if (parsed.length === 0) {
          console.warn(`[CONFIG] Invalid CUSTOM_WEEKDAYS: ${process.env.CUSTOM_WEEKDAYS}, using default: [${DEFAULT_CUSTOM_CONFIG.weekdays.join(',')}]`);
        } else {
          weekdays = parsed;
        }
      } catch (error) {
        console.warn(`[CONFIG] Error parsing CUSTOM_WEEKDAYS: ${process.env.CUSTOM_WEEKDAYS}, using default: [${DEFAULT_CUSTOM_CONFIG.weekdays.join(',')}]`);
      }
    } else {
      console.log(`[CONFIG] CUSTOM_WEEKDAYS not set, using default: [${DEFAULT_CUSTOM_CONFIG.weekdays.join(',')}]`);
    }
    
    console.log(`[CONFIG] Custom schedule configured: ${startHour}:00-${endHour}:00 on weekdays [${weekdays.join(',')}] (0=Sunday, 1=Monday...)`);
    
    return {
      mode: 'custom',
      customStartHour: startHour,
      customEndHour: endHour,
      customWeekdays: weekdays
    };
  }
  
  console.warn(`[CONFIG] Unsupported SCHEDULE_MODE: ${mode}, falling back to default: hourly`);
  return DEFAULT_SCHEDULE_CONFIG;
}