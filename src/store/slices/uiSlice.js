import { createSlice } from "@reduxjs/toolkit";

// Tiny slice that remembers UI-only state shared across components.
// Right now: is the AI chat modal open or closed?
const initialState = {
  chatOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openChat: (state) => {
      state.chatOpen = true; // used by the sidebar button and the floating chat button
    },
    closeChat: (state) => {
      state.chatOpen = false; // used by the X button, Escape key and the mobile backdrop
    },
  },
});

export const { openChat, closeChat } = uiSlice.actions;
export default uiSlice.reducer;