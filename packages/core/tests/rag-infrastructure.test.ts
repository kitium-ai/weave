/**
 * Tests for RAG infrastructure: document store and retriever
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentStore, SearchResult } from '../src/rag/document-store.js';
import { RAGRetriever, RetrievedContext, RetrieverOptions } from '../src/rag/rag-retriever.js';

describe('DocumentStore', () => {
  let store: DocumentStore;

  beforeEach(() => {
    store = new DocumentStore();
  });

  describe('initialization', () => {
    it('should initialize empty', () => {
      expect(store.getDocumentCount()).toBe(0);
    });
  });

  describe('addDocument', () => {
    it('should add single document', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'This is a test document',
      });

      expect(store.getDocumentCount()).toBe(1);
    });

    it('should add document with metadata', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Test content',
        metadata: {
          author: 'John',
          date: '2024-01-01',
          tags: ['important'],
        },
      });

      expect(store.getDocumentCount()).toBe(1);
    });

    it('should generate embedding for document', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'The quick brown fox jumps',
      });

      const doc = store.getDocument('doc1');
      expect(doc).toBeDefined();
      expect(doc!.embedding).toBeDefined();
      expect(Array.isArray(doc!.embedding)).toBe(true);
    });

    it('should handle duplicate document IDs', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'First content',
      });

      await store.addDocument({
        id: 'doc1',
        content: 'Updated content',
      });

      // Last one should win
      const doc = store.getDocument('doc1');
      expect(doc!.content).toBe('Updated content');
    });

    it('should handle empty content', async () => {
      await store.addDocument({
        id: 'doc1',
        content: '',
      });

      expect(store.getDocumentCount()).toBe(1);
      expect(store.getDocument('doc1')!.content).toBe('');
    });
  });

  describe('addDocuments', () => {
    it('should add multiple documents', async () => {
      const docs = [
        { id: 'doc1', content: 'First document' },
        { id: 'doc2', content: 'Second document' },
        { id: 'doc3', content: 'Third document' },
      ];

      await store.addDocuments(docs);

      expect(store.getDocumentCount()).toBe(3);
    });

    it('should handle batch with metadata', async () => {
      const docs = [
        {
          id: 'doc1',
          content: 'Document 1',
          metadata: { type: 'article' },
        },
        {
          id: 'doc2',
          content: 'Document 2',
          metadata: { type: 'blog' },
        },
      ];

      await store.addDocuments(docs);

      expect(store.getDocumentCount()).toBe(2);
    });

    it('should handle large batch', async () => {
      const docs = Array.from({ length: 100 }, (_, i) => ({
        id: `doc${i}`,
        content: `Document ${i} content`,
      }));

      await store.addDocuments(docs);

      expect(store.getDocumentCount()).toBe(100);
    });

    it('should handle empty array', async () => {
      await store.addDocuments([]);

      expect(store.getDocumentCount()).toBe(0);
    });
  });

  describe('getDocument', () => {
    it('should retrieve existing document', async () => {
      const original = {
        id: 'doc1',
        content: 'Test content',
        metadata: { key: 'value' },
      };

      await store.addDocument(original);
      const retrieved = store.getDocument('doc1');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('doc1');
      expect(retrieved!.content).toBe('Test content');
      expect(retrieved!.metadata).toEqual({ key: 'value' });
    });

    it('should return undefined for non-existent document', () => {
      const doc = store.getDocument('non-existent');

      expect(doc).toBeUndefined();
    });

    it('should include embedding in retrieved document', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Test content',
      });

      const doc = store.getDocument('doc1');

      expect(doc!.embedding).toBeDefined();
      expect(Array.isArray(doc!.embedding)).toBe(true);
    });
  });

  describe('updateDocument', () => {
    it('should update document content', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Original content',
      });

      await store.updateDocument('doc1', {
        content: 'Updated content',
      });

      const doc = store.getDocument('doc1');
      expect(doc!.content).toBe('Updated content');
    });

    it('should update document metadata', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Content',
        metadata: { version: 1 },
      });

      await store.updateDocument('doc1', {
        metadata: { version: 2 },
      });

      const doc = store.getDocument('doc1');
      expect(doc!.metadata).toEqual({ version: 2 });
    });

    it('should regenerate embedding on content update', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Original content',
      });

      const originalEmbedding = store.getDocument('doc1')!.embedding;

      await store.updateDocument('doc1', {
        content: 'Completely different content',
      });

      const newEmbedding = store.getDocument('doc1')!.embedding;

      // Embeddings should be different for different content
      expect(newEmbedding).not.toEqual(originalEmbedding);
    });

    it('should return false for non-existent document', async () => {
      const result = await store.updateDocument('non-existent', {
        content: 'New content',
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'To be deleted',
      });

      expect(store.getDocumentCount()).toBe(1);

      const deleted = store.deleteDocument('doc1');

      expect(deleted).toBe(true);
      expect(store.getDocumentCount()).toBe(0);
    });

    it('should return false for non-existent document', () => {
      const deleted = store.deleteDocument('non-existent');

      expect(deleted).toBe(false);
    });

    it('should maintain other documents after deletion', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'Content 1' },
        { id: 'doc2', content: 'Content 2' },
        { id: 'doc3', content: 'Content 3' },
      ]);

      store.deleteDocument('doc2');

      expect(store.getDocumentCount()).toBe(2);
      expect(store.getDocument('doc1')).toBeDefined();
      expect(store.getDocument('doc2')).toBeUndefined();
      expect(store.getDocument('doc3')).toBeDefined();
    });
  });

  describe('search (semantic)', () => {
    it('should find semantically similar documents', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'The cat sat on the mat' },
        { id: 'doc2', content: 'A dog played in the park' },
        { id: 'doc3', content: 'The feline rested on the rug' },
      ]);

      const results = await store.search('cat sitting', 2);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity).toBeGreaterThan(0);
    });

    it('should respect topK parameter', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'Document 1' },
        { id: 'doc2', content: 'Document 2' },
        { id: 'doc3', content: 'Document 3' },
        { id: 'doc4', content: 'Document 4' },
      ]);

      const results = await store.search('Document', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return sorted results by similarity', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'The quick brown fox' },
        { id: 'doc2', content: 'A slow turtle' },
        { id: 'doc3', content: 'The fast fox running' },
      ]);

      const results = await store.search('quick fox', 3);

      // Results should be sorted by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i].similarity).toBeLessThanOrEqual(results[i - 1].similarity);
      }
    });

    it('should include rank information', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'Test document' },
        { id: 'doc2', content: 'Another test' },
      ]);

      const results = await store.search('test', 2);

      expect(results[0].rank).toBe(1);
      if (results.length > 1) {
        expect(results[1].rank).toBe(2);
      }
    });

    it('should handle empty store', async () => {
      const results = await store.search('any query', 10);

      expect(results).toEqual([]);
    });

    it('should handle query with special characters', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'Test document!' },
        { id: 'doc2', content: 'Another test' },
      ]);

      const results = await store.search('test!', 2);

      // Should not throw, should handle gracefully
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('searchKeyword', () => {
    it('should find documents with keyword', () => {
      store.addDocuments([
        { id: 'doc1', content: 'The cat sat on the mat' },
        { id: 'doc2', content: 'A dog played in the park' },
        { id: 'doc3', content: 'The cat and dog became friends' },
      ]);

      const results = store.searchKeyword('cat', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.document.id === 'doc1')).toBe(true);
      expect(results.some((r) => r.document.id === 'doc3')).toBe(true);
    });

    it('should be case insensitive', () => {
      store.addDocuments([
        { id: 'doc1', content: 'The Cat sat on the mat' },
        { id: 'doc2', content: 'A dog played' },
      ]);

      const resultsLower = store.searchKeyword('cat', 10);
      const resultsUpper = store.searchKeyword('CAT', 10);

      expect(resultsLower.length).toBeGreaterThan(0);
      expect(resultsUpper.length).toBeGreaterThan(0);
    });

    it('should respect topK parameter', () => {
      store.addDocuments([
        { id: 'doc1', content: 'test test test' },
        { id: 'doc2', content: 'test test' },
        { id: 'doc3', content: 'test' },
        { id: 'doc4', content: 'test other' },
      ]);

      const results = store.searchKeyword('test', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should include similarity scores', () => {
      store.addDocuments([
        { id: 'doc1', content: 'test test test' },
        { id: 'doc2', content: 'test' },
      ]);

      const results = store.searchKeyword('test', 2);

      expect(results[0].similarity).toBeGreaterThan(0);
      expect(results[0].similarity).toBeLessThanOrEqual(1);
    });

    it('should handle no matches', () => {
      store.addDocuments([
        { id: 'doc1', content: 'The cat sat on the mat' },
        { id: 'doc2', content: 'A dog played in the park' },
      ]);

      const results = store.searchKeyword('elephant', 10);

      expect(results).toEqual([]);
    });

    it('should handle empty store', () => {
      const results = store.searchKeyword('any', 10);

      expect(results).toEqual([]);
    });
  });

  describe('getDocumentCount', () => {
    it('should return correct count', async () => {
      expect(store.getDocumentCount()).toBe(0);

      await store.addDocument({ id: 'doc1', content: 'Content 1' });
      expect(store.getDocumentCount()).toBe(1);

      await store.addDocument({ id: 'doc2', content: 'Content 2' });
      expect(store.getDocumentCount()).toBe(2);

      store.deleteDocument('doc1');
      expect(store.getDocumentCount()).toBe(1);
    });
  });
});

describe('RAGRetriever', () => {
  let store: DocumentStore;
  let retriever: RAGRetriever;

  beforeEach(async () => {
    store = new DocumentStore();
    retriever = new RAGRetriever(store);

    // Add test documents
    await store.addDocuments([
      {
        id: 'doc1',
        content: 'Artificial intelligence and machine learning are transforming technology',
      },
      { id: 'doc2', content: 'Neural networks are inspired by the human brain' },
      { id: 'doc3', content: 'Deep learning uses multiple layers of neural networks' },
      { id: 'doc4', content: 'Natural language processing helps computers understand text' },
      { id: 'doc5', content: 'Computer vision enables machines to interpret images' },
    ]);
  });

  describe('retrieve', () => {
    it('should retrieve documents for query', async () => {
      const context = await retriever.retrieve('machine learning');

      expect(context.documents).toBeDefined();
      expect(context.documents.length).toBeGreaterThan(0);
      expect(context.query).toBe('machine learning');
    });

    it('should respect topK parameter', async () => {
      const context = await retriever.retrieve('learning', { topK: 2 });

      expect(context.documents.length).toBeLessThanOrEqual(2);
    });

    it('should include similarity scores', async () => {
      const context = await retriever.retrieve('neural networks');

      for (const doc of context.documents) {
        expect(typeof doc.similarity).toBe('number');
        expect(doc.similarity).toBeGreaterThanOrEqual(0);
        expect(doc.similarity).toBeLessThanOrEqual(1);
      }
    });

    it('should include document ranks', async () => {
      const context = await retriever.retrieve('learning');

      for (let i = 0; i < context.documents.length; i++) {
        expect(context.documents[i].rank).toBe(i + 1);
      }
    });

    it('should sort by similarity descending', async () => {
      const context = await retriever.retrieve('learning');

      for (let i = 1; i < context.documents.length; i++) {
        expect(context.documents[i].similarity).toBeLessThanOrEqual(
          context.documents[i - 1].similarity
        );
      }
    });

    it('should record retrieval time', async () => {
      const context = await retriever.retrieve('learning');

      expect(context.retrievalTime).toBeGreaterThanOrEqual(0);
    });

    it('should filter by similarity threshold', async () => {
      const context = await retriever.retrieve('unrelated query about food recipes', {
        similarityThreshold: 0.9,
        topK: 10,
      });

      // With high threshold, might get no or few results
      for (const doc of context.documents) {
        expect(doc.similarity).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should include metadata when requested', async () => {
      await store.addDocument({
        id: 'doc-with-meta',
        content: 'Test document with metadata',
        metadata: { source: 'test', version: 1 },
      });

      const context = await retriever.retrieve('test', {
        includeMetadata: true,
      });

      const docWithMeta = context.documents.find((d) => d.id === 'doc-with-meta');
      if (docWithMeta) {
        expect(docWithMeta.metadata).toBeDefined();
      }
    });

    it('should exclude metadata when not requested', async () => {
      await store.addDocument({
        id: 'doc-with-meta',
        content: 'Test document with metadata',
        metadata: { source: 'test', version: 1 },
      });

      const context = await retriever.retrieve('test', {
        includeMetadata: false,
      });

      const docWithMeta = context.documents.find((d) => d.id === 'doc-with-meta');
      if (docWithMeta) {
        expect(docWithMeta.metadata).toBeUndefined();
      }
    });
  });

  describe('searchMethods', () => {
    it('should use semantic search by default', async () => {
      const context = await retriever.retrieve('learning networks', {
        searchMethod: 'semantic',
      });

      expect(context.documents.length).toBeGreaterThan(0);
    });

    it('should use keyword search', async () => {
      const context = await retriever.retrieve('learning', {
        searchMethod: 'keyword',
      });

      expect(context.documents.length).toBeGreaterThan(0);
    });

    it('should use hybrid search', async () => {
      const context = await retriever.retrieve('learning networks', {
        searchMethod: 'hybrid',
      });

      expect(context.documents.length).toBeGreaterThan(0);
    });

    it('hybrid should weight semantic and keyword results', async () => {
      // This test verifies that hybrid search combines results
      const semanticContext = await retriever.retrieve('learning', {
        searchMethod: 'semantic',
        topK: 5,
      });

      const keywordContext = await retriever.retrieve('learning', {
        searchMethod: 'keyword',
        topK: 5,
      });

      const hybridContext = await retriever.retrieve('learning', {
        searchMethod: 'hybrid',
        topK: 5,
      });

      // Hybrid should have results
      expect(hybridContext.documents.length).toBeGreaterThan(0);
    });
  });

  describe('formatContext', () => {
    it('should format retrieved context as string', async () => {
      const context = await retriever.retrieve('learning');
      const formatted = retriever.formatContext(context);

      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('RETRIEVED CONTEXT');
      expect(formatted).toContain('learning');
    });

    it('should include similarity percentages', async () => {
      const context = await retriever.retrieve('learning');
      const formatted = retriever.formatContext(context);

      expect(formatted).toContain('%');
    });

    it('should include document content', async () => {
      const context = await retriever.retrieve('learning');
      const formatted = retriever.formatContext(context);

      for (const doc of context.documents) {
        expect(formatted).toContain(doc.content);
      }
    });

    it('should handle empty context', () => {
      const emptyContext: RetrievedContext = {
        documents: [],
        query: 'test',
        totalCount: 0,
        retrievalTime: 0,
      };

      const formatted = retriever.formatContext(emptyContext);

      expect(formatted).toContain('No relevant context');
    });

    it('should include retrieval timing', async () => {
      const context = await retriever.retrieve('learning');
      const formatted = retriever.formatContext(context);

      expect(formatted).toContain('ms');
    });
  });

  describe('buildAugmentedPrompt', () => {
    it('should build augmented prompt with context', async () => {
      const context = await retriever.retrieve('learning');
      const query = 'What is machine learning?';

      const augmentedPrompt = retriever.buildAugmentedPrompt(query, context);

      expect(augmentedPrompt).toContain('RETRIEVED CONTEXT');
      expect(augmentedPrompt).toContain(query);
      expect(augmentedPrompt).toContain('Based on the above context');
    });

    it('should include context before query instruction', async () => {
      const context = await retriever.retrieve('learning');
      const query = 'Explain the concept';

      const augmentedPrompt = retriever.buildAugmentedPrompt(query, context);

      const contextIndex = augmentedPrompt.indexOf('RETRIEVED CONTEXT');
      const queryIndex = augmentedPrompt.indexOf(query);

      expect(contextIndex).toBeLessThan(queryIndex);
    });
  });

  describe('augmentPrompt', () => {
    it('should retrieve and augment in one call', async () => {
      const query = 'What is machine learning?';
      const result = await retriever.augmentPrompt(query);

      expect(result.augmentedPrompt).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.augmentedPrompt).toContain(query);
      expect(result.augmentedPrompt).toContain('RETRIEVED CONTEXT');
    });

    it('should pass options to retrieve', async () => {
      const result = await retriever.augmentPrompt('learning', {
        topK: 2,
      });

      expect(result.context.documents.length).toBeLessThanOrEqual(2);
    });

    it('should return both augmented prompt and context', async () => {
      const result = await retriever.augmentPrompt('learning');

      expect(result).toHaveProperty('augmentedPrompt');
      expect(result).toHaveProperty('context');
      expect(typeof result.augmentedPrompt).toBe('string');
      expect(result.context).toBeDefined();
    });
  });

  describe('addDocuments', () => {
    it('should add documents to retriever', async () => {
      const initialCount = store.getDocumentCount();

      await retriever.addDocuments([
        { id: 'new1', content: 'New document 1' },
        { id: 'new2', content: 'New document 2' },
      ]);

      expect(store.getDocumentCount()).toBe(initialCount + 2);
    });

    it('should make added documents searchable', async () => {
      await retriever.addDocuments([
        { id: 'unique-doc', content: 'This is a unique document about quantum computing' },
      ]);

      const context = await retriever.retrieve('quantum computing');

      expect(context.documents.some((d) => d.id === 'unique-doc')).toBe(true);
    });
  });

  describe('removeDocument', () => {
    it('should remove document from retriever', async () => {
      await retriever.addDocuments([{ id: 'to-remove', content: 'This document will be removed' }]);

      const removed = retriever.removeDocument('to-remove');

      expect(removed).toBe(true);
      expect(store.getDocument('to-remove')).toBeUndefined();
    });

    it('should return false for non-existent document', () => {
      const removed = retriever.removeDocument('non-existent');

      expect(removed).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return retriever statistics', () => {
      const stats = retriever.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.documentCount).toBe('number');
      expect(stats.documentCount).toBeGreaterThan(0);
    });

    it('should reflect added documents in stats', async () => {
      const beforeStats = retriever.getStats();

      await retriever.addDocuments([{ id: 'stat-doc', content: 'For stats' }]);

      const afterStats = retriever.getStats();

      expect(afterStats.documentCount).toBe(beforeStats.documentCount + 1);
    });

    it('should reflect removed documents in stats', () => {
      const beforeStats = retriever.getStats();

      retriever.removeDocument('doc1');

      const afterStats = retriever.getStats();

      expect(afterStats.documentCount).toBe(beforeStats.documentCount - 1);
    });
  });

  describe('integration', () => {
    it('should work end-to-end', async () => {
      // Add documents
      await retriever.addDocuments([
        { id: 'integration-doc', content: 'Integration test document about AI' },
      ]);

      // Augment prompt
      const result = await retriever.augmentPrompt('Explain AI concepts', {
        topK: 3,
      });

      // Verify result
      expect(result.augmentedPrompt).toContain('Explain AI concepts');
      expect(result.context.documents.length).toBeGreaterThan(0);
      expect(result.context.documents.length).toBeLessThanOrEqual(3);

      // Get stats
      const stats = retriever.getStats();
      expect(stats.documentCount).toBeGreaterThan(0);
    });

    it('should handle document lifecycle', async () => {
      const docId = 'lifecycle-doc';

      // Add
      await retriever.addDocuments([
        {
          id: docId,
          content: 'Lifecycle test document',
          metadata: { version: 1 },
        },
      ]);

      let stats = retriever.getStats();
      const countAfterAdd = stats.documentCount;

      // Remove
      const removed = retriever.removeDocument(docId);
      expect(removed).toBe(true);

      stats = retriever.getStats();
      expect(stats.documentCount).toBe(countAfterAdd - 1);
    });
  });
});
