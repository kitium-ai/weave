/**
 * NestJS Controller for Weave Operations
 * REST API for AI operations using Weave
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GenerateService, ClassifyService, ExtractService } from '@weaveai/nestjs';
import { WEAVE_INSTANCE } from '@weaveai/nestjs';
import { Weave } from '@weaveai/core';

interface GenerateRequest {
  prompt: string;
  temperature?: number;
}

interface ClassifyRequest {
  text: string;
  labels: string[];
}

interface ExtractRequest {
  text: string;
  schema: unknown;
}

@Controller('ai')
export class WeaveController {
  constructor(
    private generateService: GenerateService,
    private classifyService: ClassifyService,
    private extractService: ExtractService,
    @Inject(WEAVE_INSTANCE) private weave: Weave
  ) {}

  @Get('health')
  async health() {
    return { status: 'ok', timestamp: new Date() };
  }

  @Post('generate')
  async generate(@Body() request: GenerateRequest) {
    try {
      if (!request.prompt || typeof request.prompt !== 'string') {
        throw new BadRequestException('Prompt is required and must be a string');
      }

      if (request.prompt.length > 4000) {
        throw new BadRequestException('Prompt is too long (max 4000 characters)');
      }

      const result = await this.generateService.generate(
        request.prompt,
        request.temperature ? { temperature: request.temperature } : undefined
      );

      return {
        text: result,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @Post('classify')
  async classify(@Body() request: ClassifyRequest) {
    try {
      if (!request.text || typeof request.text !== 'string') {
        throw new BadRequestException('Text is required and must be a string');
      }

      if (!Array.isArray(request.labels) || request.labels.length === 0) {
        throw new BadRequestException('Labels must be a non-empty array');
      }

      const result = await this.classifyService.classify(request.text, request.labels);

      return {
        result,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @Post('extract')
  async extract(@Body() request: ExtractRequest) {
    try {
      if (!request.text || typeof request.text !== 'string') {
        throw new BadRequestException('Text is required and must be a string');
      }

      if (!request.schema) {
        throw new BadRequestException('Schema is required');
      }

      const result = await this.extractService.extract(request.text, request.schema);

      return {
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  @Post('chat')
  async chat(@Body() request: { messages: any[]; temperature?: number }) {
    try {
      if (!Array.isArray(request.messages) || request.messages.length === 0) {
        throw new BadRequestException('Messages are required');
      }

      const response = await this.weave.getModel().chat(request.messages, {
        temperature: request.temperature,
      });

      return {
        response,
        timestamp: new Date(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error instanceof BadRequestException) {
      return error;
    }

    if (error.message?.includes('rate limit')) {
      return new InternalServerErrorException('Rate limit exceeded. Please try again later.');
    }

    if (error.message?.includes('api_key')) {
      return new InternalServerErrorException('API key error. Please check your configuration.');
    }

    console.error('Weave operation error:', error);
    return new InternalServerErrorException('Internal server error');
  }
}
