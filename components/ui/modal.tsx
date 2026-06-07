"use client"

import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Subtle backdrop — just enough to focus the modal */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />

      {/* Modal — wider for readability, max height with scroll */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl" style={{ maxHeight: "88vh" }}>
        {/* Header — always visible, X button is the only way to close */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white/80"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
