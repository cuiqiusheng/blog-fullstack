import { ChatMessageRole } from '@/generated/prisma/client';
import { generateText } from '@/lib/llm';
import { normalizeOptionalText } from '../shared/textNormalization';

function sanitizeGeneratedTitle(raw: string | undefined): string | undefined {
  const normalized = normalizeOptionalText(raw?.replace(/["'`]/g, '').split('\n')[0]);
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, 80);
}

export async function generateSessionTitleFromMessages(
  userMessages: Array<{ role: ChatMessageRole; content: string }>,
) {
  const transcript = userMessages
    .filter(message => message.role === ChatMessageRole.USER)
    .map(message => `User: ${message.content}`)
    .join('\n');
  if (!transcript) {
    return undefined;
  }

  try {
    const raw = await generateText({
      prompt: [
        'Generate a concise chat topic title based on this conversation.',
        'Rules:',
        '- Return title only, no explanation.',
        '- Keep it under 12 words.',
        '- Prefer concrete technical keywords.',
        '',
        transcript,
      ].join('\n'),
      temperature: 0.2,
    });
    return sanitizeGeneratedTitle(raw);
  } catch {
    return undefined;
  }
}
