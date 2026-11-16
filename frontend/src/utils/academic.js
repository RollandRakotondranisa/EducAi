import apiFetch from "./api";

export const formatDate = (value) => value
  ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
  : "Non définie";

export const formatTeacher = (teacher) =>
  [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || teacher?.email || "Enseignant";

export async function fetchCourses() {
  const response = await apiFetch("/courses");
  return response.data ?? [];
}

export async function fetchDocumentsForCourses(courses) {
  const batches = await Promise.all(courses.map(async (course) => {
    const response = await apiFetch(`/documents/courses/${course.id}/documents`);
    return (response.data ?? []).map((document) => ({ ...document, course }));
  }));
  return batches.flat();
}

export async function fetchStudentsForCourses(courses) {
  const batches = await Promise.all(courses.map(async (course) => {
    const response = await apiFetch(`/courses/${course.id}/students`);
    return (response.data ?? []).map((enrollment) => ({
      ...enrollment.student,
      course,
      enrollmentId: enrollment.id,
      enrollmentCreatedAt: enrollment.createdAt,
    }));
  }));

  return batches.flat();
}

export async function fetchStudentsForTeacher() {
  const response = await apiFetch("/auth/teacher/students");
  return response.data ?? [];
}
