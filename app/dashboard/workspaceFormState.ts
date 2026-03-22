export type WorkspaceFormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

export const INITIAL_WORKSPACE_FORM_STATE: WorkspaceFormState = {
  status: 'idle',
};
