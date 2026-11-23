import { useState } from 'react';

export default function AdminSession({ session, busy, onChange }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!session.enabled && !feedback) return null;

  async function signIn(event) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    const error = await onChange(password);
    setFeedback(error);
    if (!error) setOpen(false);
  }

  return (
    <div className="text-sm">
      {session.isAdmin ? (
        <button type="button" disabled={busy} className="text-moss underline underline-offset-4"
          onClick={async () => setFeedback(await onChange())}>
          Sign out of editor
        </button>
      ) : session.enabled && (
        <button type="button" aria-expanded={open} aria-controls="admin-sign-in"
          className="text-moss underline underline-offset-4" onClick={() => setOpen(!open)}>
          Admin sign in
        </button>
      )}
      {open && session.enabled && !session.isAdmin && (
        <form id="admin-sign-in" onSubmit={signIn} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="font-semibold">
            Admin password
            <input name="password" type="password" autoComplete="current-password" maxLength={1024} required
              className="mt-1 block rounded-md border border-rule bg-white px-3 py-2" />
          </label>
          <button type="submit" disabled={busy} className="rounded-full bg-moss px-4 py-2 font-semibold text-paper">
            Sign in
          </button>
        </form>
      )}
      {feedback && <p role="status" className="mt-2">{feedback}</p>}
    </div>
  );
}
