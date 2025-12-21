# Plan: Refine WebDAV Synchronization

## Phase 1: Robustness & Error Handling

- [ ] Task: Analyze current `lib/webdav.ts` and `lib/sync.ts` to identify weak points.
- [ ] Task: Implement a retry mechanism with exponential backoff for WebDAV requests in `lib/webdav.ts`.
- [ ] Task: Write unit tests for the retry logic.
- [ ] Task: Enhance error handling in `lib/sync.ts` to catch and log specific WebDAV error codes.
- [ ] Task: Write tests for error handling scenarios (network error, auth error, server error).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Robustness & Error Handling' (Protocol in workflow.md)

## Phase 2: Conflict Resolution Strategy

- [ ] Task: Define the conflict resolution strategy (Last Write Wins based on timestamp).
- [ ] Task: Update the sync logic to check for modification timestamps before overwriting.
- [ ] Task: Implement the "Last Write Wins" logic in `lib/sync.ts`.
- [ ] Task: Write unit tests simulating conflict scenarios (local newer, remote newer).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Conflict Resolution Strategy' (Protocol in workflow.md)

## Phase 3: UI Feedback & Logging

- [ ] Task: Add a sync status indicator to the UI (e.g., in `Sidebar.tsx` or a dedicated status bar).
- [ ] Task: Implement user notifications for sync errors (using `react-toastify` or similar if available, or a simple alert).
- [ ] Task: Ensure internal logs provide enough context for debugging sync issues.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UI Feedback & Logging' (Protocol in workflow.md)

