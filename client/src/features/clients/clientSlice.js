import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import clientService from "./clientService";

const initialState = {
  client: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// crawl new link
// export const crawlLink = createAsyncThunk(
//   "links/crawl",
//   async (linksData, thunkAPI) => {
//     try {
//       return await linksService.crawlSite(linksData);
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

// Get clients
export const getClient = createAsyncThunk(
  "client/getAll",
  async (_, thunkAPI) => {
    try {
      return await clientService.getClient();
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

// Create new client
export const createClient = createAsyncThunk(
    'client/create',
    async (clientData, thunkAPI) => {
      try {
        return await clientService.createClient(clientData)
      } catch (error) {
        const message =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString()
        return thunkAPI.rejectWithValue(message)
      }
    }
  )

// Delete client
export const deleteClient = createAsyncThunk(
  "client/delete",
  async (id, thunkAPI) => {
    try {
      return await clientService.deleteClient(id);
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


export const clientSlice = createSlice({
  name: "client",
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
    //   .addCase(crawlLink.pending, (state) => {
    //     state.isLoading = true;
    //   })
    //   .addCase(crawlLink.fulfilled, (state, action) => {
    //     state.isLoading = false;
    //     state.isSuccess = true;
    //     // console.log(state);
    //     state.links.push(action.payload);
    //   })
    //   .addCase(crawlLink.rejected, (state, action) => {
    //     state.isLoading = false;
    //     state.isError = true;
    //     state.message = action.payload;
    //   })
    //   .addCase(recheckLinks.pending, (state) => {
    //     state.isLoading = true;
    //   })
    //   .addCase(recheckLinks.fulfilled, (state, action) => {
    //     state.isLoading = false;
    //     state.isSuccess = true;
    //     state.links = action.payload;
    //   })
    //   .addCase(recheckLinks.rejected, (state, action) => {
    //     state.isLoading = false;
    //     state.isError = true;
    //     state.message = action.payload;
    //   })
      .addCase(getClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.client = action.payload;
      })
      .addCase(getClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.client.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.client = state.client.filter(
          (client) => client._id !== action.payload.id
        );
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = clientSlice.actions;
export default clientSlice.reducer;
