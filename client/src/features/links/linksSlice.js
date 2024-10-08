import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import linksService from "./linksService";

const initialState = {
  links: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// crawl new link
export const crawlLink = createAsyncThunk(
  "links/crawl",
  async (linksData, thunkAPI) => {
    try {
      return await linksService.crawlSite(linksData);
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

// crawl gsc links
// export const gscCrawlLink = createAsyncThunk(
//   "links/gsccrawl",
//   async (linksData, thunkAPI) => {
//     try {
//       return await linksService.gscCrawl(linksData);
//     } catch (error) {
//       const message =
//         (error.response &&
//           error.response.data &&
//           error.response.data.message) ||
//         error.message ||
//         error.toString();
//       return thunkAPI.rejectWithValue(message);
//     }
//   }
// );
// Get user projects
export const getLinks = createAsyncThunk(
  "links/getAll",
  async (_, thunkAPI) => {
    try {
      return await linksService.getLinks();
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

export const getSingleLink = createAsyncThunk(
  "links/getSingleLink",
  async (_, thunkAPI) => {
    try {
      return await linksService.getSingleLink();
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

// Get user projects
export const recheckLinks = createAsyncThunk(
  "links/recheckAll",
  async (_, thunkAPI) => {
    try {
      return await linksService.recheckLinks();
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

// Delete user send
export const deleteLinks = createAsyncThunk(
  "links/delete",
  async (id, thunkAPI) => {
    try {
      return await linksService.deleteProject(id);
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


export const linksSlice = createSlice({
  name: "links",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(crawlLink.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(crawlLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // console.log(state);
        state.links.push(action.payload);
      })
      .addCase(crawlLink.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // .addCase(gscCrawlLink.pending, (state) => {
      //   state.isLoading = true;
      // })
      // .addCase(gscCrawlLink.fulfilled, (state, action) => {
      //   state.isLoading = false;
      //   state.isSuccess = true;
      //   state.links = state.links.concat(action.payload);
      // })
      // .addCase(gscCrawlLink.rejected, (state, action) => {
      //   state.isLoading = false;
      //   state.isError = true;
      //   state.message = action.payload;
      // })
      .addCase(recheckLinks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(recheckLinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.links = action.payload;
      })
      .addCase(recheckLinks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getLinks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.links = action.payload;
      })
      .addCase(getLinks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSingleLink.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSingleLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.links = action.payload;
      })
      .addCase(getSingleLink.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteLinks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteLinks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.links = state.links.filter(
          (link) => link._id !== action.payload.id
        );
      })
      .addCase(deleteLinks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = linksSlice.actions;
export default linksSlice.reducer;
