import { StudentScreen } from "./StudentScreen";

/** Suspense fallback for student pages while server data streams in. */
export function StudentLoading() {
  return <StudentScreen loading>{null}</StudentScreen>;
}
