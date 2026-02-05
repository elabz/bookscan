import dotenv from 'dotenv';
dotenv.config();

import { createBooksIndex } from '../src/config/elasticsearch';
import { syncAllBooks } from '../src/services/searchService';

const args = process.argv.slice(2);
const recreateIndex = args.includes('--recreate-index') || args.length === 0;
const reembed = args.includes('--reembed') || args.length === 0;

async function main() {
  try {
    if (recreateIndex) {
      console.log('Recreating Elasticsearch index...');
      await createBooksIndex(true);
      console.log('Index recreated.');
    }

    if (reembed) {
      console.log('Syncing all books to Elasticsearch (with embedding generation)...');
      const count = await syncAllBooks();
      console.log(`Done. Indexed ${count} books.`);
    }

    console.log('Reindex complete.');
    process.exit(0);
  } catch (err) {
    console.error('Reindex failed:', err);
    process.exit(1);
  }
}

main();
