export interface PromptBuildInput {
  topic: string;
  subtopic: string;
  minWords: number;
  maxWords: number;
}

export function buildArticlePrompt(input: PromptBuildInput): string {
  return [
    '你是一位资深技术写作者，请生成一篇中文技术文章。',
    `主题：${input.topic}`,
    `子主题：${input.subtopic}`,
    `目标字数范围：${input.minWords}-${input.maxWords}（中文字符数）`,
    '',
    '写作要求：',
    '1) 内容准确、可落地，避免空泛叙述。',
    '2) 必须包含：背景与问题、核心原理、代码示例/实践建议、常见误区、总结。',
    '3) 使用清晰小节，结构化表达，适合阅读 5-10 分钟。',
    '4) 不要输出 markdown 代码块围栏，不要输出多余解释。',
    '',
    '严格按照以下 JSON 输出（不要包含任何额外文本）：',
    '{',
    '  "title": "文章标题",',
    '  "content": "正文全文"',
    '}',
  ].join('\n');
}
