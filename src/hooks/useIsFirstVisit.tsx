import { useState, useEffect } from "react";

export const useIsFirstVisit = (key: string) => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem(key);
    if (!hasVisited) {
      setIsFirstVisit(true);
      sessionStorage.setItem(key, "true");
    }
  }, [key]);

  return isFirstVisit;
};
