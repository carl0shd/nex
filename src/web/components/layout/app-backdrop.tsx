import { createContext, useContext } from "react";

export const AppBackdropContext = createContext<HTMLElement | null>(null);

export const useAppBackdrop = () => useContext(AppBackdropContext);
