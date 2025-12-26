import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface ThemeContextType {
	  mode: ThemeMode;
	  resolvedTheme: "light" | "dark";
	  customColors?: ThemeColors;
	  setMode: (mode: ThemeMode) => void;
	  toggleTheme: () => void;
	}

const ThemeContext = createContext<ThemeContextType>({
  mode: "auto",
	  resolvedTheme: "light",
	  setMode: () => {},
	  toggleTheme: () => {},
	});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "auto";
  });
	  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
	  const [customColors, setCustomColors] = useState<ThemeColors | undefined>();
	
	  const toggleTheme = () => {
	    setMode((prevMode) => {
	      if (prevMode === "dark") return "light";
	      if (prevMode === "light") return "dark";
	      // Se for 'auto', alterna para o oposto do tema resolvido
	      return resolvedTheme === "dark" ? "light" : "dark";
	    });
	  };
	
	  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      let theme: "light" | "dark" = "light";

      if (mode === "dark") {
        theme = "dark";
      } else if (mode === "light") {
        theme = "light";
      } else if (mode === "auto") {
        theme = mediaQuery.matches ? "dark" : "light";
      }

      setResolvedTheme(theme);

      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);
    };

    updateTheme();

    const handleChange = () => {
      if (mode === "auto") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  useEffect(() => {
    if (customColors) {
      const root = document.documentElement;

      if (customColors.primary) {
        root.style.setProperty("--theme-primary", customColors.primary);
      }
      if (customColors.secondary) {
        root.style.setProperty("--theme-secondary", customColors.secondary);
      }
      if (customColors.accent) {
        root.style.setProperty("--theme-accent", customColors.accent);
      }
    } else {
      const root = document.documentElement;
      root.style.removeProperty("--theme-primary");
      root.style.removeProperty("--theme-secondary");
      root.style.removeProperty("--theme-accent");
    }
  }, [customColors]);

	  return (
	    <ThemeContext.Provider value={{ mode, resolvedTheme, customColors, setMode, toggleTheme }}>
	      {children}
	    </ThemeContext.Provider>
	  );
};
