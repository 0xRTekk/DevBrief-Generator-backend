import 'dotenv/config';
import OpenAI from 'openai';
import { pipeline } from '@xenova/transformers';
import { parseCliArgs } from './cliArgs.js';
import { buildSystemPrompt, buildUserPrompt } from './prompts.js';
import { writeBriefsToFile } from './outputWriter.js';
import { createOpenAIClient } from './openaiClient.js';
import { createSupabaseClient } from './supabaseClient.js';
import { briefSchema, type ProjectBrief } from './schema/brief.js';

async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY. Set it in your environment or .env file.');
  }
  return createOpenAIClient(apiKey);
}

function getSupabaseClient() {
  const supabaseProjectUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseProjectUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_PROJECT_URL or SUPABASE_ANON_KEY. Set them in your environment or .env file.');
  }
  return createSupabaseClient(supabaseProjectUrl, supabaseAnonKey);
}

async function getResponseFromOpenAI(client: OpenAI, userPrompt: string, systemPrompt: string, targetModel: string) {
  const responsePayload = {
    model: targetModel,
    temperature: 0.3,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  } as any;

  const response = await client.responses.create(responsePayload);

  const rawJson = response.output_text;

  if (!rawJson) {
    throw new Error('No content received from OpenAI response.');
  }

  return JSON.parse(rawJson);
}

async function writeBriefsToFilepath(briefs: unknown) {
  const filePath = await writeBriefsToFile(briefs);
  console.log(`Briefs saved to ${filePath}`);
  return filePath;
}

function parseBriefs(json: unknown): ProjectBrief[] {
  if (Array.isArray(json)) {
    return json.map(parseSingleBrief);
  }
  return [parseSingleBrief(json)];
}

function parseSingleBrief(json: unknown): ProjectBrief {
  const result = briefSchema.safeParse(json);
  if (!result.success) {
    throw new Error(`Invalid JSON format: ${result.error.message}`);
  }
  return result.data;
}

async function insertBriefInDB(supabaseClient: any, brief: ProjectBrief, embedding: number[]) {
  const briefRow = {
    level: brief.level,
    domain: brief.domain,
    tech_focus: brief.tech_focus,
    stack: brief.stack,
    duration: brief.duration,
    brief: brief.brief,
    business_problem: brief.business_problem,
    target_users: brief.target_users,
    goals: brief.goals,
    deliverables: brief.deliverables,
    assessment_criteria: brief.assessment_criteria,
    company_size: brief.company_size,
    complexity: brief.complexity,
    embedding: embedding,
  };

  const { data, error } = await supabaseClient
    .from('briefs')
    .insert(briefRow)
    .select()
    .single();

  if (error) {
    throw new Error(`Error inserting brief into database: ${error.message}`);
  }

  const briefId = data.id;

  const userStoryRows = brief.user_stories.map((story, index) => ({
    brief_id: briefId,
    story_order: index + 1,
    title: story.title,
    description: story.description,
    acceptance_criteria: story.acceptance_criteria,
    priority: story.priority,
    complexity: story.complexity,
  }));

  const { error: userStoriesError } = await supabaseClient
    .from('brief_user_stories')
    .insert(userStoryRows);

  if (userStoriesError) {
    throw new Error(`Error inserting brief user stories into database: ${userStoriesError.message}`);
  }

  console.log('Brief inserted into database with ID:', briefId);

  return {
    brief: data,
    userStoriesInserted: userStoryRows.length,
  };
}

async function main() {
  const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small');

  const supabaseClient = getSupabaseClient();
  const cliArgs = parseCliArgs();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(cliArgs);
  const targetModel = 'gpt-4o-mini';

  const client = await getOpenAIClient();
  const jsonParsedResponse = await getResponseFromOpenAI(client, userPrompt, systemPrompt, targetModel)
  console.log('jsonParsedResponse : ', jsonParsedResponse);
  const briefs = parseBriefs(jsonParsedResponse);
  console.log('parsed briefs : ', briefs);

  const insertionSummaries = [];
  
  for (const brief of briefs) {
    // Generate a vector using Transformers.js
    const output = await generateEmbedding(JSON.stringify(brief), {
      pooling: 'mean',
      normalize: true,
    })
    // Extract the embedding output
    const embedding = Array.from(output.data)

    const result = await insertBriefInDB(supabaseClient, brief, embedding);
    insertionSummaries.push(result);
  }

  console.log('Inserted Briefs:', insertionSummaries);
  await writeBriefsToFilepath(jsonParsedResponse);
}

main().catch((err) => {
  console.error('Error:', err?.response?.data || err?.message || err);
  process.exit(1);
});
