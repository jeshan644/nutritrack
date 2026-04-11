import type { AIFoodItem } from '../types';

const SYSTEM_PROMPT = `You are a nutrition expert. The user will describe a meal they ate. Extract each food item and its estimated quantity, then return ONLY a JSON array with no markdown, no explanation, no code blocks. Format: [{"name":"...","quantity_g":100,"calories":100,"protein_g":10,"carbs_g":20,"fat_g":5,"fiber_g":2}]. Use standard nutrition databases for values. If quantity is unclear, assume a typical serving. Always return valid JSON array.`;

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

export function isAiConfigured(): boolean {
  return !!API_KEY;
}

export async function parseNaturalLanguageMeal(text: string): Promise<AIFoodItem[]> {
  if (!API_KEY) throw new Error('AI meal parsing is not configured.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const content = (data.content?.[0]?.text || '') as string;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
  return parsed as AIFoodItem[];
}
