"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Bold } from "lucide-react";

const normalizeInitialValue = (value) => {
  if (!value) return "";

  // If it looks like HTML, keep it.
  if (value.includes("<") && value.includes(">")) return value;

  // Treat as plain text: convert newlines to <br>
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
};

const RichTextEditor = ({ value, onChange, className }) => {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFont, setSelectedFont] = useState("default");

  const normalizedInitial = useMemo(() => normalizeInitialValue(value), [value]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    // Only set HTML if it differs (prevents cursor jumps while typing)
    if (el.innerHTML !== normalizedInitial) {
      el.innerHTML = normalizedInitial;
    }
  }, [normalizedInitial]);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML || "";
    onChange?.(html);
  };

  const applyBold = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    // execCommand is deprecated but still works across browsers for basic formatting.
    document.execCommand("bold");
    emitChange();
  };

  const saveSelectionRange = () => {
    const selection = window.getSelection?.();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

    savedRangeRef.current = range.cloneRange();
  };

  const restoreSelectionRange = () => {
    const selection = window.getSelection?.();
    const savedRange = savedRangeRef.current;
    if (!selection || !savedRange) return false;

    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  };

  const applyFontFamily = (fontFamily) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    editorRef.current.style.fontFamily = fontFamily;

    const selection = window.getSelection?.();
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editorRef.current.contains(range.commonAncestorContainer)) {
      const restored = restoreSelectionRange();
      range = restored && selection?.rangeCount ? selection.getRangeAt(0) : null;
    }

    if (range && selection && editorRef.current.contains(range.commonAncestorContainer)) {
      try {
        // Prefer execCommand for cross-node selections
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("fontName", false, fontFamily);
      } catch {
        // Fallback to manual wrapping
        const span = document.createElement("span");
        span.style.fontFamily = fontFamily;

        const content = range.extractContents();
        span.appendChild(content);
        range.insertNode(span);

        // Move caret to the end of inserted span
        range.setStartAfter(span);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    emitChange();
  };

  const handleFontChange = (value) => {
    setSelectedFont(value);

    if (value === "default") {
      applyFontFamily("inherit");
      return;
    }

    if (value === "serif") {
      applyFontFamily("serif");
      return;
    }

    if (value === "mono") {
      applyFontFamily("monospace");
      return;
    }

    if (value === "system") {
      applyFontFamily("system-ui");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Ensure newline becomes <br>
      e.preventDefault();
      document.execCommand("insertLineBreak");
      emitChange();
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      applyBold();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={selectedFont}
          onValueChange={handleFontChange}
          onOpenChange={(open) => {
            if (open) saveSelectionRange();
          }}
        >
          <SelectTrigger className="w-[180px]" onMouseDown={saveSelectionRange}>
            <SelectValue placeholder="انتخاب فونت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">فونت پیشفرض</SelectItem>
            <SelectItem value="system">فونت سیستم</SelectItem>
            <SelectItem value="serif">سریف</SelectItem>
            <SelectItem value="mono">مونو</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" size="sm" onClick={applyBold}>
          <Bold className="w-4 h-4 ml-2" />
          بولد
        </Button>
        <span className="text-xs text-muted-foreground">میانبر: Ctrl+B</span>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        className={cn(
          "min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isFocused ? "ring-2 ring-ring ring-offset-2" : ""
        )}
        onInput={emitChange}
        onMouseUp={saveSelectionRange}
        onKeyUp={saveSelectionRange}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default RichTextEditor;
