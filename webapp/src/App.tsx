import React from "react";
import { MainPage } from "./pages/MainPage";
import { AppProviders } from "./providers/AppProviders";

function App() {
  return (
    <AppProviders>
      <MainPage />
    </AppProviders>
  );
}

export default App;
