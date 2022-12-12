import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import sendReducer from '../features/sends/SendsSlice'
import projectReducer from '../features/climbingProjects/projectsSlice'
import climbingSessionReducer from '../features/climbingSessions/climbingSessionSlice'
import trainingSessionReducer from '../features/trainingSessions/trainingSessionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sends: sendReducer,
    projects: projectReducer,
    climbingSessions: climbingSessionReducer,
    trainingSessions: trainingSessionReducer,
  },
})
