/**
 * RAG system tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RAGSystem } from '../src/rag/rag.js';
import type { ILanguageModel } from '../src/providers/interfaces.js';

// Mock language model
const createMockModel = (): ILanguageModel => {
  return {
    generate: vi.fn().mockResolvedValue({
      text: 'Based on the context provided, the answer is that Paris is the capital of France.',
      tokenCount: { input: 50, output: 30 },
      finishReason: 'stop',
    }),
    classify: vi.fn(),
    extract: vi.fn(),
    chat: vi.fn(),
    countTokens: vi.fn(),
    validate: vi.fn().mockResolvedValue(true),
  } as unknown as ILanguageModel;
};

describe('RAG System', () => {
  let model: ILanguageModel;
  let rag: RAGSystem;

  beforeEach(() => {
    model = createMockModel();
    rag = new RAGSystem(model);
  });

  describe('RAG initialization', () => {
    it('should create RAG system with model', () => {
      const ragSystem = new RAGSystem(model);
      expect(ragSystem).toBeDefined();
    });

    it('should use default configuration', () => {
      const ragSystem = new RAGSystem(model);
      const size = ragSystem.size();
      expect(size).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customRag = new RAGSystem(model, {
        chunkSize: 1024,
        similarityThreshold: 0.7,
      });
      expect(customRag).toBeDefined();
    });
  });

  describe('Document indexing', () => {
    it('should index a document', async () => {
      const doc = 'Paris is the capital of France. It is known for the Eiffel Tower.';
      await rag.indexDocument('doc1', doc);

      const size = await rag.size();
      expect(size).toBeGreaterThan(0);
    });

    it('should index multiple documents', async () => {
      await rag.indexDocument('doc1', 'Paris is the capital of France.');
      await rag.indexDocument('doc2', 'London is the capital of England.');
      await rag.indexDocument('doc3', 'Berlin is the capital of Germany.');

      const size = await rag.size();
      expect(size).toBeGreaterThanOrEqual(3);
    });

    it('should add metadata to documents', async () => {
      const metadata = { source: 'wikipedia', category: 'geography' };
      await rag.indexDocument('doc1', 'Paris is the capital of France.', metadata);

      const docs = rag.getDocuments();
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].metadata?.source).toBe('wikipedia');
    });

    it('should chunk large documents', async () => {
      const largeDoc = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.';
      await rag.indexDocument('large_doc', largeDoc);

      const docs = rag.getDocuments();
      expect(docs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Document retrieval', () => {
    beforeEach(async () => {
      await rag.indexDocument('doc1', 'Paris is the capital of France. It has the Eiffel Tower.');
      await rag.indexDocument('doc2', 'London is the capital of England. It has Big Ben.');
      await rag.indexDocument('doc3', 'The Eiffel Tower is in Paris and is very tall.');
    });

    it('should retrieve documents for a query', async () => {
      const result = await rag.retrieve('Paris', 5);

      expect(result).toBeDefined();
      expect(result.documents).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.retrievedAt).toBeDefined();
    });

    it('should limit retrieved documents', async () => {
      const result = await rag.retrieve('capital', 1);

      expect(result.documents.length).toBeLessThanOrEqual(1);
    });

    it('should return relevant documents', async () => {
      const result = await rag.retrieve('Eiffel Tower', 5);

      expect(result.documents.length).toBeGreaterThan(0);
    });

    it('should calculate relevance scores', async () => {
      const result = await rag.retrieve('Paris capital', 5);

      expect(result.scores.length).toBeGreaterThanOrEqual(0);
      for (const score of result.scores) {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('RAG query', () => {
    beforeEach(async () => {
      await rag.indexDocument(
        'geography',
        'Paris is the capital of France and is located in Western Europe.'
      );
    });

    it('should generate an answer to a query', async () => {
      const result = await rag.query('What is the capital of France?');

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
    });

    it('should include source documents in response', async () => {
      const result = await rag.query('What is the capital of France?');

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('should calculate relevance score', async () => {
      const result = await rag.query('Tell me about Paris');

      expect(result.relevance).toBeDefined();
      expect(typeof result.relevance).toBe('number');
    });

    it('should handle queries with no results', async () => {
      const result = await rag.query('What about dinosaurs?');

      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
    });

    it('should accept query options', async () => {
      const result = await rag.query('What about Paris?', {
        limit: 3,
        temperature: 0.5,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Document management', () => {
    beforeEach(async () => {
      await rag.indexDocument('doc1', 'Content one');
      await rag.indexDocument('doc2', 'Content two');
    });

    it('should get all documents', () => {
      const docs = rag.getDocuments();

      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete a document', async () => {
      const initialSize = await rag.size();
      await rag.deleteDocument('doc1');
      const finalSize = await rag.size();

      expect(finalSize).toBeLessThan(initialSize);
    });

    it('should clear all documents', async () => {
      await rag.clear();
      const size = await rag.size();

      expect(size).toBe(0);
    });

    it('should return zero size after clearing', async () => {
      await rag.clear();
      const docs = rag.getDocuments();

      expect(docs.length).toBe(0);
    });
  });

  describe('Vector store operations', () => {
    it('should add documents to vector store', async () => {
      await rag.indexDocument('test', 'Test content');
      const size = await rag.size();

      expect(size).toBeGreaterThan(0);
    });

    it('should search vector store', async () => {
      await rag.indexDocument('test', 'Machine learning and artificial intelligence');
      const result = await rag.retrieve('machine learning', 5);

      expect(result.documents.length).toBeGreaterThan(0);
    });
  });
});
