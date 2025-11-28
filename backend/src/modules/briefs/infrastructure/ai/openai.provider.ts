import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiProvider {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use OpenAI.');
    }

    this.client = new OpenAI({ apiKey });
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<unknown> {
    const model = this.configService.get<string>('openai.model', 'gpt-4o-mini');
    const temperature = this.configService.get<number>('openai.temperature', 0.3);

    const response = await this.client.responses.create({
      model,
      temperature,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    } as any);

    const rawJson = response.output_text;

    if (!rawJson) {
      throw new InternalServerErrorException('OpenAI returned an empty response.');
    }

    try {
      return JSON.parse(rawJson);
    } catch (error) {
      throw new InternalServerErrorException('OpenAI returned an invalid JSON payload.');
    }
  }
}
