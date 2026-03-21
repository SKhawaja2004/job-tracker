export type CreateApplicationState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: {
    company?: string;
    roleTitle?: string;
    jobUrl?: string;
  };
};

export const INITIAL_CREATE_STATE: CreateApplicationState = {
  status: 'idle',
};
