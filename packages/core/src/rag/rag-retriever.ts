/**
 * RAG Retriever
 * Retrieves relevant documents for context-augmented generation
 */

import { getLogger } from '@weaveai/shared';
import { DocumentStore, DocumentSearchResult } from './document-store.js';

/**
 * Retriever options
 */
export interface RetrieverOptions {
  searchMethod?: 'semantic' | 'keyword' | 'hybrid';
  topK?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
}

/**
 * Retrieved context
 */
export interface RetrievedContext {
  documents: Array<{
    id: string;
    content: string;
    similarity: number;
    rank: number;
    metadata?: Record<string, unknown>;
  }>;
  query: string;
  totalCount: number;
  retrievalTime: number;
}

/**
 * RAG Retriever for augmenting generation with context
 */
export class RAGRetriever {
  private readonly store: DocumentStore;
  private readonly logger = getLogger();

  constructor(store: DocumentStore) {
    this.store = store;
  }

  /**
   * Retrieve context for a query
   */
  public async retrieve(query: string, options: RetrieverOptions = {}): Promise<RetrievedContext> {
    const startTime = Date.now();

    const {
      searchMethod = 'semantic',
      topK = 5,
      similarityThreshold = 0.0,
      includeMetadata = true,
    } = options;

    let results: DocumentSearchResult[] = [];

    if (searchMethod === 'semantic') {
      results = await this.store.search(query, topK * 2);
    } else if (searchMethod === 'keyword') {
      results = this.store.searchKeyword(query, topK * 2);
    } else if (searchMethod === 'hybrid') {
      const semanticResults = await this.store.search(query, topK);
      const keywordResults = this.store.searchKeyword(query, topK);

      // Merge results, preferring higher scores
      const merged = new Map<string, DocumentSearchResult>();

      for (const result of semanticResults) {
        merged.set(result.document.id, {
          ...result,
          similarity: result.similarity * 0.7,
        });
      }

      for (const result of keywordResults) {
        const existing = merged.get(result.document.id);
        if (existing) {
          existing.similarity = Math.max(existing.similarity, result.similarity * 0.3);
        } else {
          merged.set(result.document.id, {
            ...result,
            similarity: result.similarity * 0.3,
          });
        }
      }

      results = Array.from(merged.values());
      results.sort((a, b) => b.similarity - a.similarity);
    }

    // Filter by threshold and limit to topK
    const filtered = results.filter((r) => r.similarity >= similarityThreshold).slice(0, topK);

    const retrievalTime = Date.now() - startTime;

    this.logger.debug(`Retrieved ${filtered.length} documents for query`, {
      query,
      method: searchMethod,
      time: retrievalTime,
    });

    return {
      documents: filtered.map((result) => ({
        id: result.document.id,
        content: result.document.content,
        similarity: result.similarity,
        rank: result.rank,
        ...(includeMetadata && { metadata: result.document.metadata }),
      })),
      query,
      totalCount: filtered.length,
      retrievalTime,
    };
  }

  /**
   * Format retrieved context into a prompt
   */
  public formatContext(context: RetrievedContext): string {
    if (context.documents.length === 0) {
      return 'No relevant context found.';
    }

    const lines = ['RETRIEVED CONTEXT:'];
    lines.push(`Query: ${context.query}`);
    lines.push(`Retrieved ${context.documents.length} documents in ${context.retrievalTime}ms\n`);

    for (const doc of context.documents) {
      lines.push(`[Document ${doc.rank}: ${doc.id}]`);
      lines.push(`Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
      lines.push(doc.content);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Build augmented prompt with context
   */
  public buildAugmentedPrompt(query: string, context: RetrievedContext): string {
    const contextStr = this.formatContext(context);

    return `${contextStr}\n\nBased on the above context, please answer the following query:\n${query}`;
  }

  /**
   * Retrieve and augment prompt in one step
   */
  public async augmentPrompt(
    query: string,
    options: RetrieverOptions = {}
  ): Promise<{
    augmentedPrompt: string;
    context: RetrievedContext;
  }> {
    const context = await this.retrieve(query, options);
    const augmentedPrompt = this.buildAugmentedPrompt(query, context);

    return {
      augmentedPrompt,
      context,
    };
  }

  /**
   * Add documents to retriever
   */
  public async addDocuments(
    docs: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    await this.store.addDocuments(docs);
    this.logger.debug(`Added ${docs.length} documents to retriever`);
  }

  /**
   * Remove document from retriever
   */
  public removeDocument(id: string): boolean {
    const removed = this.store.deleteDocument(id);
    if (removed) {
      this.logger.debug(`Removed document from retriever: ${id}`);
    }
    return removed;
  }

  /**
   * Get retriever stats
   */
  public getStats(): {
    documentCount: number;
  } {
    return {
      documentCount: this.store.getDocumentCount(),
    };
  }
}
