/**
 * Document Store for RAG (Retrieval-Augmented Generation)
 * Manages documents with vector embeddings for semantic search
 */

import { getLogger } from '@weaveai/shared';

/**
 * Document in the store
 */
export interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Search result
 */
export interface SearchResult {
  document: Document;
  similarity: number;
  rank: number;
}

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  batchEmbed(texts: string[]): Promise<number[][]>;
}

/**
 * Document store for RAG
 */
export class DocumentStore {
  private documents: Map<string, Document> = new Map();
  private embeddingProvider: EmbeddingProvider | null = null;
  private readonly logger = getLogger();

  constructor(embeddingProvider?: EmbeddingProvider) {
    this.embeddingProvider = embeddingProvider || null;
  }

  /**
   * Set embedding provider
   */
  public setEmbeddingProvider(provider: EmbeddingProvider): void {
    this.embeddingProvider = provider;
    this.logger.debug('Embedding provider set');
  }

  /**
   * Add a document to the store
   */
  public async addDocument(
    docOrId:
      | string
      | {
          id: string;
          content: string;
          metadata?: Record<string, unknown>;
        },
    content?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Document> {
    const id = typeof docOrId === 'string' ? docOrId : docOrId.id;
    const text = typeof docOrId === 'string' ? (content ?? '') : docOrId.content;
    const meta = typeof docOrId === 'string' ? metadata : docOrId.metadata || {};
    const now = new Date();
    let embedding: number[] | undefined;

    if (this.embeddingProvider) {
      embedding = await this.embeddingProvider.embed(text);
    } else {
      embedding = this.generateSimpleEmbedding(text);
    }

    const document: Document = {
      id,
      content: text,
      metadata: meta,
      embedding,
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(id, document);
    this.logger.debug(`Document added: ${id}`);

    return document;
  }

  /**
   * Add multiple documents
   */
  public async addDocuments(
    docs: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): Promise<Document[]> {
    const embeddings = this.embeddingProvider
      ? await this.embeddingProvider.batchEmbed(docs.map((d) => d.content))
      : docs.map((d) => this.generateSimpleEmbedding(d.content));

    const results: Document[] = [];
    const now = new Date();

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const document: Document = {
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata || {},
        embedding: embeddings[i],
        createdAt: now,
        updatedAt: now,
      };

      this.documents.set(doc.id, document);
      results.push(document);
    }

    this.logger.debug(`Added ${docs.length} documents`);
    return results;
  }

  /**
   * Get a document by ID
   */
  public getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Update a document
   */
  public async updateDocument(
    id: string,
    updates: {
      content?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    const existing = this.documents.get(id);
    if (!existing) {
      return false;
    }

    const newContent = updates.content !== undefined ? updates.content : existing.content;
    let embedding = existing.embedding;

    if (updates.content !== undefined && newContent !== existing.content) {
      if (this.embeddingProvider) {
        embedding = await this.embeddingProvider.embed(newContent);
      } else {
        embedding = this.generateSimpleEmbedding(newContent);
      }
    }

    const updated: Document = {
      ...existing,
      content: newContent,
      metadata: updates.metadata !== undefined ? updates.metadata : existing.metadata,
      embedding,
      updatedAt: new Date(),
    };

    this.documents.set(id, updated);
    this.logger.debug(`Document updated: ${id}`);

    return true;
  }

  /**
   * Delete a document
   */
  public deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.logger.debug(`Document deleted: ${id}`);
    }
    return deleted;
  }

  /**
   * Search documents by semantic similarity
   */
  public async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    let queryEmbedding: number[];
    if (!this.embeddingProvider) {
      // Use simple embedding when no provider is configured
      queryEmbedding = this.generateSimpleEmbedding(query);
    } else {
      queryEmbedding = await this.embeddingProvider.embed(query);
    }
    const results: SearchResult[] = [];

    for (const [, document] of this.documents) {
      if (!document.embedding) {
        continue;
      }

      const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
      results.push({
        document,
        similarity,
        rank: 0,
      });
    }

    // Sort by similarity and rank
    results.sort((a, b) => b.similarity - a.similarity);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    let top = results.slice(0, limit);

    // If no semantic results, fallback to keyword search to ensure some recall
    if (top.length === 0) {
      const kw = this.searchKeyword(query, limit);
      top = kw.map((r, idx) => ({ document: r.document, similarity: r.similarity, rank: idx + 1 }));
    }

    return top;
  }

  /**
   * Search by keyword (text-based)
   */
  public searchKeyword(keyword: string, limit: number = 10): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const [, document] of this.documents) {
      const contentLower = (document.content || '').toLowerCase();
      const metadataStr = JSON.stringify(document.metadata || {}).toLowerCase();

      const inContent = contentLower.includes(lowerKeyword);
      const inMetadata = metadataStr.includes(lowerKeyword);

      if (inContent || inMetadata) {
        // Simple relevance score
        const occurrences =
          (contentLower.match(new RegExp(lowerKeyword, 'g')) || []).length * 10 +
          (metadataStr.match(new RegExp(lowerKeyword, 'g')) || []).length;

        results.push({
          document,
          similarity: Math.min(occurrences / 100, 1),
          rank: 0,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results.slice(0, limit);
  }

  /**
   * Simple hashing-based embedding as a fallback when no provider is set
   */
  private generateSimpleEmbedding(text: string | undefined): number[] {
    const safeText = typeof text === 'string' ? text : '';
    const words = safeText.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
    const embedding = new Array(128).fill(0);
    if (words.length === 0) return embedding;
    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        const index = (word.charCodeAt(i) + i) % 128;
        embedding[index] += 1 / words.length;
      }
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? embedding.map((v) => v / norm) : embedding;
  }

  /**
   * Get all documents
   */
  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get document count
   */
  public getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  public clear(): void {
    this.documents.clear();
    this.logger.debug('Document store cleared');
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) {
      return 0;
    }

    return dotProduct / (magA * magB);
  }
}

/**
 * Global document store instance
 */
let globalStore: DocumentStore | null = null;

/**
 * Get global document store
 */
export function getDocumentStore(): DocumentStore {
  if (!globalStore) {
    globalStore = new DocumentStore();
  }
  return globalStore;
}
