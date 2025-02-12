import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState } from "react";

export function Example() {
  let [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Create account</button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="max-w-lg space-y-4 border bg-[#e4d2c3] p-12 rounded-xl">
            <DialogTitle className="font-bold">Create account</DialogTitle>
            <Description>Please enter information below.</Description>
            <div className="flex-col">
              <input className="pl-1 link mb-1" placeholder="Username" />
              <input className="pl-1 link mb-1" placeholder="Password" />
              <input
                className="pl-1 link mb-1"
                placeholder="Confirm Password"
              />
              <input className="pl-1 link" placeholder="Email" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsOpen(false)}>Register</button>
              <button onClick={() => setIsOpen(false)}>Cancel</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
