import { configureStore } from '@reduxjs/toolkit'
import linkReducer from '../features/links/linksSlice'
import gscLinkReducer from '../features/gscLinks/gscLinksSlice'

export const store = configureStore({
  reducer: {
    links: linkReducer,
    gscLinks: gscLinkReducer
  },
})
