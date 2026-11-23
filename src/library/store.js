import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const loadBooks = createAsyncThunk(
  'readingRoom/loadBooks',
  (_, { extra }) => extra.getBooks(),
  { condition: (_, { getState }) => getState().readingRoom.status !== 'loading' },
);

const readingRoom = createSlice({
  name: 'readingRoom',
  initialState: { books: [], savedIds: [], status: 'idle' },
  reducers: {
    toggleSaved(state, { payload: id }) {
      const index = state.savedIds.indexOf(id);
      if (index === -1) state.savedIds.push(id);
      else state.savedIds.splice(index, 1);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadBooks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadBooks.fulfilled, (state, { payload }) => {
        state.books = payload;
        state.status = 'ready';
      })
      .addCase(loadBooks.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export const { toggleSaved } = readingRoom.actions;

export function createReadingRoomStore(getBooks) {
  return configureStore({
    reducer: { readingRoom: readingRoom.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      thunk: { extraArgument: { getBooks } },
    }),
  });
}
