import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { Provider } from 'react-redux';
import { createReadingRoomStore } from './library/store';

test('lists the eight sections in order and links to each section', async () => {
  const store = createReadingRoomStore(async () => []);
  render(<Provider store={store}><App /></Provider>);
  await screen.findByText('The catalog is empty.');
  const menu = screen.getByRole('button', { name: 'Menu' });
  await userEvent.click(menu);
  expect(menu).toHaveAttribute('aria-expanded', 'true');

  const sectionIds = ['about', 'education', 'certificates', 'experience', 'projects', 'articles', 'passion', 'library'];
  expect(screen.getAllByRole('region').map(({ id }) => id)).toEqual(sectionIds);
  const nav = within(screen.getByRole('navigation'));
  expect(nav.getAllByRole('listitem').map((item) => (
    within(item).getByRole('link').getAttribute('href')
  ))).toEqual(sectionIds.map((id) => `#${id}`));

  await userEvent.click(nav.getByRole('link', { name: 'Library' }));
  expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('link', { name: 'Open Reading Room' }))
    .toHaveAttribute('href', '#reading-room');
  expect(within(screen.getByRole('region', { name: 'Library' })).getByRole('heading', { name: 'Reading Room' })).toBeInTheDocument();
});
