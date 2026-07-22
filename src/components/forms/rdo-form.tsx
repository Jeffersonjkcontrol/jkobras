"use client";

import { Camera } from "lucide-react";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { paraInputDate } from "@/lib/utils";

const ITENS_PADRAO = [
  "Segurança / EPI",
  "Limpeza e organização",
  "Andamento vs. cronograma",
  "Materiais no canteiro",
  "Equipamentos / ferramentas",
];

export function RDOForm({ action, projetoId }: { action: (formData: FormData) => void; projetoId: string }) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 400)} className="space-y-5">
      <input type="hidden" name="projetoId" value={projetoId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="data">Data *</Label>
          <Input id="data" name="data" type="date" required defaultValue={paraInputDate(new Date())} className="h-11" />
        </div>
        <div>
          <Label htmlFor="clima">Clima</Label>
          <Select id="clima" name="clima" defaultValue="Ensolarado" className="h-11">
            <option>Ensolarado</option>
            <option>Nublado</option>
            <option>Chuvoso</option>
            <option>Impróprio p/ trabalho</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="maoDeObra">Mão de obra presente</Label>
        <Input id="maoDeObra" name="maoDeObra" placeholder="Ex.: 5 pedreiros, 2 ajudantes" className="h-11" />
      </div>

      {/* Checklist da situação — um toque por item */}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Situação no canteiro agora</p>
        <div className="space-y-2">
          {ITENS_PADRAO.map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
              <input type="hidden" name="itemTitulo" value={item} />
              <span className="text-sm text-foreground">{item}</span>
              <Select name="itemStatus" defaultValue="OK" className="h-10 w-40 shrink-0">
                <option value="OK">✅ OK</option>
                <option value="ATENCAO">⚠️ Atenção</option>
                <option value="PROBLEMA">⛔ Problema</option>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="atividades">Atividades executadas</Label>
        <Textarea id="atividades" name="atividades" placeholder="O que foi feito hoje…" />
      </div>
      <div>
        <Label htmlFor="ocorrencias">Ocorrências / observações</Label>
        <Textarea id="ocorrencias" name="ocorrencias" placeholder="Imprevistos, atrasos, visitas…" />
      </div>

      <div>
        <Label htmlFor="foto" className="flex items-center gap-2">
          <Camera className="h-4 w-4" /> Fotos da obra
        </Label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
        />
        <p className="mt-1 text-xs text-muted">No celular, abre a câmera. Pode selecionar várias.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Salvar RDO</Button>
      </div>
    </form>
  );
}
