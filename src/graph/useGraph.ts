import { useCallback, useMemo, useState } from "react";
import { addEdge, useEdgesState, useNodesState } from "reactflow";
import type { Edge, Node, NodeChange } from "reactflow";
import type { AnyNodeData, NodeKind, SmartContractData, WebsiteData } from "../types";

/* -------------------- id counter -------------------- */
let __id = 0;
export const uid = (p: string) => `${p}_${Date.now()}_${__id++}`;
export const getIdCounter = () => __id;
export const resetIdCounter = (n: number) => { __id = n; };

/* -------------------- pure helpers -------------------- */
export function normKey(s: string) {
  return s.trim().toLowerCase();
}

export function isTrigger(kind: NodeKind) {
  return kind === "trigger.cron" || kind === "trigger.evmLog" || kind === "trigger.http";
}

export function isCapability(kind: NodeKind) {
  return (
    kind === "cap.http.get" ||
    kind === "cap.http.post" ||
    kind === "cap.evmRead" ||
    kind === "cap.evmWrite" ||
    kind === "cap.localExecution"
  );
}

/* -------------------- hook -------------------- */
export function useGraph() {
  const [nodes, setNodes, rfOnNodesChange] = useNodesState<AnyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      rfOnNodesChange(changes);
      const sel = changes.find((c) => (c as any).type === "select" && (c as any).selected);
      if (sel) {
        setSelectedId((sel as any).id);
        return;
      }
      if (changes.some((c) => (c as any).type === "select" && (c as any).selected === false)) {
        setSelectedId(null);
      }
    },
    [rfOnNodesChange]
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  /* ----- reference-node maps ----- */
  const smartContractByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      if (n.data.kind === "smartContract") {
        map.set(normKey((n.data as SmartContractData).contractName), n.id);
      }
    }
    return map;
  }, [nodes]);

  const websiteByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      if (n.data.kind === "website") {
        map.set(normKey((n.data as WebsiteData).websiteName), n.id);
      }
    }
    return map;
  }, [nodes]);

  /* ----- edge factories ----- */
  function makeCallbackEdge(source: string, target: string): Edge {
    return {
      id: uid("e"),
      source,
      target,
      type: "smoothstep",
      data: { kind: "callback" },
      className: "edge edge--callback",
    };
  }

  function makeRefEdge(source: string, target: string): Edge {
    return {
      id: uid("e"),
      source,
      target,
      sourceHandle: "refSource",
      targetHandle: "refTarget",
      type: "straight",
      data: { kind: "ref" },
      className: "edge edge--ref",
    };
  }

  /* ----- edge predicates ----- */
  function isCallbackEdge(e: Edge) {
    return ((e.data as any)?.kind ?? "callback") === "callback";
  }

  function isRefEdge(e: Edge) {
    return ((e.data as any)?.kind ?? "callback") === "ref";
  }

  /* ----- graph traversal ----- */
  function incomingCallbackEdge(nodeId: string) {
    return edges.find((e) => e.target === nodeId && isCallbackEdge(e));
  }

  function findChainTail(startId: string) {
    let cur = startId;
    const visited = new Set<string>();
    while (true) {
      if (visited.has(cur)) return cur;
      visited.add(cur);
      const out = edges.find((e) => e.source === cur && isCallbackEdge(e));
      if (!out) return cur;
      cur = out.target;
    }
  }

  function findRootTrigger(nodeId: string) {
    let cur = nodeId;
    const visited = new Set<string>();
    while (true) {
      if (visited.has(cur)) return cur;
      visited.add(cur);
      const inc = incomingCallbackEdge(cur);
      if (!inc) return cur;
      cur = inc.source;
    }
  }

  /* ----- layout sync ----- */
  function tidyRefsUnderTail(anyNodeInChainId: string) {
    const root = findRootTrigger(anyNodeInChainId);
    const tail = findChainTail(root);
    const tailNode = nodes.find((n) => n.id === tail);
    if (!tailNode) return;

    const chainNodes = new Set<string>();
    {
      let cur = root;
      const visited = new Set<string>();
      while (true) {
        if (visited.has(cur)) break;
        visited.add(cur);
        chainNodes.add(cur);
        const out = edges.find((e) => e.source === cur && isCallbackEdge(e));
        if (!out) break;
        cur = out.target;
      }
    }

    const refEdges = edges.filter((e) => isRefEdge(e) && chainNodes.has(e.source));
    if (refEdges.length === 0) return;

    const refTargetIds = Array.from(new Set(refEdges.map((e) => e.target)));

    setNodes((prev) =>
      prev.map((n) => {
        const idx = refTargetIds.indexOf(n.id);
        if (idx === -1) return n;
        return {
          ...n,
          position: {
            x: tailNode.position.x,
            y: tailNode.position.y + 210 + idx * 190,
          },
        };
      })
    );

    setEdges((prev) =>
      prev.map((e) => {
        if (!isRefEdge(e)) return e;
        if (!chainNodes.has(e.source)) return e;
        return { ...e, source: tail, sourceHandle: "refSource", targetHandle: "refTarget" };
      })
    );
  }

  /* ----- node builders ----- */
  function ensureSmartContract(contractName: string, addEvent?: string, addFn?: string) {
    const key = normKey(contractName);
    const existingId = smartContractByName.get(key);

    if (existingId) {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== existingId) return n;
          const d = n.data as SmartContractData;
          const events = addEvent?.trim()
            ? Array.from(new Set([...d.events, addEvent.trim()]))
            : d.events;
          const functions = addFn?.trim()
            ? Array.from(new Set([...d.functions, addFn.trim()]))
            : d.functions;
          return { ...n, data: { ...d, name: d.name || contractName, contractName, events, functions } };
        })
      );
      return existingId;
    }

    const id = uid("sc");
    const scNode: Node<AnyNodeData> = {
      id,
      type: "appNode",
      position: { x: 80, y: 380 + nodes.length * 10 },
      data: {
        kind: "smartContract",
        name: contractName,
        description: "Smart Contract reference",
        contractName,
        events: addEvent?.trim() ? [addEvent.trim()] : [],
        functions: addFn?.trim() ? [addFn.trim()] : [],
      },
    };
    setNodes((prev) => [...prev, scNode]);
    return id;
  }

  function ensureWebsite(websiteName: string, apiUrl?: string) {
    const key = normKey(websiteName);
    const existingId = websiteByName.get(key);

    if (existingId) {
      if (apiUrl?.trim()) {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== existingId) return n;
            const d = n.data as WebsiteData;
            return {
              ...n,
              data: {
                ...d,
                name: d.name || websiteName,
                websiteName,
                apiUrls: Array.from(new Set([...d.apiUrls, apiUrl.trim()])),
              },
            };
          })
        );
      }
      return existingId;
    }

    const id = uid("web");
    const webNode: Node<AnyNodeData> = {
      id,
      type: "appNode",
      position: { x: 80, y: 560 + nodes.length * 10 },
      data: {
        kind: "website",
        name: websiteName,
        description: "Website API reference",
        websiteName,
        apiUrls: apiUrl?.trim() ? [apiUrl.trim()] : [],
      },
    };
    setNodes((prev) => [...prev, webNode]);
    return id;
  }

  function createTriggerNode(
    _kind: "trigger.cron" | "trigger.evmLog" | "trigger.http",
    data: AnyNodeData
  ) {
    const id = uid("trg");
    const triggerCount = nodes.filter((n) => isTrigger(n.data.kind)).length;
    const node: Node<AnyNodeData> = {
      id,
      type: "appNode",
      position: { x: 40, y: 40 + triggerCount * 180 },
      data,
    };
    setNodes((prev) => [...prev, node]);
    setSelectedId(id);
    return node;
  }

  function appendCapability(afterId: string, capNode: Node<AnyNodeData>) {
    setNodes((prev) => [...prev, capNode]);
    setEdges((prev) => [...prev, makeCallbackEdge(afterId, capNode.id)]);
    setSelectedId(capNode.id);
  }

  function getAttachPoint() {
    if (selectedNode && (isTrigger(selectedNode.data.kind) || isCapability(selectedNode.data.kind))) {
      return findChainTail(selectedNode.id);
    }
    const triggers = nodes.filter((n) => isTrigger(n.data.kind));
    if (triggers.length === 1) return findChainTail(triggers[0].id);
    return null;
  }

  function getNodeById(id: string) {
    return nodes.find((n) => n.id === id) ?? null;
  }

  function placeRightOf(sourceId: string, dx = 280, dy = 0) {
    const src = getNodeById(sourceId);
    if (!src) return { x: 760, y: 160 };
    return { x: src.position.x + dx, y: src.position.y + dy };
  }

  function patchSelected(patch: Partial<AnyNodeData>) {
    if (!selectedNode) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedNode.id) return n;
        return { ...n, data: { ...(n.data as any), ...(patch as any) } };
      })
    );
  }

  function deleteNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    setSelectedId(null);
  }

  return {
    nodes,
    edges,
    selectedId,
    selectedNode,
    setNodes,
    setEdges,
    setSelectedId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    smartContractByName,
    websiteByName,
    ensureSmartContract,
    ensureWebsite,
    createTriggerNode,
    appendCapability,
    getAttachPoint,
    placeRightOf,
    makeRefEdge,
    tidyRefsUnderTail,
    patchSelected,
    deleteNode,
  };
}
