# 实施计划：现有笔记的心流冷冻

## 第一阶段：UI 与对话框增强
- [x] 任务：更新 `NoteCard` 组件，在工具栏中添加 ❄️ “冷冻”操作按钮。 0f533d1
- [x] 任务：更新 `FreezeDialog` 组件，支持在“双重视图”布局中接收并显示 `referenceContent`（原始笔记内容）。 0f533d1
- [x] 任务：在从 `NoteCard` 触发时，将活跃笔记的内容传递给 `FreezeDialog`。 0f533d1
- [x] 任务：Conductor - 用户手册验证 '第一阶段' (协议见 workflow.md) 0f533d1

## 第二阶段：逻辑与数据集成
- [x] 任务：在 `useNotes` hook 中更新 `freezeExistingNote` 函数。 0f533d1
- [x] 任务：连接 `App.tsx` 逻辑以处理流程：NoteCard 点击 -> 打开对话框 -> 调用 `freezeExistingNote`。 0f533d1
- [x] 任务：确保更新后的笔记立即出现在 `CryopodDashboard` 中。 0f533d1
- [x] 任务：Conductor - 用户手册验证 '第二阶段' (协议见 workflow.md) 0f533d1
