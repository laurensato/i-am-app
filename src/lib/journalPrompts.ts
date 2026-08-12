export const JOURNAL_PROMPTS = [
  'What are you aware of in your body right now?',
  'What thoughts have passed through your mind today?',
  'What stood out to you today, however small?',
  'What is present for you in this moment?',
  'What felt steady today? What felt unsettled?',
  'What did you notice about your energy through the day?',
  'What are you carrying right now?',
  'What shifted for you today, even slightly?',
  'What felt clear today? What felt unclear?',
  'What did you pay attention to today?',
  'What would you like to remember about today?',
  'What patterns are you noticing lately?',
  'What felt nourishing today? What felt draining?',
  'What surprised you today?',
  'What are you curious about right now?',
  'What felt unfinished when you paused just now?',
  'What did you learn about yourself today?',
  'What moved through you today — sensations, emotions, or reactions?',
  'Where did you feel most like yourself today?',
  'What do you want to acknowledge before you move on?',
  'What felt within your control today? What did not?',
  'What do you need more space for right now?',
  'What did you set aside today that is still with you?',
  'What felt loud today? What felt quiet?',
  'What are you noticing about how you speak to yourself?',
  'What moment from today would you like to look at more closely?',
  'What are you ready to put into words?',
  'What felt different about today compared to yesterday?',
  'What are you holding lightly? What are you holding tightly?',
  'What would honest reflection look like for you right now?',
] as const

export function pickJournalPrompt(exclude?: string): string {
  const pool = exclude
    ? JOURNAL_PROMPTS.filter(prompt => prompt !== exclude)
    : [...JOURNAL_PROMPTS]

  return pool[Math.floor(Math.random() * pool.length)] ?? JOURNAL_PROMPTS[0]
}
