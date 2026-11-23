import { useState } from 'react';
import { articles, books, certificates, profile, projects } from './content';
import AdminSession from './AdminSession';
import ContentEditor from './ContentEditor';
import { usePortfolioAdmin } from './admin';
import { editorFields } from './editorFields';
import ReadingRoom from './library/ReadingRoom';

const defaultContent = {
  about: { name: profile.name, summary: profile.summary },
  education: profile.education,
  experience: profile.experience,
  certificates,
  projects,
  articles,
  passions: profile.passions.map((text) => ({ text })),
  books: books.length ? books : null,
};

const sections = [
  ['about', 'About me'],
  ['education', 'Education'],
  ['certificates', 'Certificates'],
  ['experience', 'Experience'],
  ['projects', 'Projects'],
  ['articles', 'Articles'],
  ['passion', 'Passion'],
  ['library', 'Library'],
];

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={`${id}-title`} id={id} tabIndex={-1}
      className="grid scroll-mt-24 gap-4 border-t border-rule py-12 sm:grid-cols-[1fr_2fr] sm:gap-10 sm:py-16">
      <h2 id={`${id}-title`} className="font-serif text-4xl tracking-tight">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Timeline({ entries, empty }) {
  if (entries.length === 0) return <p className="text-muted">{empty}</p>;

  return (
    <ul className="space-y-6">
      {entries.map(({ id, title, organization, dates, description, url }) => (
        <li key={id || `${title}-${organization}-${dates}`}>
          <h3 className="text-lg font-semibold">
            {url ? <a href={url} className="text-moss underline underline-offset-4">{title}</a> : title}
          </h3>
          <p className="text-muted">{[organization, dates].filter(Boolean).join(' · ')}</p>
          {description && <p className="mt-2">{description}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function App({ showSampleCatalog, publishingEnabled = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { content, session, busy, publish, changeSession } = usePortfolioAdmin(defaultContent, publishingEnabled);

  function editor(section, title) {
    if (!session.isAdmin) return null;
    return (
      <ContentEditor title={title} fields={editorFields[section]} busy={busy}
        entries={section === 'about' ? [content.about] : (content[section] ?? [])} single={section === 'about'}
        onSave={(entries) => publish(section, section === 'about' ? entries[0] : entries)} />
    );
  }

  return (
    <>
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:bg-paper focus:p-3" href="#about">
        Skip to content
      </a>
      <header className="sticky top-0 z-10 border-b border-rule bg-paper">
        <nav aria-label="Portfolio sections" className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-6">
            <a href="#about" className="font-serif text-xl">{content.about.name || 'Personal portfolio'}</a>
            <button type="button" aria-expanded={menuOpen} aria-controls="section-links"
              className="rounded-full border border-rule px-4 py-2 text-sm lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? 'Close menu' : 'Menu'}
            </button>
            <ul id="section-links" className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col pb-3 lg:flex lg:w-auto lg:flex-row lg:gap-5 lg:pb-0`}>
              {sections.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-muted hover:text-ink hover:underline">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>
      <main>
        <section id="about" tabIndex={-1} aria-labelledby="about-title" className="scroll-mt-16 overflow-hidden bg-moss text-paper focus-visible:outline-lime">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 sm:px-8 md:min-h-112 md:grid-cols-[3fr_2fr] md:py-20">
            <div>
              <h1 id="about-title" className="font-serif text-6xl leading-none tracking-tight sm:text-7xl lg:text-8xl">
                {content.about.name || 'About me'}
              </h1>
              <p className="mt-6 max-w-lg whitespace-pre-line text-lg leading-relaxed text-paper/85">
                {content.about.summary || 'A professional summary will be added here.'}
              </p>
              <a href="#projects" className="mt-8 inline-block rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink hover:bg-paper focus-visible:outline-lime">
                Explore projects <span aria-hidden="true">↘</span>
              </a>
              {editor('about', 'profile')}
            </div>
            <div aria-hidden="true" className="hero-art relative hidden aspect-[5/4] place-items-center md:grid">
              <div className="absolute inset-0 rounded-[50%] border border-paper/25" />
              <div className="absolute inset-[12%] rotate-[-18deg] rounded-[50%] border border-paper/25" />
              <div className="absolute inset-[24%] rotate-[24deg] rounded-[50%] border border-paper/35" />
              <span className="font-serif text-8xl text-lime">✳</span>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
          <Section id="education" title="Education">
            <Timeline entries={content.education} empty="Education details are forthcoming." />
            {editor('education', 'education entry')}
          </Section>
          <Section id="certificates" title="Certificates">
            <Timeline entries={content.certificates} empty="Certificates will appear here." />
            {editor('certificates', 'certificate')}
          </Section>
          <Section id="experience" title="Experience">
            <Timeline entries={content.experience} empty="Professional experience is forthcoming." />
            {editor('experience', 'experience entry')}
          </Section>
          <Section id="projects" title="Projects">
            <ul className="space-y-8">
              {content.projects.map(({ id, title, description, contribution, url }) => (
                <li key={id || title}>
                  <h3 className="font-serif text-3xl">{title}</h3>
                  <p className="mt-2">{description}</p>
                  <p className="mt-2 text-muted">{contribution}</p>
                  {url && (
                    <a href={url} className="mt-4 inline-block font-semibold text-moss underline underline-offset-4">
                      Open {title} <span aria-hidden="true">{url.startsWith('#') ? '↓' : '↗'}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {editor('projects', 'project')}
          </Section>
          <Section id="articles" title="Articles">
            <Timeline entries={content.articles} empty="Published articles will appear here." />
            {editor('articles', 'article')}
          </Section>
          <Section id="passion" title="Passion">
            {content.passions.length
              ? <div className="space-y-3">{content.passions.map(({ id, text }) => <p key={id || text} className="whitespace-pre-line">{text}</p>)}</div>
              : <p className="text-muted">Personal interests are forthcoming.</p>}
            {editor('passions', 'passion')}
          </Section>
          <Section id="library" title="Library">
            <ReadingRoom catalog={content.books} showSampleCatalog={content.books === null && showSampleCatalog} />
            {editor('books', 'book')}
          </Section>
        </div>
      </main>
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-5 py-6 sm:px-8">
          <a href="#about" className="text-sm text-moss underline underline-offset-4">Back to top ↑</a>
          <AdminSession session={session} busy={busy} onChange={changeSession} />
        </div>
      </footer>
    </>
  );
}
