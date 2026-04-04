import { createContext, useContext } from "react";

export const SharedStateContext = createContext(null);
export const useSharedState = () => useContext(SharedStateContext);