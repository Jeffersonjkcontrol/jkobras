"use client";

import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";

/** Define o período de teste de um escritório: atalhos em dias ou uma data final. */
export function TrialForm({
  action,
  orgId,
  orgNome,
}: {
  action: (formData: FormData) => void;
  orgId: string;
  orgNome: string;
}) {
  const close = useModalClose();
  const atalhos = [7, 15, 30, 60];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Definindo o teste de <strong className="text-foreground">{orgNome}</strong>. Após a data, o escritório
        perde o acesso (os dados ficam salvos) até você estender ou liberar.
      </p>

      {/* Atalhos: cada botão é um submit com "dias" fixo */}
      <div>
        <Label>Liberar por</Label>
        <div className="flex flex-wrap gap-2">
          {atalhos.map((d) => (
            <form key={d} action={action} onSubmit={() => setTimeout(close, 50)}>
              <input type="hidden" name="id" value={orgId} />
              <input type="hidden" name="dias" value={d} />
              <Button type="submit" variant="outline" size="sm">{d} dias</Button>
            </form>
          ))}
        </div>
      </div>

      {/* Ou uma data específica */}
      <form action={action} onSubmit={() => setTimeout(close, 50)} className="space-y-3 border-t border-border pt-4">
        <input type="hidden" name="id" value={orgId} />
        <div>
          <Label htmlFor="data">Ou até a data</Label>
          <Input id="data" name="data" type="date" required />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
          <Button type="submit">Definir</Button>
        </div>
      </form>
    </div>
  );
}
