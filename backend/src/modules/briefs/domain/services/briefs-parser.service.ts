import { Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { briefSchema, type ProjectBrief } from '../schema/brief.schema';

@Injectable()
export class BriefsParser {
  parse(raw: unknown): ProjectBrief[] {
    if (Array.isArray(raw)) {
      return raw.map((item) => this.parseSingle(item));
    }

    return [this.parseSingle(raw)];
  }

  private parseSingle(raw: unknown): ProjectBrief {
    try {
      return briefSchema.parse(raw);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid brief payload: ${error.message}`);
      }

      throw error;
    }
  }
}
