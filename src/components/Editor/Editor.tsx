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

export function Editor({ editorBg, renderedHtml, textRef, onChange, lineCol, defaultValue }: EditorProps) {
  return (
    <div
      className="fs-editor"
      style={
        {
          backgroundColor: editorBg,
          "--fs-line-col": lineCol,
        } as React.CSSProperties
      }
    >
      <div
        className="fs-editor-preview"
        dangerouslySetInnerHTML={{ __html: renderedHtml || "" }}
      />
      <textarea
        ref={textRef}
        onChange={onChange}
        spellCheck={false}
        className="fs-editor-textarea"
        style={{ paddingLeft: `calc(${lineCol} + 1rem)` }}
        defaultValue={defaultValue}
      />
    </div>
  );
}
