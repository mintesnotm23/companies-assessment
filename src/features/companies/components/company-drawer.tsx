import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { companyOptions } from "@/lib/api/companies.queries";
import { isApiError } from "@/lib/api/http";
import { NEW_COMPANY } from "../list-params";
import { CreateCompanyForm } from "./create-company-form";
import { EditCompanyForm } from "./edit-company-form";

type Props = {
  companyParam: string | null;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function CompanyDrawer({ companyParam, onClose, onCreated }: Props) {
  const t = useTranslations();
  const isCreate = companyParam === NEW_COMPANY;

  return (
    <Dialog.Root open={companyParam !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col gap-5 overflow-y-auto bg-white p-6 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold">
              {isCreate ? t("Drawer.createTitle") : t("Drawer.editTitle")}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t("Common.close")}
              className="rounded-md px-2 text-xl leading-none text-gray-500 hover:text-gray-900"
            >
              <span aria-hidden="true">×</span>
            </Dialog.Close>
          </div>
          {companyParam !== null &&
            (isCreate ? (
              <CreateCompanyForm onCreated={onCreated} />
            ) : (
              <CompanyDetail key={companyParam} id={companyParam} />
            ))}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CompanyDetail({ id }: { id: string }) {
  const t = useTranslations();
  const query = useQuery(companyOptions(id));

  // Data first: a failed background refetch must not unmount a form mid-edit
  if (query.data) return <EditCompanyForm company={query.data} />;

  if (query.isError) {
    if (isApiError(query.error, 404)) return <p role="alert">{t("Drawer.notFound")}</p>;
    return (
      <div role="alert" className="space-y-2">
        <p>{t("Drawer.loadError")}</p>
        <button type="button" onClick={() => void query.refetch()} className="text-sm font-medium underline">
          {t("Common.retry")}
        </button>
      </div>
    );
  }

  return <p role="status">{t("Drawer.loading")}</p>;
}
