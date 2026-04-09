
/**
 * 尝试修复截断的 JSON 字符串
 */
export const fixTruncatedJSON = (json: string): string => {
  let str = json.trim();
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const last = stack.pop();
        if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
          // 括号不匹配，可能是截断导致的错误，尝试回退
          if (last) stack.push(last);
        }
      }
    }
  }

  // 如果在字符串内被截断，先闭合字符串
  if (inString) {
    str += '"';
  }

  // 逆序闭合所有未闭合的括号
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') str += '}';
    else if (last === '[') str += ']';
  }

  return str;
};

/**
 * 清洗模型返回的内容，提取 JSON 并过滤思考过程
 */
export const cleanModelResponse = (content: string): string => {
  if (!content) return '';

  // 1. 移除思考过程和 Markdown 标记
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  
  // 处理可能未闭合的 <think> 标签（如果内容被截断）
  if (cleaned.includes('<think>')) {
    const parts = cleaned.split('</think>');
    if (parts.length > 1) {
      cleaned = parts[1].trim();
    } else {
      cleaned = cleaned.split('<think>')[0].trim();
    }
  }

  // 2. 移除 Markdown 代码块标记
  cleaned = cleaned.replace(/```json\n?/, '').replace(/\n?```/, '').trim();

  // 3. 寻找第一个 { 和最后一个 }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1) {
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      cleaned = cleaned.substring(firstBrace);
    }
  }

  return cleaned;
};
