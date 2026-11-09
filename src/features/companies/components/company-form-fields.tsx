import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Select } from "@/components/select";
import { COMPANY_STATUSES } from "@/lib/api/schema";
import type { CompanyFormValues } from "../company-form";
import { StatusDot } from "./status-dot";

type Props = {
  form: UseFormReturn<CompanyFormValues>;
  overlaps?: Partial<CompanyFormValues>;
};

const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm aria-invalid:border-red-500";

export function CompanyFormFields({ form, overlaps = {} }: Props) {
  const t = useTranslations();
  const id = useId();
  const { errors } = form.formState;
  const statusOptions = COMPANY_STATUSES.map((status) => ({
    value: status,
    label: t(`Status.${status}`),
    icon: <StatusDot status={status} />,
  }));

  // Client schema can only fail on name; server messages pass through as-is
  const nameError =
    errors.name && (errors.name.type === "server" ? errors.name.message : t("Form.nameRequired"));
  const theirs = (value: string | undefined) =>
    value === undefined ? undefined : t("Conflict.theirValue", { value: value || t("Conflict.empty") });

  return (
    <div className="space-y-4">
      <Field id={`${id}-name`} label={t("Form.name")} error={nameError} overlap={theirs(overlaps.name)}>
        {(describedBy) => (
          <input
            id={`${id}-name`}
            {...form.register("name")}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass}
          />
        )}
      </Field>
      <Field
        id={`${id}-domain`}
        label={t("Form.domain")}
        hint={t("Form.domainHint")}
        error={errors.domain?.message}
        overlap={theirs(overlaps.domain)}
      >
        {(describedBy) => (
          <input
            id={`${id}-domain`}
            {...form.register("domain")}
            aria-invalid={errors.domain ? true : undefined}
            aria-describedby={describedBy}
            className={inputClass}
          />
        )}
      </Field>
      <Field
        id={`${id}-status`}
        label={t("Form.status")}
        error={errors.status?.message}
        overlap={overlaps.status && theirs(t(`Status.${overlaps.status}`))}
      >
        {(describedBy) => (
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select
                id={`${id}-status`}
                ref={field.ref}
                value={field.value}
                options={statusOptions}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={errors.status ? true : undefined}
                aria-describedby={describedBy}
                className="w-full"
              />
            )}
          />
        )}
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  overlap,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  overlap?: string;
  children: (describedBy: string | undefined) => ReactNode;
}) {
  const messages = [hint && `${id}-hint`, overlap && `${id}-overlap`, error && `${id}-error`].filter(Boolean);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children(messages.length > 0 ? messages.join(" ") : undefined)}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {overlap && (
        <p id={`${id}-overlap`} className="text-xs text-amber-700">
          {overlap}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
