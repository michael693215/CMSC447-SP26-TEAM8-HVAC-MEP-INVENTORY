import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useState, ReactNode } from 'react';
import { IconType } from "react-icons";

interface ModalProps {
  icon: IconType | string;
  title: string;
  description?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  confirmText?: string;
}

const ModalComponent = ({ 
  icon : Icon, 
  title, 
  description, 
  children, 
  confirmText = "Save Changes" 
}: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const close = () => setIsOpen(false);

  return (
    <>
      {/* Trigger */}
      <button onClick={() => setIsOpen(true)} className="p-2 rounded-full">
        {  typeof Icon === 'string' ? (<p>{ Icon }</p>) : (<Icon className="w-5 h-5 text-gray-500" />) }
      </button>

      <Transition show={isOpen}>
        <Dialog open={ isOpen } onClose={ close } className="relative z-50">
          
          {/* Backdrop */}
          <TransitionChild
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              enter="transition-transform duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
            >
              <DialogPanel className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
                <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                
                {description && (
                  <p className="mt-2 text-sm text-gray-500">{description}</p>
                ) }

                {/* This is where your custom inputs go */}
                <div className="flex flex-col mt-4 gap-4">
                  {typeof children === 'function' ? children(close) : children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ModalComponent;