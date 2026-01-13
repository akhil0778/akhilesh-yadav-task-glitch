1. Diagnosing Bug 1 (Double Fetch)
Problem: The app was fetching task data twice when it started. This caused unnecessary loading and could slow the app.
Fix:
We used a useRef flag called fetchedRef to track if the data was already loaded.
Now, the fetch function only runs once, preventing double loading.

2. Fixing Bug 2 (Undo Snackbar Logic)
Problem: When a task was deleted, the "Undo" snackbar showed. But if the snackbar disappeared automatically, the app forgot which task was deleted. This caused problems if you deleted another task later.
Fix:
We added a lastDeleted state to remember the last deleted task.
We added a clearLastDeleted function to clear it after undo or timeout.
Now, the Undo button always works correctly and restores only the last deleted task.

3. Stabilizing Sort (Bug 3)
Problem: Tasks were sorted by ROI (Revenue ÷ Time). If two tasks had the same ROI, their order changed randomly every time the list updated.
Fix:
We added a secondary comparison in the sort function.
If ROI is the same, tasks are sorted by title or id.
This prevents the list from flickering and keeps tasks in a stable order.

4. Stopping Event Bubbling
Problem: When clicking buttons inside the task table (like delete or edit), sometimes the click affected the table row or other buttons. This caused unexpected actions.
Fix:
We used event.stopPropagation() on button clicks.
Now, button clicks only do what they are supposed to do without affecting other elements.

5. ROI Validation
Problem: Calculating ROI as Revenue ÷ TimeTaken could give Infinity if TimeTaken was 0. This caused wrong metrics and UI problems.
Fix:
We updated the computeROI function to check if TimeTaken is 0 or invalid.
If invalid, ROI returns 0.
We also auto-correct timeTaken to 1 when adding or updating tasks.
Now, ROI is always safe and metrics display correctly.
