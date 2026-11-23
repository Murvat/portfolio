const field = (name, label, { multiline = false, required = false } = {}) => ({ name, label, multiline, required });
const title = field('title', 'Title', { required: true });
const link = field('url', 'Link');
const description = field('description', 'Description', { multiline: true });
const timeline = (organization, dates = 'Dates') => [title, field('organization', organization), field('dates', dates), description, link];

export const editorFields = {
  about: [field('name', 'Name'), field('summary', 'Professional summary', { multiline: true })],
  education: timeline('Institution'),
  certificates: timeline('Issuer', 'Date earned'),
  experience: timeline('Employer'),
  articles: timeline('Publication', 'Date published'),
  projects: [title, description, field('contribution', 'Your contribution', { multiline: true }), link],
  passions: [field('text', 'Passion', { multiline: true, required: true })],
  books: [title, field('author', 'Author', { required: true }), field('category', 'Category'), field('note', 'Personal note', { multiline: true })],
};
