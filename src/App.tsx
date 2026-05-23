import { ThemeProvider } from "./context/themeProvider";
import { FreakyShiki } from "./FreakyShiki";

export default function App() {
  return (
    <ThemeProvider>
      <div className="container">
        <FreakyShiki />
      </div>
    </ThemeProvider>
  );
}
