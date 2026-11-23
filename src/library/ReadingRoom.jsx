import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadBooks, toggleSaved } from './store';

export default function ReadingRoom({ showSampleCatalog }) {
  const [query, setQuery] = useState('');
  const [onlySaved, setOnlySaved] = useState(false);
  const { books, savedIds, status } = useSelector((state) => state.readingRoom);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadBooks());
  }, [dispatch]);

  const search = query.trim().toLowerCase();
  const visibleBooks = books.filter(({ id, title, author }) => (
    (!onlySaved || savedIds.includes(id)) &&
    [title, author].some((field) => field.toLowerCase().includes(search))
  ));

  return (
    <div id="reading-room" tabIndex={-1} className="scroll-mt-24">
      <h3 className="font-serif text-3xl">Reading Room</h3>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-muted">
        <p>{showSampleCatalog ? 'Browse a sample catalog and save a reading list.' : 'Browse books and save a reading list.'}</p>
        <span aria-live="polite">{savedIds.length} saved</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-4 border-b border-rule pb-6">
        <label className="w-full max-w-md text-sm font-semibold">
          Search by title or author
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
            className="mt-2 block w-full rounded-md border border-rule bg-white px-4 py-3 font-normal"
            placeholder="Search books" />
        </label>
        <button type="button" aria-pressed={onlySaved} onClick={() => setOnlySaved(!onlySaved)}
          className="rounded-full border border-moss px-5 py-3 text-sm font-semibold text-moss hover:bg-lime aria-pressed:bg-moss aria-pressed:text-paper">
          Saved only
        </button>
      </div>
      {status === 'idle' || status === 'loading' ? <p className="py-6" role="status">Loading books…</p> : null}
      {status === 'error' && (
        <div className="py-6">
          <p role="alert">Couldn’t load the books.</p>
          <button type="button" onClick={() => dispatch(loadBooks())}
            className="mt-3 font-semibold text-moss underline underline-offset-4">Try again</button>
        </div>
      )}
      {status === 'ready' && visibleBooks.length === 0 && (
        <p className="py-6 text-muted" role="status">
          {search ? 'No books match your search.' : onlySaved ? 'Your reading list is empty.' : 'The catalog is empty.'}
        </p>
      )}
      {status === 'ready' && visibleBooks.length > 0 && (
        <ul aria-label="Books" className="divide-y divide-rule">
          {visibleBooks.map(({ id, title, author, category, note }) => {
            const saved = savedIds.includes(id);
            return (
              <li key={id} className="flex items-center justify-between gap-3 py-5 sm:gap-6">
                <div>
                  {category && <p className="text-xs font-semibold tracking-wide text-moss uppercase">{category}</p>}
                  <h4 className="mt-1 font-serif text-2xl">{title}</h4>
                  <p className="mt-1 text-sm text-muted">{author}</p>
                  {note && <p className="mt-2 text-sm">{note}</p>}
                </div>
                <button type="button" aria-label={`Save ${title}`} aria-pressed={saved}
                  onClick={() => dispatch(toggleSaved(id))}
                  className="shrink-0 rounded-full border border-moss px-4 py-2 text-sm font-semibold text-moss hover:bg-lime aria-pressed:bg-lime">
                  {saved ? 'Saved' : 'Save'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
