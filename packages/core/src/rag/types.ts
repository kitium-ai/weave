/**
 * RAG (Retrieval-Augmented Generation) system types
 */

/**
 * Document in the RAG system
 */
export interface RAGDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Indexed document
 */
export interface IndexedDocument extends RAGDocument {
  embedding: number[];
  index: number;
}

/**
 * Vector store interface
 */
export interface IVectorStore {
  add(document: RAGDocument): Promise<void>;
  delete(documentId: string): Promise<void>;
  search(query: string | number[], limit: number): Promise<RAGDocument[]>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

/**
 * RAG retrieval result
 */
export interface RAGRetrievalResult {
  documents: RAGDocument[];
  scores: number[];
  retrievedAt: number;
}

/**
 * RAG generation result
 */
export interface RAGGenerationResult {
  result: string;
  sources: RAGDocument[];
  relevance: number;
  generatedAt: number;
}

/**
 * RAG query options
 */
export interface RAGQueryOptions {
  limit?: number;
  minRelevance?: number;
  includeMetadata?: boolean;
  temperature?: number;
}

/**
 * RAG configuration
 */
export interface RAGConfig {
  vectorStoreType?: 'memory' | 'pinecone' | 'weaviate';
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  similarityThreshold?: number;
}

/**
 * Document chunk
 */
export interface DocumentChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  source: string;
}
