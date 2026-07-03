# Rules for the Trade Journal Assistant

## Dynamic Thinking Level Recommendation
For every user request, analyze the required cognitive effort. At the very top of your response, output a brief tip advising the user on the most efficient model setting to use for that specific task:

- **Gemini 3.5 Flash (Low)**: Recommended for simple conversational answers, formatting code, writing comments/git messages, or basic single-sentence explanations.
- **Gemini 3.5 Flash (Medium)**: Recommended for standard coding tasks, single-file edits, basic UI changes, or direct API integration.
- **Gemini 3.5 Flash (High)**: Recommended for complex logic, multi-file refactoring, deep debugging, math, or architectural planning.

### Example Output Format:
> [!TIP]
> **Recommended IDE Model Selection**: **Gemini 3.5 Flash (Medium)** (balanced speed/cost for this task).

*(Only output this tip if the current task's complexity differs significantly from what you estimate is the user's active setting, or if it would result in significant token savings).*
