import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { companyOptions } from "@/lib/api/companies.queries";
import { isApiError } from "@/lib/api/http";
import type { Company } from "@/lib/api/schema";
import {
  applyServerFieldErrors,
  companyFormSchema,
  rebaseDraft,
  toFormValues,
  toUpdateBody,
  type CompanyFormValues,
} from "../company-form";
import { useUpdateCompany } from "../hooks/use-company-mutations";
import { CompanyFormFields } from "./company-form-fields";
import { ConflictNotice } from "./conflict-notice";
import { FormFooter } from "./form-footer";

type Rebase = { version: number; overlaps: Partial<CompanyFormValues> };

export function EditCompanyForm({ company }: { company: Company }) {
  const t = useTranslations();
  const format = useFormatter();
  const queryClient = useQueryClient();
  // Snapshot, not live cache: the PATCH must carry the version the user actually edited
  const [base, setBase] = useState(company);
  const [rebase, setRebase] = useState<Rebase | null>(null);
  const [reloadState, setReloadState] = useState<"idle" | "loading" | "error">("idle");
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: toFormValues(company),
  });
  const update = useUpdateCompany(company.id);

  const submit = form.handleSubmit((values) => {
    update.mutate(toUpdateBody(values, toFormValues(base), base.version), {
      onSuccess: (updated) => {
        setBase(updated);
        setRebase(null);
        form.reset(toFormValues(updated));
      },
      onError: (error) => applyServerFieldErrors(error, form.setError),
    });
  });

  async function loadLatest() {
    setReloadState("loading");
    try {
      const latest = await queryClient.fetchQuery({ ...companyOptions(company.id), staleTime: 0 });
      const { values, overlaps } = rebaseDraft(form.getValues(), toFormValues(base), toFormValues(latest));
      // Server copy becomes the baseline; the user's edits stay on top as dirty values
      form.reset(toFormValues(latest));
      form.reset(values, { keepDefaultValues: true });
      setBase(latest);
      setRebase({ version: latest.version, overlaps });
      setReloadState("idle");
      update.reset();
      form.setFocus("name");
    } catch {
      setReloadState("error");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-xs text-gray-500">
        {t("Drawer.meta", {
          version: base.version,
          updatedAt: format.dateTime(new Date(base.updated_at), { dateStyle: "medium", timeStyle: "short" }),
        })}
      </p>
      {isApiError(update.error, 409) && <ConflictNotice reloadState={reloadState} onReload={loadLatest} />}
      {rebase && (
        <p role="status" className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
          {t("Conflict.rebased", { version: rebase.version })}
        </p>
      )}
      <CompanyFormFields form={form} overlaps={rebase?.overlaps} />
      <FormFooter
        isPending={update.isPending}
        submitDisabled={!form.formState.isDirty}
        submitLabel={t("Form.save")}
        successMessage={update.isSuccess ? t("Form.saved") : undefined}
        error={update.error}
      />
    </form>
  );
}
