# Plan: Note AI Chat & Visual Refinements

## Phase 1: Visual & UI Refinements
- [ ] Task: Update Freeze Dialog Label
    - [ ] Sub-task: Create/Update test for `FreezeDialog` to check for "Next Step Plan" label
    - [ ] Sub-task: Modify `FreezeDialog.tsx` to change label from "Current Status" to "Next Step Plan"
- [ ] Task: Implement Compact Mode for Frozen Notes
    - [ ] Sub-task: Create test for `NoteCard` compact mode (check for collapsed content, specific styles)
    - [ ] Sub-task: Modify `NoteCard.tsx` to accept `isCompact` prop
    - [ ] Sub-task: Implement collapsed visual style (max-height, overflow hidden, expand on click)
    - [ ] Sub-task: Update `CryopodDashboard` or relevant container to pass `isCompact={true}` for frozen notes
- [ ] Task: Conductor - User Manual Verification 'Visual & UI Refinements' (Protocol in workflow.md)

## Phase 2: AI Chat Infrastructure
- [ ] Task: Create AI Chat Sidebar Component
    - [ ] Sub-task: Create `components/AIChatSidebar.tsx` and test file
    - [ ] Sub-task: Implement basic sidebar layout (header, message area, input area)
- [ ] Task: Integrate Sidebar into App Layout
    - [ ] Sub-task: Update `App.tsx` to include `AIChatSidebar`
    - [ ] Sub-task: Add state for `isChatOpen` and `activeChatNoteId`
- [ ] Task: Add AI Chat Entry Point
    - [ ] Sub-task: Update `NoteCard` to include "AI Chat" button
    - [ ] Sub-task: Wire button to open sidebar and set active note
- [ ] Task: Conductor - User Manual Verification 'AI Chat Infrastructure' (Protocol in workflow.md)

## Phase 3: AI Chat Logic & Persistence
- [ ] Task: Implement Chat Interface Logic
    - [ ] Sub-task: Implement message history state in Sidebar
    - [ ] Sub-task: Connect to Mock/Real Gemini API (via `lib/ai.ts` or similar)
    - [ ] Sub-task: Implement "Initial Insight" generation on open
- [ ] Task: Implement "End & Save" Workflow
    - [ ] Sub-task: Create "End Session" button in Sidebar
    - [ ] Sub-task: Implement "Summary/Insight Generation" logic
    - [ ] Sub-task: Create "Review & Edit" UI for the generated insight
    - [ ] Sub-task: Implement "Save to Note" function (append formatted text to `note.content`)
- [ ] Task: Conductor - User Manual Verification 'AI Chat Logic & Persistence' (Protocol in workflow.md)