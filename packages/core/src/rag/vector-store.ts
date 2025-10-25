/**
 * In-memory vector store for RAG
 */

import { getLogger } from '@weaveai/shared';
import type { RAGDocument, IVectorStore } from './types.js';

/**
 * In-memory vector store implementation
 */
export class InMemoryVectorStore implements IVectorStore {
  protected readonly logger = getLogger();
  private documents: Map<string, RAGDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  /**
   * Add a document to the vector store
   */
  public async add(document: RAGDocument): Promise<void> {
    this.documents.set(document.id, document);
    if (document.embedding) {
      this.embeddings.set(document.id, document.embedding);
    }
    this.logger.debug('Document added to vector store', { id: document.id });
  }

  /**
   * Delete a document from the vector store
   */
  public async delete(documentId: string): Promise<void> {
    this.documents.delete(documentId);
    this.embeddings.delete(documentId);
    this.logger.debug('Document deleted from vector store', { id: documentId });
  }

  /**
   * Search for similar documents
   */
  public async search(query: string | number[], limit: number = 5): Promise<RAGDocument[]> {
    const documents = Array.from(this.documents.values());

    if (documents.length === 0) {
      return [];
    }

    // Simple string matching for in-memory implementation
    if (typeof query === 'string') {
      const queryTerms = query.toLowerCase().split(/\s+/);
      const scored = documents.map((doc) => {
        let score = 0;
        const contentLower = doc.content.toLowerCase();
        for (const term of queryTerms) {
          const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
          score += matches;
        }
        return { doc, score };
      });

      return scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.doc);
    }

    // Embedding-based search (simplified cosine similarity)
    const scored = documents
      .filter((doc): doc is RAGDocument & { embedding: number[] } => Array.isArray(doc.embedding))
      .map((doc) => {
        const similarity = this.cosineSimilarity(query, doc.embedding);
        return { doc, similarity };
      });

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.doc);
  }

  /**
   * Clear all documents
   */
  public async clear(): Promise<void> {
    this.documents.clear();
    this.embeddings.clear();
    this.logger.debug('Vector store cleared');
  }

  /**
   * Get the number of documents
   */
  public async size(): Promise<number> {
    return this.documents.size;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Get all documents
   */
  public getAll(): RAGDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Get document by ID
   */
  public getById(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }
}
