import { SUBJECTS } from "../constants/subjects";

const SUBJECT_STORAGE_KEY = "quizcse:last-subject";

export const getRememberedSubject = () => {
  if (typeof window === "undefined") {
    return SUBJECTS[0];
  }

  const storedSubject = window.localStorage.getItem(SUBJECT_STORAGE_KEY);

  return SUBJECTS.includes(storedSubject) ? storedSubject : SUBJECTS[0];
};

export const rememberSubject = (subject) => {
  if (typeof window === "undefined" || !SUBJECTS.includes(subject)) {
    return;
  }

  window.localStorage.setItem(SUBJECT_STORAGE_KEY, subject);
};
