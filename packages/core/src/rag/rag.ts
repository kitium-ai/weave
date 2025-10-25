/**
 * RAG (Retrieval-Augmented Generation) system
 */

import { getLogger } from '@weaveai/shared';
import type { ILanguageModel } from '../providers/interfaces.js';
import type {
  RAGDocument,
  RAGRetrievalResult,
  RAGGenerationResult,
  RAGQueryOptions,
  RAGConfig,
  IVectorStore,
} from './types.js';
import { InMemoryVectorStore } from './vector-store.js';

/**
 * RAG system for retrieval-augmented generation
 */
export class RAGSystem {
  protected readonly logger = getLogger();
  private vectorStore: IVectorStore;
  private model: ILanguageModel;
  private config: Required<RAGConfig>;
  private documents: Map<string, RAGDocument> = new Map();

  public constructor(model: ILanguageModel, config?: RAGConfig) {
    this.model = model;
    this.config = {
      vectorStoreType: config?.vectorStoreType ?? 'memory',
      embeddingModel: config?.embeddingModel ?? 'default',
      chunkSize: config?.chunkSize ?? 512,
      chunkOverlap: config?.chunkOverlap ?? 50,
      similarityThreshold: config?.similarityThreshold ?? 0.5,
    };

    // Initialize vector store
    if (this.config.vectorStoreType === 'memory') {
      this.vectorStore = new InMemoryVectorStore();
    } else {
      // Default to in-memory for now
      this.vectorStore = new InMemoryVectorStore();
    }

    this.logger.debug('RAG system initialized', { config: this.config });
  }

  /**
   * Index a document
   */
  public async indexDocument(
    id: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Chunk the document
    const chunks = this.chunkDocument(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${id}_chunk_${i}`;

      // Generate a simple embedding (in production, use actual embedding model)
      const embedding = this.generateSimpleEmbedding(chunk);

      const document: RAGDocument = {
        id: chunkId,
        content: chunk,
        metadata: {
          ...metadata,
          sourceId: id,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
        embedding,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await this.vectorStore.add(document);
      this.documents.set(chunkId, document);
    }

    this.logger.debug('Document indexed', { id, chunks: chunks.length });
  }

  /**
   * Query the RAG system
   */
  public async query(question: string, options?: RAGQueryOptions): Promise<RAGGenerationResult> {
    const limit = options?.limit ?? 5;
    const temperature = options?.temperature ?? 0.7;

    // Retrieve relevant documents
    const retrieval = await this.retrieve(question, limit);

    if (retrieval.documents.length === 0) {
      return {
        result: "I couldn't find relevant information to answer your question.",
        sources: [],
        relevance: 0,
        generatedAt: Date.now(),
      };
    }

    // Build context from retrieved documents
    const context = this.buildContext(retrieval.documents);

    // Generate answer using the model
    const prompt = `Context:
${context}

Question: ${question}

Answer:`;

    try {
      const response = await this.model.generate(prompt, { temperature });

      const relevance = retrieval.scores.length > 0 ? retrieval.scores[0] : 0;

      return {
        result: response.text,
        sources: retrieval.documents,
        relevance,
        generatedAt: Date.now(),
      };
    } catch (err) {
      this.logger.error('RAG generation failed', {
        error: err instanceof Error ? err.message : String(err),
      });

      throw err;
    }
  }

  /**
   * Retrieve relevant documents
   */
  public async retrieve(query: string, limit: number = 5): Promise<RAGRetrievalResult> {
    // Generate embedding for the query
    const queryEmbedding = this.generateSimpleEmbedding(query);

    // Search the vector store
    const documents = await this.vectorStore.search(queryEmbedding, limit);

    // Calculate relevance scores (normalized)
    const scores = documents.map(() => 0.8); // Placeholder scores

    return {
      documents,
      scores,
      retrievedAt: Date.now(),
    };
  }

  /**
   * Chunk a document into smaller pieces
   */
  private chunkDocument(content: string): string[] {
    const chunks: string[] = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length < this.config.chunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Generate a simple embedding (hash-based for demo)
   */
  private generateSimpleEmbedding(text: string): number[] {
    // Create a simple embedding by hashing words
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0);

    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const index = (charCode + i) % 128;
        embedding[index] += 1 / words.length;
      }
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? embedding.map((val) => val / norm) : embedding;
  }

  /**
   * Build context from retrieved documents
   */
  private buildContext(documents: RAGDocument[]): string {
    return documents.map((doc) => `[${doc.id}] ${doc.content}`).join('\n\n');
  }

  /**
   * Clear all indexed documents
   */
  public async clear(): Promise<void> {
    await this.vectorStore.clear();
    this.documents.clear();
    this.logger.debug('RAG system cleared');
  }

  /**
   * Get the number of indexed documents
   */
  public async size(): Promise<number> {
    return this.vectorStore.size();
  }

  /**
   * Get indexed documents
   */
  public getDocuments(): RAGDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Delete a document
   */
  public async deleteDocument(id: string): Promise<void> {
    const docsToDelete = Array.from(this.documents.values()).filter(
      (doc) => doc.metadata?.sourceId === id || doc.id === id
    );

    for (const doc of docsToDelete) {
      await this.vectorStore.delete(doc.id);
      this.documents.delete(doc.id);
    }

    this.logger.debug('Document deleted', { id });
  }
}
