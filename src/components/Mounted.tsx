import { useState, useEffect } from "react";

interface IMountedProps {
  children: React.JSX.Element;
}

export function Mounted({ children }: IMountedProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
  }, []);

  return mounted ? children : null;
}
