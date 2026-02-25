export interface EditorProps {
  /** Markdown string to initialize or update the editor content */
  content?: string;
  /** Called with Markdown string whenever editor content changes */
  onChange?: (markdown: string) => void;
  /** Whether the editor is editable. Defaults to true */
  editable?: boolean;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Additional CSS class applied to the editor wrapper */
  className?: string;
  /** Whether to focus the editor on mount */
  autofocus?: boolean;
}
