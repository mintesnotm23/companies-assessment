import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCompany, updateCompany } from "@/lib/api/companies";
import { companyKeys } from "@/lib/api/companies.queries";
import { isApiError } from "@/lib/api/http";
import type { CreateCompanyBody, UpdateCompanyBody } from "@/lib/api/schema";

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCompanyBody) => createCompany(body),
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.detail(company.id), company);
      void queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCompanyBody) => updateCompany(id, body),
    onSuccess: (company) => {
      queryClient.setQueryData(companyKeys.detail(id), company);
      void queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error) => {
      // Our cached copy is provably stale; open forms keep their own snapshot
      if (isApiError(error, 409)) void queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}
