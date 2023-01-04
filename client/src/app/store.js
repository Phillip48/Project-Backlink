import { configureStore } from '@reduxjs/toolkit'
import linkReducer from '../features/links/linksSlice'


export const store = configureStore({
  reducer: {
    links: linkReducer
  },
})
