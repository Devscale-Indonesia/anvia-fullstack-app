import { useEffect, useState } from "react";

type ModelInfo = { id: string; label: string; provider: string };
type ModelsResponse = { default: string; models: ModelInfo[] };

const STORAGE_KEY = "anvia:model";

function readStoredModel(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

// The chosen model id (sent to /api/chat as ?model=), remembered across pages and reloads.
export function useModelChoice() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModelState] = useState<string | undefined>(readStoredModel);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((res) => (res.ok ? (res.json() as Promise<ModelsResponse>) : Promise.reject(res.status)))
      .then((data) => {
        if (cancelled) return;
        setModels(data.models);
        setModelState((current) =>
          current && data.models.some((m) => m.id === current) ? current : data.default,
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function setModel(id: string) {
    setModelState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private mode: the choice just lasts for this page.
    }
  }

  return { models, model, setModel };
}

export function ModelPicker({
  models,
  model,
  onChange,
}: {
  models: ModelInfo[];
  model: string | undefined;
  onChange: (id: string) => void;
}) {
  if (models.length === 0) return null;
  return (
    <select
      value={model}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Model"
      className="ml-auto rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-300 outline-none focus:border-zinc-500"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
