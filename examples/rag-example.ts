/**
 * RAG Example
 * Demonstrates Retrieval-Augmented Generation with semantic and keyword search
 */

import { DocumentStore } from '../packages/core/src/rag/document-store.js';
import { RAGRetriever } from '../packages/core/src/rag/rag-retriever.js';

async function ragExample() {
  console.log('=== Retrieval-Augmented Generation ===\n');

  // Create document store
  const store = new DocumentStore();
  const retriever = new RAGRetriever(store);

  // Add documents
  console.log('Adding documents to knowledge base...');
  await retriever.addDocuments([
    {
      id: 'doc1',
      content:
        'Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.',
      metadata: { category: 'AI', source: 'textbook' },
    },
    {
      id: 'doc2',
      content:
        'Deep learning uses artificial neural networks with multiple layers to process complex patterns in large amounts of data.',
      metadata: { category: 'AI', source: 'research' },
    },
    {
      id: 'doc3',
      content:
        'Natural language processing allows computers to understand, interpret, and generate human language in meaningful ways.',
      metadata: { category: 'NLP', source: 'textbook' },
    },
    {
      id: 'doc4',
      content:
        'Computer vision enables machines to interpret and understand the visual world using digital images and videos.',
      metadata: { category: 'Vision', source: 'documentation' },
    },
    {
      id: 'doc5',
      content:
        'Transformers are neural network architectures based on self-attention mechanisms that have revolutionized NLP and other domains.',
      metadata: { category: 'NLP', source: 'research' },
    },
  ]);

  console.log(`✓ Added ${retriever.getStats().documentCount} documents\n`);

  // Semantic search
  console.log('--- Semantic Search ---');
  const semanticQuery = 'How do neural networks learn from data?';
  console.log(`Query: "${semanticQuery}"`);

  const semanticContext = await retriever.retrieve(semanticQuery, {
    searchMethod: 'semantic',
    topK: 2,
  });

  console.log(`\nFound ${semanticContext.documents.length} documents:`);
  for (const doc of semanticContext.documents) {
    console.log(`  [${doc.rank}] Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
    console.log(`      ${doc.content.substring(0, 80)}...`);
  }

  // Keyword search
  console.log('\n--- Keyword Search ---');
  const keywordQuery = 'natural language';
  console.log(`Query: "${keywordQuery}"`);

  const keywordContext = await retriever.retrieve(keywordQuery, {
    searchMethod: 'keyword',
    topK: 2,
  });

  console.log(`\nFound ${keywordContext.documents.length} documents:`);
  for (const doc of keywordContext.documents) {
    console.log(`  [${doc.rank}] ${doc.id}`);
    console.log(`      ${doc.content.substring(0, 80)}...`);
  }

  // Hybrid search (semantic + keyword)
  console.log('\n--- Hybrid Search ---');
  const hybridQuery = 'neural network learning';
  console.log(`Query: "${hybridQuery}"`);

  const hybridContext = await retriever.retrieve(hybridQuery, {
    searchMethod: 'hybrid',
    topK: 2,
  });

  console.log(`\nFound ${hybridContext.documents.length} documents:`);
  for (const doc of hybridContext.documents) {
    console.log(`  [${doc.rank}] Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
    console.log(`      ${doc.content.substring(0, 80)}...`);
  }

  // Build augmented prompt
  console.log('\n--- Augmented Prompt ---');
  const userQuery = 'Explain how transformers work';
  const { augmentedPrompt, context } = await retriever.augmentPrompt(userQuery, {
    topK: 2,
  });

  console.log(`User Question: "${userQuery}"\n`);
  console.log('Augmented Prompt:');
  console.log(augmentedPrompt.substring(0, 200) + '...\n');

  // Statistics
  const stats = retriever.getStats();
  console.log('--- Statistics ---');
  console.log(`Documents in store: ${stats.documentCount}`);
  console.log(`Retrieval time: ${context.retrievalTime}ms`);

  console.log('\n✓ RAG example completed\n');
}

export { ragExample };
