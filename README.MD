# effector-undo
Simple undo/redo functionality for effector

Example
```javascript
import { createHistory } from "@tanyaisinmybed/effector-undo";

export const {undo, redo} = createHistory({ 
    limit: 10, 
    events: [inc, dec]
})(counter);
```