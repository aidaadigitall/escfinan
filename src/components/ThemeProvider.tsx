import { createContext, useContext, useEffect, useState } from "react";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";

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
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "auto",
  resolvedTheme: "light",
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
  const { preferences } = useDashboardPreferences();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const mode: ThemeMode = preferences?.theme_mode || "auto";
  const customColors = preferences?.custom_theme;

  useEffect(() => {
    // Detecta a preferência do sistema
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

      // Aplica a classe no elemento raiz
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);

      // Atualiza o atributo data-theme para compatibilidade
      root.setAttribute("data-theme", theme);
    };

    updateTheme();

    // Escuta mudanças na preferência do sistema
    const handleChange = () => {
      if (mode === "auto") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  useEffect(() => {
    // Aplica cores customizadas via CSS variables
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
      // Remove cores customizadas se não houver
      const root = document.documentElement;
      root.style.removeProperty("--theme-primary");
      root.style.removeProperty("--theme-secondary");
      root.style.removeProperty("--theme-accent");
    }
  }, [customColors]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, customColors }}>
      {children}
    </ThemeContext.Provider>
  );
};
