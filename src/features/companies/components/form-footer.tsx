import { useTranslations } from "next-intl";
import { isApiError } from "@/lib/api/http";
import { splitServerErrors } from "../company-form";

type Props = {
  isPending: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  successMessage?: string;
  error: Error | null;
};

export function FormFooter({ isPending, submitDisabled = false, submitLabel, successMessage, error }: Props) {
  const t = useTranslations("Form");

  // 409 has its own notice, 401 redirects, field-level 422s render next to fields
  function errorMessages(): string[] {
    if (!error || isApiError(error, 409) || isApiError(error, 401)) return [];
    if (!isApiError(error, 422)) return [t("failed")];
    const { otherErrors } = splitServerErrors(error);
    return otherErrors.length > 0 ? [t("rejected"), ...otherErrors] : [];
  }
  const messages = errorMessages();

  return (
    <div className="space-y-3">
      {messages.length > 0 && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
      <p role="status" className="text-sm text-green-700">
        {successMessage}
      </p>
      <button
        type="submit"
        disabled={isPending || submitDisabled}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? t("saving") : submitLabel}
      </button>
    </div>
  );
}
