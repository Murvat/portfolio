import { randomUUID } from 'node:crypto';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import App from './App';
import { createReadingRoomStore } from './library/store';

test('shows same-page publishing controls only after sign-in and displays the published edits', async () => {
  const previousFetch = global.fetch;
  const previousRandomUUID = global.crypto.randomUUID;
  global.crypto.randomUUID = randomUUID;
  let isAdmin = false;
  let published = { revision: 0, content: null };
  const send = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
  global.fetch = jest.fn(async (path, options) => {
    if (path === '/api/admin/session') {
      return send({ enabled: true, isAdmin, csrfToken: isAdmin ? 'admin-token' : 'visitor-token' });
    }
    if (path === '/api/admin/login') {
      expect(options.headers['X-CSRF-Token']).toBe('visitor-token');
      isAdmin = true;
      return send(null, 204);
    }
    if (options.method === 'PUT') {
      expect(isAdmin).toBe(true);
      expect(options.headers['X-CSRF-Token']).toBe('admin-token');
      const update = JSON.parse(options.body);
      expect(update.revision).toBe(published.revision);
      published = { revision: update.revision + 1, content: update.content };
    }
    return send(published);
  });

  try {
    const user = userEvent.setup();
    const store = createReadingRoomStore(async () => []);
    render(<Provider store={store}><App publishingEnabled /></Provider>);
    const signIn = await screen.findByRole('button', { name: 'Admin sign in' });
    expect(screen.queryByRole('button', { name: 'Add certificate' })).not.toBeInTheDocument();
    await user.click(signIn);
    await user.type(screen.getByLabelText('Admin password'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }));

    const certificates = within(screen.getByRole('region', { name: 'Certificates' }));
    await user.click(await certificates.findByRole('button', { name: 'Add certificate' }));
    await user.type(certificates.getByLabelText('Title'), 'Cloud Fundamentals');
    await user.type(certificates.getByLabelText('Issuer'), 'Example Academy');
    await user.click(certificates.getByRole('button', { name: 'Publish' }));
    expect(await certificates.findByRole('heading', { name: 'Cloud Fundamentals' })).toBeInTheDocument();

    const library = within(screen.getByRole('region', { name: 'Library' }));
    await user.click(library.getByRole('button', { name: 'Add book' }));
    await user.type(library.getByLabelText('Title'), 'Kindred');
    await user.type(library.getByLabelText('Author'), 'Octavia E. Butler');
    await user.click(library.getByRole('button', { name: 'Publish' }));
    expect(await library.findByRole('heading', { name: 'Kindred' })).toBeInTheDocument();
    expect(published.content.certificates).toHaveLength(1);
    expect(published.content.books[0]).toMatchObject({ title: 'Kindred', author: 'Octavia E. Butler' });
  } finally {
    global.fetch = previousFetch;
    if (previousRandomUUID) global.crypto.randomUUID = previousRandomUUID;
    else delete global.crypto.randomUUID;
  }
});
