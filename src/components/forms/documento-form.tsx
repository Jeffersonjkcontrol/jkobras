"use client";

import { UploadCloud } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { CATEGORIAS_DOCUMENTO, CATEGORIA_DOCUMENTO_LABEL } from "@/lib/documentos";
import { DISCIPLINAS, DISCIPLINA_LABEL } from "@/lib/arquitetura";

export function DocumentoForm({
  action,
  projetoId,
  prancha,
  revisaoSugerida,
  disciplina,
}: {
  action: (formData: FormData) => void;
  projetoId: string;
  /** Preenchido quando é "nova revisão" de uma prancha existente. */
  prancha?: string;
  revisaoSugerida?: string;
  disciplina?: string;
}) {
  const close = useModalClose();
  const novaRevisao = !!prancha;
  return (
    <form action={action} onSubmit={() => setTimeout(close, 400)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />

      {novaRevisao ? (
        <div className="rounded-lg border border-border bg-surface-muted/40 p-3 text-sm">
          <p className="font-medium text-foreground">Nova revisão de:</p>
          <p className="text-muted">{prancha}</p>
          <input type="hidden" name="prancha" value={prancha} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select id="categoria" name="categoria" defaultValue="PLANTA">
              {CATEGORIAS_DOCUMENTO.map((c) => (
                <option key={c} value={c}>{CATEGORIA_DOCUMENTO_LABEL[c]}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="disciplina">Disciplina</Label>
            <Select id="disciplina" name="disciplina" defaultValue={disciplina ?? "ARQUITETONICO"}>
              {DISCIPLINAS.map((d) => (
                <option key={d} value={d}>{DISCIPLINA_LABEL[d]}</option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {novaRevisao && (
        <>
          <input type="hidden" name="categoria" value="PLANTA" />
          <input type="hidden" name="disciplina" value={disciplina ?? "ARQUITETONICO"} />
        </>
      )}

      {!novaRevisao && (
        <div>
          <Label htmlFor="prancha">Prancha (para controle de revisão)</Label>
          <Input id="prancha" name="prancha" placeholder="Ex.: Planta baixa — Térreo" />
          <p className="mt-1 text-xs text-muted">
            Preencha para versionar o desenho. Enviando outro arquivo com a mesma prancha, ele vira a revisão seguinte.
            Deixe vazio para um documento avulso (contrato, licença…).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="revisao">Revisão</Label>
          <Input id="revisao" name="revisao" defaultValue={revisaoSugerida ?? "R00"} placeholder="R00" />
        </div>
        <div>
          <Label htmlFor="nome">Nome (opcional)</Label>
          <Input id="nome" name="nome" placeholder="Se vazio, usa o nome do arquivo" />
        </div>
      </div>

      <div>
        <Label htmlFor="arquivo" className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" /> Arquivo *
        </Label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.webp,.dwg,.dxf,image/*,application/pdf"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
        />
        <p className="mt-1 text-xs text-muted">PDF, imagem (PNG/JPG/WebP), DWG ou DXF · até 25 MB.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
        <Button type="submit">Enviar</Button>
      </div>
    </form>
  );
}
