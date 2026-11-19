// Programmes run for 8 semesters. Each course belongs to one semester and
// students are enrolled in every course of the semester they are in.
export const SEMESTER_COUNT = 8;
export const SEMESTERS = Array.from({ length: SEMESTER_COUNT }, (_, i) => i + 1);
export const semesterLabel = (n) => (n ? `Semester ${n}` : '–');

//phase 5