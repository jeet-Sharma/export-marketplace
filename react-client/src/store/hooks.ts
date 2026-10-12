import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

// Typed hooks (frontend-rules #5) — components use these, never the raw
// untyped useDispatch/useSelector.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
