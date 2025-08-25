import { config } from 'dotenv';
import { ClaudeGroup, AgentConfig, ScheduleConfig, ScheduleMode, CustomScheduleConfig } from './types';

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
  const scheduleMode = (process.env.SCHEDULE_MODE?.toLowerCase() as ScheduleMode) || ScheduleMode.HOURLY;
  let schedule: ScheduleConfig = {
    mode: scheduleMode
  };
  
  if (scheduleMode === ScheduleMode.CUSTOM) {
    const startTime = process.env.SCHEDULE_START_TIME;
    const endTime = process.env.SCHEDULE_END_TIME;
    const interval = parseInt(process.env.SCHEDULE_INTERVAL || '30');
    
    if (!startTime || !endTime) {
      throw new Error('SCHEDULE_START_TIME and SCHEDULE_END_TIME are required when SCHEDULE_MODE=custom');
    }
    
    // 验证时间格式
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('SCHEDULE_START_TIME and SCHEDULE_END_TIME must be in HH:mm format');
    }
    
    const customSchedule: CustomScheduleConfig = {
      startTime,
      endTime,
      interval: interval > 0 ? interval : 30
    };
    
    // 解析工作日配置
    if (process.env.SCHEDULE_WEEKDAYS) {
      const weekdays = process.env.SCHEDULE_WEEKDAYS
        .split(',')
        .map(d => parseInt(d.trim()))
        .filter(d => d >= 1 && d <= 7);
      
      if (weekdays.length > 0) {
        customSchedule.weekdays = weekdays;
      }
    }
    
    schedule.customSchedule = customSchedule;
    
    console.log(`Schedule Mode: CUSTOM`);
    console.log(`- Time Range: ${startTime} - ${endTime} ${endTime < startTime ? '(crosses midnight)' : ''}`);
    console.log(`- Interval: ${interval} minutes`);
    if (customSchedule.weekdays) {
      const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const days = customSchedule.weekdays.map(d => weekdayNames[d - 1]).join(', ');
      console.log(`- Weekdays: ${days}`);
    }
  } else {
    console.log(`Schedule Mode: HOURLY (default)`);
  }
  
  return {
    groups,
    logLevel: process.env.LOG_LEVEL || 'info',
    schedule
  };
}