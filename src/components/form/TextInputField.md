# TextInputField — Props Reference

This document lists the props accepted by the `TextInputField` component and how to use them.

- **fcId**: string — Unique identifier for the field (used as key and form id).
- **label**: string — Field label displayed above the input.
- **placeholder**: string — Placeholder text shown when the input is empty.
- **value**: any — Current value of the field. For the text input typically a string.
- **onChangeText**: function(value) — Callback invoked when the input value changes. Signature: `(value) => void`.
- **maxLength**: number — Maximum number of characters allowed. When provided, a counter is shown.
- **keyboardType**: string — Keyboard type hint. Examples: `default`, `numeric`, `email-address`, `phone-pad`.
- **editable**: boolean — Whether the field is editable. Default: `true`.
- **multiline**: boolean — If `true`, the input supports multiple lines. Default: `false`.
- **required**: boolean — If `true`, a required asterisk is shown next to the label.
- **isPreview**: boolean — When `true`, the component renders a non-editable preview view showing the value (uses a placeholder `—` when empty).

Notes & behaviors

- The component uses `placeholderTextColor` from the app's `COLORS` (disabled color) for the placeholder.
- When `maxLength` is provided, a character counter (`current/maxLength`) is displayed under the input.
- When `multiline` is true, the component applies extra styling and sets `numberOfLines` to 4 by default.
- `editable={false}` applies a disabled style to the input.
- `isPreview` renders a read-only view (label + preview value) instead of the `TextInput`.

Examples

Basic editable text input

```jsx
<TextInputField
  fcId="C0001"
  label="Full name"
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
  maxLength={100}
/>
```

Multiline, non-editable preview

```jsx
<TextInputField
  fcId="C0002"
  label="Notes"
  value={notes}
  isPreview={true}
  multiline={true}
/>
```

Type suggestions

- `fcId`: string
- `label`: string
- `placeholder`: string
- `value`: string | number | object | array (depending on usage; treat as string for typical text fields)
- `onChangeText`: (value: any) => void
- `maxLength`: number
- `keyboardType`: string
- `editable`: boolean
- `multiline`: boolean
- `required`: boolean
- `isPreview`: boolean

If you want, I can: add PropTypes, convert this component to TypeScript, or generate a compact story/example for Storybook.