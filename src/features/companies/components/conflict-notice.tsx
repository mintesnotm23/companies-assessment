import { useTranslations } from "next-intl";

type Props = {
  reloadState: "idle" | "loading" | "error";
  onReload: () => void;
};

export function ConflictNotice({ reloadState, onReload }: Props) {
  const t = useTranslations("Conflict");

  return (
    <div role="alert" className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="font-medium">{t("title")}</p>
      <p>{t("description")}</p>
      {reloadState === "error" && <p className="text-red-700">{t("reloadFailed")}</p>}
      <button
        type="button"
        onClick={onReload}
        disabled={reloadState === "loading"}
        className="rounded-md bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {reloadState === "loading" ? t("reloading") : t("reload")}
      </button>
    </div>
  );
}
