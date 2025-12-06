import { useEffect } from "react";
import { useCompanySettings } from "./useCompanySettings";

export const useFavicon = () => {
  const { companySettings } = useCompanySettings();

  useEffect(() => {
    // Try localStorage first for faster load
    const storedFavicon = localStorage.getItem("favicon_url");
    const faviconUrl = companySettings?.favicon_url || storedFavicon;

    if (faviconUrl) {
      applyFavicon(faviconUrl);
      localStorage.setItem("favicon_url", faviconUrl);
    }
  }, [companySettings?.favicon_url]);
};

const applyFavicon = (url: string) => {
  // Remove existing favicons
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());

  // Create new favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = url.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  link.href = url;
  document.head.appendChild(link);

  // Also add apple-touch-icon for mobile
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
};
