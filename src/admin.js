import { useEffect, useRef, useState } from 'react';

export const initialSession = { enabled: false, isAdmin: false, csrfToken: '' };

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['X-CSRF-Token'] = token;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error('The server could not complete the request.');
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export function usePortfolioAdmin(defaultContent, enabled) {
  const [snapshot, setSnapshot] = useState({ revision: 0, content: null });
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    request('/portfolio').then((value) => {
      if (!active) return;
      setSnapshot(value);
      setLoaded(true);
    }).catch(() => {});
    request('/admin/session').then((value) => {
      if (active) setSession(value);
    }).catch(() => {});

    return () => { active = false; };
  }, [enabled]);

  async function changeSession(password) {
    if (inFlight.current) return 'Another request is in progress.';
    const signingIn = password !== undefined;
    inFlight.current = true;
    setBusy(true);
    try {
      await request(signingIn ? '/admin/login' : '/admin/logout', {
        method: 'POST',
        body: signingIn ? { password } : undefined,
        token: session.csrfToken,
      });
      if (!signingIn) setSession(initialSession);
      setSession(await request('/admin/session'));
      if (signingIn) {
        setSnapshot(await request('/portfolio'));
        setLoaded(true);
      }
      return '';
    } catch (error) {
      if (error.status === 429) return 'Too many attempts. Try again in a minute.';
      if (error.status === 401 && signingIn) return 'Incorrect password.';
      return 'Could not update the session. Reload the page and try again.';
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const content = snapshot.content ?? defaultContent;

  async function publish(section, value) {
    if (inFlight.current) return 'Another request is in progress.';
    if (!loaded) return 'Could not load the published content. Reload the page and try again.';
    inFlight.current = true;
    setBusy(true);
    try {
      const saved = await request('/portfolio', {
        method: 'PUT',
        token: session.csrfToken,
        body: { revision: snapshot.revision, content: { ...content, [section]: value } },
      });
      setSnapshot(saved);
      return '';
    } catch (error) {
      if (error.status === 409) return 'The page changed elsewhere. Reload it before publishing.';
      if (error.status === 401 || error.status === 403) return 'Your session expired. Reload the page and sign in again.';
      if (error.status === 400) return 'Could not save. Check the fields and links and try again.';
      return 'Could not publish. Your changes are still in the form.';
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return { content, session, busy, publish, changeSession };
}
