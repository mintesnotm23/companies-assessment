import * as RadixSelect from "@radix-ui/react-select";
import type { ReactNode, Ref } from "react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  id: string;
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
  onBlur?: () => void;
  ref?: Ref<HTMLButtonElement>;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

export function Select<T extends string>({
  id,
  value,
  options,
  onValueChange,
  onBlur,
  ref,
  className,
  ...aria
}: Props<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <RadixSelect.Root
      value={value}
      onValueChange={(next) => {
        // Radix yields a plain string; narrow via options, no cast
        const option = options.find((candidate) => candidate.value === next);
        if (option) onValueChange(option.value);
      }}
    >
      <RadixSelect.Trigger
        id={id}
        ref={ref}
        onBlur={onBlur}
        {...aria}
        className={`group inline-flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-xs transition-colors hover:border-gray-400 aria-invalid:border-red-500 data-[state=open]:border-gray-900 ${className ?? ""}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <RadixSelect.Value>
            <span className="truncate">{selected?.label}</span>
          </RadixSelect.Value>
        </span>
        <RadixSelect.Icon className="text-gray-500 transition-transform group-data-[state=open]:rotate-180">
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg motion-safe:animate-[select-in_120ms_ease-out]"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none data-highlighted:bg-gray-100 data-[state=checked]:font-medium"
              >
                {option.icon}
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2.5 text-gray-900">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
