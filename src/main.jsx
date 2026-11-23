import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { books } from './content';
import { createBookClient } from './library/bookClient';
import { createReadingRoomStore } from './library/store';
import './site.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const store = createReadingRoomStore(createBookClient(apiBaseUrl));

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App publishingEnabled showSampleCatalog={!apiBaseUrl && books.length === 0} />
  </Provider>,
);
