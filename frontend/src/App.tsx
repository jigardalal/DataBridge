import { Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { Navbar } from "./components/Navbar";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2"
    }
  }
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Navbar />
        <main style={{ padding: "2rem" }}>
          <Routes>
            <Route path="/" element={<div>Welcome to DataBridge</div>} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}
