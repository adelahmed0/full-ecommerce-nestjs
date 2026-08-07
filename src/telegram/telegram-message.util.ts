export type TelegramMessageKind = 'task' | 'instruction';

export function normalizeIncomingText(raw: string): string {
  return String(raw || '')
    .replace(/@\w+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyTelegramMessage(rawText: string): {
  kind: TelegramMessageKind;
  text: string;
  emptyBody: boolean;
} {
  const original = String(rawText || '').trim();
  let text = normalizeIncomingText(original);
  let forced: TelegramMessageKind | null = null;

  const commandMatch = text.match(
    /^\/(task|تاسك|instruction|تعليمة|تعليمات)(?:@\w+)?(?:\s+([\s\S]*))?$/i,
  );
  if (commandMatch) {
    const cmd = commandMatch[1].toLowerCase();
    forced = cmd === 'task' || cmd === 'تاسك' ? 'task' : 'instruction';
    text = (commandMatch[2] || '').trim();
  }

  const prefixMatch = text.match(
    /^(تعليمة|تعليمات|instruction|تاسك|task)\s*[:：\-]\s*([\s\S]+)$/i,
  );
  if (!forced && prefixMatch) {
    const label = prefixMatch[1].toLowerCase();
    forced = label === 'تاسك' || label === 'task' ? 'task' : 'instruction';
    text = prefixMatch[2].trim();
  }

  if (!text) {
    return {
      kind: forced || 'instruction',
      text: original,
      emptyBody: true,
    };
  }

  if (forced) {
    return { kind: forced, text, emptyBody: false };
  }

  const instructionHints =
    /تعليمة|تعليمات|قاعدة|ممنوع|من دلوقتي|خلي |خليه|متعملش|متعتمش|متشتغل|أوامر|سلوك|طريقة الشغل|سياسة|always|never|don't|do not|policy|process/i;
  const taskHints =
    /crud|api|endpoint|nestjs|mongo|postman|react|frontend|backend|شاشة|واجهة|صفحة|موديل|module|ضيف|أضف|نفّذ|نفذ|اعمل|اعملي|implement|feature|brand|categor|product|coupon|cart|order|review|supplier|tax/i;

  const looksInstruction = instructionHints.test(text);
  const looksTask = taskHints.test(text);

  if (looksInstruction && !looksTask) {
    return { kind: 'instruction', text, emptyBody: false };
  }
  if (looksTask && !looksInstruction) {
    return { kind: 'task', text, emptyBody: false };
  }
  if (looksInstruction && looksTask) {
    if (/قاعدة|ممنوع|من دلوقتي|تعليمة|تعليمات|خلي عادل|متعملش/.test(text)) {
      return { kind: 'instruction', text, emptyBody: false };
    }
    return { kind: 'task', text, emptyBody: false };
  }

  return { kind: 'instruction', text, emptyBody: false };
}
