import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';

export const esClient = new Client({ node: ELASTICSEARCH_URL });

export const BOOKS_INDEX = 'books';

export const createBooksIndex = async (forceRecreate = false) => {
  const exists = await esClient.indices.exists({ index: BOOKS_INDEX });
  if (exists.body && forceRecreate) {
    await esClient.indices.delete({ index: BOOKS_INDEX });
    console.log('Deleted existing books index for recreation');
  } else if (exists.body) {
    return;
  }

  await esClient.indices.create({
    index: BOOKS_INDEX,
    body: {
      settings: {
        analysis: {
          analyzer: {
            book_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
            },
            book_search_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
          filter: {
            edge_ngram_filter: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 15,
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: {
            type: 'text',
            analyzer: 'book_analyzer',
            search_analyzer: 'book_search_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              exact: { type: 'text', analyzer: 'standard' },
            },
          },
          authors: {
            type: 'text',
            analyzer: 'book_analyzer',
            search_analyzer: 'book_search_analyzer',
          },
          isbn: { type: 'keyword' },
          description: { type: 'text' },
          publisher: { type: 'text' },
          published_date: { type: 'keyword' },
          categories: { type: 'keyword' },
          language: { type: 'keyword' },
          page_count: { type: 'integer' },
          cover_url: { type: 'keyword', index: false },
          cover_small_url: { type: 'keyword', index: false },
          cover_large_url: { type: 'keyword', index: false },
          subjects: { type: 'text' },
          title_vector: {
            type: 'dense_vector',
            dims: 768,
          },
        },
      },
    },
  });

  console.log('Created books index in Elasticsearch');
};
