# Page snapshot

```yaml
- generic [ref=e2]:
  - heading "TO-DO List" [level=1] [ref=e3]
  - generic [ref=e4]:
    - heading "Add New TO-DO Item" [level=2] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]: "Task Name:"
      - textbox "Task Name:" [ref=e8]:
        - /placeholder: Enter task name...
    - generic [ref=e9]:
      - generic [ref=e10]: "Priority:"
      - generic [ref=e11]:
        - generic [ref=e12] [cursor=pointer]:
          - radio "1 (Low)" [checked] [ref=e13]
          - text: 1 (Low)
        - generic [ref=e14] [cursor=pointer]:
          - radio "2 (Medium)" [ref=e15]
          - text: 2 (Medium)
        - generic [ref=e16] [cursor=pointer]:
          - radio "3 (High)" [ref=e17]
          - text: 3 (High)
    - generic [ref=e18]:
      - generic [ref=e19]: "Status:"
      - combobox "Status:" [ref=e20]:
        - option "Not Started" [selected]
        - option "In Progress"
        - option "Completed"
    - button "Add TO-DO Item" [ref=e21] [cursor=pointer]
  - generic [ref=e22]:
    - heading "Your TO-DO Items" [level=2] [ref=e23]
    - generic [ref=e25]: No TO-DO items yet. Add one above!
```