import { query } from '@anthropic-ai/claude-code';
import { ClaudeGroup } from './types';

export class ClaudeAgent {
  private group: ClaudeGroup;
  
  constructor(group: ClaudeGroup) {
    this.group = group;
  }
  
  async sendKeepAliveMessage(): Promise<boolean> {
    try {
      // 为本次调用构建独立环境，避免并发修改全局 env
      const env = {
        ...process.env,
        ANTHROPIC_BASE_URL: this.group.endpoint,
        ANTHROPIC_API_KEY: this.group.apiKey,
      } as Record<string, string>;

      // 超时控制，防止长时间挂起
      const timeoutMs = (() => {
        const raw = process.env.KEEPALIVE_TIMEOUT_MS;
        const n = raw ? parseInt(raw, 10) : NaN;
        return Number.isFinite(n) && n > 0 ? n : 60_000; // 默认 60s
      })();
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), timeoutMs);

      console.log(`[${this.group.id}] Sending keep-alive message to ${this.group.endpoint}`);

      // 发送简单的保活消息
      let responseContent = '';
      try {
        for await (const message of query({
          prompt: "Please only output '1'",
          options: {
            maxTurns: 1,
            env,
            abortController,
          }
        })) {
          if (message.type === 'assistant') {
            // 获取AI回复内容
            const msg = (message as any).message;
            if (msg && msg.content && msg.content[0] && msg.content[0].text) {
              responseContent += msg.content[0].text;
            }
          } else if (message.type === 'result' && !message.is_error) {
            const costVal = (message as any).total_cost_usd;
            const costStr = (typeof costVal === 'number' && Number.isFinite(costVal)) ? `$${costVal.toFixed(4)}` : 'N/A';
            const resultText = (message as any).result;
            console.log(`[${this.group.id}] Response: "${(responseContent || resultText || 'N/A').toString().trim()}" | Cost: ${costStr}`);
            break;
          } else if (message.type === 'result' && message.is_error) {
            console.error(`[${this.group.id}] Error response:`, (message as any).subtype);
            break;
          }
        }
      } finally {
        clearTimeout(timeout);
      }

      console.log(`[${this.group.id}] Keep-alive message sent successfully`);
      return true;
      
    } catch (error) {
      console.error(`[${this.group.id}] Failed to send keep-alive message:`, error);
      return false;
    }
  }
}
