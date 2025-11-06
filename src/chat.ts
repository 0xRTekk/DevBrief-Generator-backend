import 'dotenv/config';
import OpenAI from 'openai';

// Schema import kept for future validation needs but unused in streaming mode.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { briefSchema } from './schema/brief.js';


function buildSystemPrompt(): string {
  return `You are “AegisBrief”, a senior Technical Product Owner and Pedagogical Architect specialized in generating realistic technical briefs for developers. 
Your role is to create JSON-structured briefs that describe real-world software projects faced by companies in various business domains.

Each brief must:
- Represent a real and meaningful business use case,
- Be tailored to the developer's level ('junior', 'intermediate', or 'senior'),
- Respect the given stack and tech focus (frontend, backend, or fullstack),
- Have achievable and measurable goals within the given duration,
- Follow the output schema precisely (valid JSON only).

You combine pedagogical expertise with realistic business insight.
Your briefs are concise, technically sound, and contextually relevant to the target industry.

The JSON schema is:

{
  "level": "junior",
  "domain": "FinTech",
  "tech_focus": "frontend",
  "stack": ["React", "TypeScript", "TailwindCSS"],
  "duration": "2 weeks",
  "brief": "Build a responsive dashboard to visualize user transactions and spending patterns.",
  "business_problem": "FinTech companies need intuitive dashboards to help users understand their finances and make informed decisions.",
  "target_users": "End users of a personal finance mobile app",
  "goals": [
    "Implement a transaction list with category filters",
    "Add monthly spending summaries and charts",
    "Optimize layout for mobile and desktop"
  ],
  "deliverables": [
    "Fully functional responsive web app",
    "Mock API or Supabase integration",
    "Documentation on architecture and design choices"
  ],
  "assessment_criteria": "Code clarity, UX design quality, and data visualization performance",
  "company_size": "Startup",
  "complexity": "medium"
}

⚙️ **Generation Rules:**
- Output must be valid JSON, no explanations or comments.
- Always use English.
- Adapt the realism and scope of the brief to the level and duration.
- Vary the business context and problem between generations.
- If multiple briefs are requested, output an array of JSON objects.
`;
}

function buildUserPrompt({
  level,
  domain,
  tech_focus,
  stack,
  duration,
  count = 3,
}: {
  level: "junior" | "intermediate" | "senior";
  domain: string;
  tech_focus: "frontend" | "backend" | "fullstack";
  stack: string[];
  duration: string;
  count?: number;
}) {
  return `Generate ${count} project briefs for :
{
  "level": "${level}",
  "domain": "${domain}",
  "tech_focus": "${tech_focus}",
  "stack": ${JSON.stringify(stack)},
  "duration": "${duration}"
}

Authoring guidelines:
1. Make the business_problem two vivid sentences that expose market tension and stakes.
2. Ensure goals are action-oriented, start with strong verbs, and stay within 12 words.
3. Deliverables must be tangible outputs teams can hand over at the end of the engagement.
4. Assessment criteria should cover success signals for UX, engineering quality, and business alignment.
5. Do not copy or lightly edit the example; invent a new scenario within FinTech.

Return ONLY the JSON object conforming to the schema.`;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Set it in your environment or .env file.');
    process.exit(1);
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    level: "junior",
    domain: "FinTech",
    tech_focus: "frontend",
    stack: ["React", "TypeScript", "TailwindCSS"],
    duration: "2 weeks",
    count: 3,
  });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const targetModel = 'gpt-4o-mini';

  const stream = await client.chat.completions.create({
    model: targetModel,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });

  console.log('--- streaming start ---\n');

  let hadContent = false;
  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      hadContent = true;
      process.stdout.write(content);
    }
  }

  if (!hadContent) {
    console.error('\n(No streamed content received)');
  }

  console.log('\n\n--- streaming end ---');
}

main().catch((err) => {
  console.error('Error:', err?.response?.data || err?.message || err);
  process.exit(1);
});
