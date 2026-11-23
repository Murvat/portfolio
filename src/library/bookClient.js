import { books as localBooks } from '../content';
import { sampleBooks } from './books';

export function createBookClient(baseUrl) {
  return async function getBooks() {
    if (!baseUrl) {
      return localBooks.length ? localBooks : sampleBooks;
    }

    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/books`);
    if (!response.ok) throw new Error('Could not load books.');

    const books = await response.json();
    if (!Array.isArray(books)) throw new Error('Invalid book catalog.');
    return books;
  };
}
