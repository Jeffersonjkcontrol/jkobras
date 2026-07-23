"use client";

import { UploadCloud } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModalClose } from "@/components/ui/modal";
import { CATEGORIAS_DOCUMENTO, CATEGORIA_DOCUMENTO_LABEL } from "@/lib/documentos";

export function DocumentoForm({ action, projetoId }: { action: (formData: FormData) => void; projetoId: string }) {
  const close = useModalClose();
  return (
    <form action={action} onSubmit={() => setTimeout(close, 400)} className="space-y-4">
      <input type="hidden" name="projetoId" value={projetoId} />

      <div>
        <Label htmlFor="categoria">Categoria</Label>
        <Select id="categoria" name="categoria" defaultValue="PLANTA">
          {CATEGORIAS_DOCUMENTO.map((c) => (
            <option key={c} value={c}>{CATEGORIA_DOCUMENTO_LABEL[c]}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="nome">Nome (opcional)</Label>
        <Input id="nome" name="nome" placeholder="Ex.: Planta baixa — pavimento térreo" />
        <p className="mt-1 text-xs text-muted">Se vazio, usa o nome do arquivo.</p>
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
