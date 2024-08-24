import { configureStore } from '@reduxjs/toolkit'
import linkReducer from '../features/links/linksSlice'
import clientReducer from '../features/clients/clientSlice'
import gscLinkReducer from '../features/gscLinks/gscLinksSlice'

export const store = configureStore({
  reducer: {
    links: linkReducer,
    client: clientReducer,
    gscLinks: gscLinkReducer
  },
})
