import { useState } from "react";
export function useLoginAction() {
  const [opening, setOpening] = useState(false);
  return { opening, start: () => setOpening(true) };
}
