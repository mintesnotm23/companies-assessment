import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  applyServerFieldErrors,
  companyFormSchema,
  EMPTY_COMPANY_FORM,
  toCreateBody,
  type CompanyFormValues,
} from "../company-form";
import { useCreateCompany } from "../hooks/use-company-mutations";
import { CompanyFormFields } from "./company-form-fields";
import { FormFooter } from "./form-footer";

export function CreateCompanyForm({ onCreated }: { onCreated: (id: string) => void }) {
  const t = useTranslations("Form");
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: EMPTY_COMPANY_FORM,
  });
  const create = useCreateCompany();

  const submit = form.handleSubmit((values) => {
    create.mutate(toCreateBody(values), {
      onSuccess: (company) => onCreated(company.id),
      onError: (error) => applyServerFieldErrors(error, form.setError),
    });
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <CompanyFormFields form={form} />
      <FormFooter isPending={create.isPending} submitLabel={t("create")} error={create.error} />
    </form>
  );
}
