import { join } from 'node:path';

export default () => {
  const outputDir = process.env.OUTPUT_DIR ?? join(process.cwd(), 'output');
  return {
    app: {
      port: Number.parseInt(process.env.PORT ?? '3000', 10),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.TARGET_MODEL ?? 'gpt-4o-mini',
      temperature: Number.parseFloat(process.env.OPENAI_TEMPERATURE ?? '0.3'),
    },
    supabase: {
      projectUrl: process.env.SUPABASE_PROJECT_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
    },
    storage: {
      outputDir,
    },
  };
};
