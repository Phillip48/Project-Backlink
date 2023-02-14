import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import linksService from "./linksService";

const initialState = {
  projects: [],
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
export const gscCrawlLink = createAsyncThunk(
  "links/crawl",
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

// Create new Project
// export const createLink = createAsyncThunk(
//   'links/create',
//   async (linksData, thunkAPI) => {
//     try {
//       return await linksService.createLink(linksData)
//     } catch (error) {
//       const message =
//         (error.response &&
//           error.response.data &&
//           error.response.data.message) ||
//         error.message ||
//         error.toString()
//       return thunkAPI.rejectWithValue(message)
//     }
//   }
// )

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

// update user send
// export const updateProject = createAsyncThunk(
//   'projects/update',
//   async (id, thunkAPI) => {
//     try {
//       const token = thunkAPI.getState().auth.user.token
//       return await linksService.updateProject(id, token)
//     } catch (error) {
//       const message =
//         (error.response &&
//           error.response.data &&
//           error.response.data.message) ||
//         error.message ||
//         error.toString()
//       return thunkAPI.rejectWithValue(message)
//     }
//   }
// )

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
        state.links.push(action.payload);
      })
      .addCase(crawlLink.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(gscCrawlLink.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(gscCrawlLink.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.links.push(action.payload);
      })
      .addCase(gscCrawlLink.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // .addCase(createLink.pending, (state) => {
      //   state.isLoading = true
      // })
      // .addCase(createLink.fulfilled, (state, action) => {
      //   state.isLoading = false
      //   state.isSuccess = true
      //   state.links.push(action.payload)
      // })
      // .addCase(createLink.rejected, (state, action) => {
      //   state.isLoading = false
      //   state.isError = true
      //   state.message = action.payload
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
    //
    // .addCase(updateProject.pending, (state) => {
    //   state.isLoading = true
    // })
    // .addCase(updateProject.fulfilled, (state, action) => {
    //   state.isLoading = false
    //   state.isSuccess = true
    //   state.projects = state.projects.filter(
    //     (project) => project._id !== action.payload.id
    //   )
    // })
    // .addCase(updateProject.rejected, (state, action) => {
    //   state.isLoading = false
    //   state.isError = true
    //   state.message = action.payload
    // })
  },
});

export const { reset } = linksSlice.actions;
export default linksSlice.reducer;
