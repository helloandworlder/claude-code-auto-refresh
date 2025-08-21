import { query } from '@anthropic-ai/claude-code';
import { ClaudeGroup } from './types';

export class ClaudeAgent {
  private group: ClaudeGroup;
  
  constructor(group: ClaudeGroup) {
    this.group = group;
  }
  
  async sendKeepAliveMessage(): Promise<boolean> {
    try {
      // 临时设置环境变量
      const originalBaseUrl = process.env.ANTHROPIC_BASE_URL;
      const originalApiKey = process.env.ANTHROPIC_API_KEY;
      
      process.env.ANTHROPIC_BASE_URL = this.group.endpoint;
      process.env.ANTHROPIC_API_KEY = this.group.apiKey;
      
      console.log(`[${this.group.id}] Sending keep-alive message to ${this.group.endpoint}`);
      
      // 发送简单的保活消息
      let responseContent = '';
      for await (const message of query({
        prompt: 'Please only output \'1\'',
        options: {
          maxTurns: 1
        }
      })) {
        if (message.type === 'assistant') {
          // 获取AI回复内容
          const msg = (message as any).message;
          if (msg && msg.content && msg.content[0] && msg.content[0].text) {
            responseContent += msg.content[0].text;
          }
        } else if (message.type === 'result' && !message.is_error) {
          console.log(`[${this.group.id}] Response: "${responseContent.trim() || (message as any).result || 'N/A'}" | Cost: $${message.total_cost_usd.toFixed(4)}`);
          break;
        } else if (message.type === 'result' && message.is_error) {
          console.error(`[${this.group.id}] Error response:`, message.subtype);
          break;
        }
      }
      
      // 恢复原始环境变量
      if (originalBaseUrl) {
        process.env.ANTHROPIC_BASE_URL = originalBaseUrl;
      } else {
        delete process.env.ANTHROPIC_BASE_URL;
      }
      
      if (originalApiKey) {
        process.env.ANTHROPIC_API_KEY = originalApiKey;
      } else {
        delete process.env.ANTHROPIC_API_KEY;
      }
      
      console.log(`[${this.group.id}] Keep-alive message sent successfully`);
      return true;
      
    } catch (error) {
      console.error(`[${this.group.id}] Failed to send keep-alive message:`, error);
      return false;
    }
  }
}