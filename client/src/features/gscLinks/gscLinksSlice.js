import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import linksService from "./gscLinksService";

const initialState = {
  gscLinks: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// crawl gsc links
export const gscCrawlLink = createAsyncThunk(
  "links/gsccrawl",
  async (linksData, thunkAPI) => {
    try {
      return await linksService.gscCrawl(linksData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


export const gscLinksSlice = createSlice({
  name: "gscLinks",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(gscCrawlLink.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(gscCrawlLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.gscLinks = action.payload;
      })
      .addCase(gscCrawlLink.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
  },
});

export const { reset } = gscLinksSlice.actions;
export default gscLinksSlice.reducer;
