import { type RefObject, type ChangeEvent } from "react";
import "./Editor.css";

interface EditorProps {
  editorBg: string;
  renderedHtml: string | null;
  textRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  lineCol: string;
  defaultValue?: string;
}

export function Editor({
  editorBg,
  renderedHtml,
  textRef,
  onChange,

  defaultValue,
}: EditorProps) {
  return (
    <div
      className="fs-editor"
      style={
        {
          backgroundColor: editorBg,
        } as React.CSSProperties
      }
    >
      <div
        className="fs-editor-preview"
        dangerouslySetInnerHTML={{ __html: renderedHtml || "" }}
      />
      <textarea
        id="fs-editor-textarea"
        ref={textRef}
        onChange={onChange}
        spellCheck={false}
        className="fs-editor-textarea"
        defaultValue={defaultValue}
      />
    </div>
  );
}
