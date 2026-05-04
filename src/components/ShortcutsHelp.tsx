"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Keyboard } from "lucide-react";

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  useHotkeys("?", () => setOpen(true));

  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Open search" },
    { keys: ["Ctrl", "S"], description: "Submit form" },
    { keys: ["Ctrl", "N"], description: "New event (wizard)" },
    { keys: ["Ctrl", "Z"], description: "Undo last action" },
    { keys: ["Ctrl", "Y"], description: "Redo" },
    { keys: ["?"], description: "Show this help" },
    { keys: ["Esc"], description: "Cancel / close modal" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate faster and be more productive.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {shortcuts.map((sc) => (
              <div key={sc.keys.join("+")} className="flex justify-between items-center">
                <div className="flex gap-1">
                  {sc.keys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-mono text-gray-300 shadow-sm"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
                <span className="text-sm text-gray-400">{sc.description}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500 text-center">
            Shortcuts work when the modal is closed. Press ? anytime to reopen.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}