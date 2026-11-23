import { useState } from 'react';

const buttonClass = 'rounded-full border border-moss px-4 py-2 text-sm font-semibold text-moss hover:bg-lime';
const inputClass = 'mt-1 w-full rounded-md border border-rule bg-white px-3 py-2 font-normal text-ink';

export default function ContentEditor({ title, fields, entries, onSave, busy, single = false }) {
  const [index, setIndex] = useState(null);
  const [feedback, setFeedback] = useState('');
  const active = entries[index];

  function startEdit(nextIndex) {
    setFeedback('');
    setIndex(nextIndex);
  }

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const entry = { ...active };
    if (!active && !single) entry.id = crypto.randomUUID();

    for (const { name, required } of fields) {
      const value = data.get(name).trim();
      const input = form.elements.namedItem(name);
      if (required && !value) {
        input.setCustomValidity('Enter a value.');
        input.reportValidity();
        return;
      }
      if (name === 'url' && value && !/^(https?:\/\/|#[a-z0-9_-]+$)/i.test(value)) {
        input.setCustomValidity('Enter an HTTP or HTTPS link, or a section anchor such as #library.');
        input.reportValidity();
        return;
      }
      entry[name] = value;
    }

    const next = entries.slice();
    next[index] = entry;
    const error = await onSave(next);
    if (error) {
      setFeedback(error);
      return;
    }
    setIndex(null);
    setFeedback('Published.');
  }

  return (
    <div className="mt-5 rounded-lg border border-rule bg-paper p-4 text-ink">
      <h3 className="mb-3 text-sm font-semibold">Edit {title}</h3>
      {index === null ? (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry, position) => (
            <button key={entry.id || position} type="button" className={buttonClass} onClick={() => startEdit(position)}>
              {single ? 'Edit text' : `Edit ${entry.title || entry.text}`}
            </button>
          ))}
          {!single && (
            <button type="button" className={buttonClass} onClick={() => startEdit(entries.length)}>
              Add {title.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={busy} className="space-y-3">
            {fields.map(({ name, label, multiline, required }) => {
              const Element = multiline ? 'textarea' : 'input';
              return (
                <label className="block text-sm font-semibold" key={name}>
                  {label}
                  <Element name={name} defaultValue={active?.[name] ?? ''} required={required} maxLength={8000}
                    rows={multiline ? 4 : undefined} className={inputClass}
                    onChange={(event) => event.currentTarget.setCustomValidity('')} />
                </label>
              );
            })}
            <div className="flex gap-2">
              <button type="submit" className={buttonClass}>Publish</button>
              <button type="button" className={buttonClass} onClick={() => startEdit(null)}>Cancel</button>
            </div>
          </fieldset>
        </form>
      )}
      {feedback && <p role="status" className="mt-2 text-sm">{feedback}</p>}
    </div>
  );
}
