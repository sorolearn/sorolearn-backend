// Course slugs a certificate can be minted for. These must match the course
// `slug`s in the frontend's src/lib/courses.ts (sorolearn-frontend repo):
// adding a course there means adding its slug here too, or minting for it
// will be rejected as "Invalid course".
export const COURSE_SLUGS: readonly string[] = ["beginner", "intermediate", "advanced"];

export function isKnownCourse(slug: unknown): slug is string {
  return typeof slug === "string" && COURSE_SLUGS.includes(slug);
}
