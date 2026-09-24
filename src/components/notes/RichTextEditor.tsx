import { useEffect, useRef, type ReactNode } from 'react';
import { Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

export function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Only push external content into the DOM once (or when a different note loads) —
  // never on every keystroke, or the cursor would jump to the start.
  useEffect(() => {
    if (ref.current && (isFirstRender.current || document.activeElement !== ref.current)) {
      ref.current.innerHTML = content;
      isFirstRender.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function insertLink() {
    const url = window.prompt('Link URL');
    if (url) exec('createLink', url);
  }

  return (
    <div className="rounded-lg border border-slate/25">
      <div className="flex items-center gap-0.5 border-b border-slate/15 p-1.5">
        <ToolbarButton onClick={() => exec('bold')} label="Bold">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} label="Italic">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', '<h3>')} label="Heading">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('insertUnorderedList')} label="Bulleted list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('insertOrderedList')} label="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} label="Insert link">
          <LinkIcon size={15} />
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        className="prose-notes min-h-[220px] max-h-[50vh] overflow-y-auto px-3.5 py-3 text-[15px] text-ink focus:outline-none [&_a]:text-teal [&_a]:underline [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
      />
    </div>
  );
}

function ToolbarButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-md p-1.5 text-slate hover:bg-slate/10 hover:text-ink"
    >
      {children}
    </button>
  );
}
