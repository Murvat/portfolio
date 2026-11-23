import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import ReadingRoom from './ReadingRoom';
import { sampleBooks } from './books';
import { createReadingRoomStore } from './store';

function renderDemo(getBooks = async () => sampleBooks) {
  const store = createReadingRoomStore(getBooks);
  render(<Provider store={store}><ReadingRoom /></Provider>);
  return store;
}

test('searches the catalog, saves and removes books', async () => {
  const user = userEvent.setup();
  const store = renderDemo();
  await screen.findByRole('list', { name: 'Books' });
  await user.type(screen.getByRole('searchbox'), 'unmatched');
  expect(screen.getByRole('status')).toHaveTextContent('No books match your search.');
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'butler');
  const list = screen.getByRole('list', { name: 'Books' });
  expect(within(list).getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Kindred']);
  await user.click(screen.getByRole('button', { name: 'Save Kindred' }));
  expect(store.getState().readingRoom.savedIds).toEqual(['kindred']);
  await user.clear(screen.getByRole('searchbox'));
  await user.click(screen.getByRole('button', { name: 'Saved only' }));
  expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Save Kindred' }));
  expect(store.getState().readingRoom.savedIds).toEqual([]);
  expect(screen.getByRole('status')).toHaveTextContent('Your reading list is empty.');
});

test('shows loading and an error, then retries and handles an empty catalog', async () => {
  const getBooks = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  renderDemo(getBooks);
  expect(screen.getByRole('status')).toHaveTextContent('Loading books');
  expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load the books.');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('The catalog is empty.')).toBeInTheDocument();
  expect(getBooks).toHaveBeenCalledTimes(2);
});
