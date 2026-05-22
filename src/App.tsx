import { ThemeProvider } from "./context/themeProvider";
import { FreakyShiki } from "./FreakyShiki";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-10">
        <div className="w-full max-w-4xl">
          <FreakyShiki />
        </div>
      </div>
    </ThemeProvider>
  );
}
