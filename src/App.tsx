import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node } from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

import type { AnyNodeData, CronScheduleType, CronIntervalUnit, EvmBlockSelection, Workflow, WorkflowExportV1 } from "./types";
import { buildCronExpression } from "./utils/cronUtils";
import { AppNode } from "./nodes/AppNode";
import { useGraph, isTrigger, uid, getIdCounter, resetIdCounter } from "./graph/useGraph";
import { safeJsonParse, downloadText, validateAndNormalizeImport } from "./io/workflowIO";
import { Header } from "./components/Header";
import { LeftPanel } from "./components/LeftPanel";
import { ModalsPanel } from "./components/ModalsPanel";
import { ExportModal } from "./components/ExportModal";

import type { ModalType } from "./components/LeftPanel";

const NODE_TYPES = { appNode: AppNode };

export default function App() {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: "",
    description: "",
    created: false,
  });
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);


  /* -------------------- theme -------------------- */
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("cre-theme") as "dark" | "light") ?? "dark"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cre-theme", theme);
  }, [theme]);
  function toggleTheme() { setTheme((t) => (t === "dark" ? "light" : "dark")); }

  const {
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
  } = useGraph();

  /* -------------------- import / export -------------------- */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ioError, setIoError] = useState("");

  function exportWorkflowJson() {
    setIoError("");
    const payload: WorkflowExportV1 = {
      version: 1,
      workflow,
      nodes,
      edges,
      selectedId,
      idCounter: getIdCounter(),
    };
    const safeName = (workflow.name || "workflow").trim().replace(/[^\w.-]+/g, "_");
    downloadText(`CRE-${safeName}.json`, JSON.stringify(payload, null, 2));
  }

  function importWorkflowJsonText(raw: string) {
    setIoError("");
    const parsed = safeJsonParse<any>(raw);
    if (!parsed.ok) { setIoError(parsed.error); return; }
    const v = validateAndNormalizeImport(parsed.value);
    if (!v.ok) { setIoError(v.error); return; }
    setWorkflow(v.value.workflow);
    setNodes(v.value.nodes);
    setEdges(v.value.edges);
    setSelectedId(v.value.selectedId);
    resetIdCounter(v.value.idCounter || 0);
  }

  function onImportFilePicked(file: File | null) {
    if (!file) return;
    setIoError("");
    const reader = new FileReader();
    reader.onload = () => {
      importWorkflowJsonText(String(reader.result ?? ""));
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => setIoError("Failed to read file.");
    reader.readAsText(file);
  }

  /* -------------------- modal state -------------------- */
  const [modal, setModal] = useState<{ type: ModalType; initialData?: Record<string, any> } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  function openModal(type: ModalType, initialData?: Record<string, any>) {
    setForm({});
    setModal({ type, initialData });
  }
  function closeModal() { setModal(null); setForm({}); }
  function up(k: string, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  /* -------------------- modal submit -------------------- */
  function submitModal() {
    if (!modal) return;

    if (modal.type === "trigger.cron") {
      const name = String(form.name ?? "").trim();
      if (!name) return;
      const scheduleType = (form.scheduleType as CronScheduleType) || "interval";
      const intervalUnit = (form.intervalUnit as CronIntervalUnit) || "minutes";
      const intervalValue = Number.isFinite(Number(form.intervalValue)) && Number(form.intervalValue) > 0
        ? Number(form.intervalValue) : 5;
      const atHour = Number(form.atHour ?? 9);
      const atMinute = Number(form.atMinute ?? 0);
      const daysOfWeek: number[] = Array.isArray(form.daysOfWeek) ? form.daysOfWeek : [1];
      const dayOfMonth = Number(form.dayOfMonth ?? 1);
      const timezone = String(form.timezone ?? "UTC");
      const cronExpression = String(form.cronExpression ?? buildCronExpression({
        scheduleType, intervalValue, intervalUnit, atHour, atMinute, daysOfWeek, dayOfMonth, timezone,
      }));
      createTriggerNode("trigger.cron", {
        kind: "trigger.cron",
        name,
        description: String(form.description ?? "").trim(),
        scheduleType,
        intervalValue,
        intervalUnit,
        atHour,
        atMinute,
        daysOfWeek,
        dayOfMonth,
        timezone,
        cronExpression,
      });
      closeModal();
      return;
    }

    if (modal.type === "edit.trigger.cron") {
      const name = String(form.name ?? "").trim();
      if (!name) return;
      const scheduleType = (form.scheduleType as CronScheduleType) || "interval";
      const intervalUnit = (form.intervalUnit as CronIntervalUnit) || "minutes";
      const intervalValue = Number.isFinite(Number(form.intervalValue)) && Number(form.intervalValue) > 0
        ? Number(form.intervalValue) : 5;
      const atHour = Number(form.atHour ?? 9);
      const atMinute = Number(form.atMinute ?? 0);
      const daysOfWeek: number[] = Array.isArray(form.daysOfWeek) ? form.daysOfWeek : [1];
      const dayOfMonth = Number(form.dayOfMonth ?? 1);
      const timezone = String(form.timezone ?? "UTC");
      const cronExpression = String(form.cronExpression ?? buildCronExpression({
        scheduleType, intervalValue, intervalUnit, atHour, atMinute, daysOfWeek, dayOfMonth, timezone,
      }));
      patchSelected({
        name,
        description: String(form.description ?? "").trim(),
        scheduleType,
        intervalValue,
        intervalUnit,
        atHour,
        atMinute,
        daysOfWeek,
        dayOfMonth,
        timezone,
        cronExpression,
      } as any);
      closeModal();
      return;
    }

    if (modal.type === "trigger.evmLog") {
      const smartContractName = String(form.smartContractName ?? "").trim();
      const eventName = String(form.eventName ?? "").trim();
      const chainSelector = String(form.chainSelector ?? "").trim();
      const contractAddress = form.contractAddress ? String(form.contractAddress).trim() : undefined;
      const confidenceLevel = (form.confidenceLevel as any) || "";
      if (!smartContractName || !eventName || !chainSelector || !confidenceLevel) return;
      const confirmationBlocks = confidenceLevel === "Custom" ? Number(form.confirmationBlocks ?? 1) : undefined;
      const scId = ensureSmartContract(smartContractName, eventName, undefined);
      const trigNode = createTriggerNode("trigger.evmLog", {
        kind: "trigger.evmLog",
        name: eventName,
        description: String(form.description ?? "").trim(),
        smartContractName,
        eventName,
        contractAddress,
        chainSelector,
        confidenceLevel,
        confirmationBlocks,
      });
      const scPos = { x: trigNode.position.x, y: trigNode.position.y + 150 };
      setNodes((prev) => prev.map((n) => (n.id === scId ? { ...n, position: scPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(trigNode.id, scId)]);
      tidyRefsUnderTail(trigNode.id);
      closeModal();
      return;
    }

    if (modal.type === "trigger.http") {
      const websiteName = String(form.websiteName ?? "").trim();
      const apiUrl = String(form.apiUrl ?? "").trim();
      if (!websiteName) return;
      const authorizedKeys: string[] = Array.isArray(form.authorizedKeys) ? form.authorizedKeys : [];
      const webId = ensureWebsite(websiteName, apiUrl || undefined);
      const trigNode = createTriggerNode("trigger.http", {
        kind: "trigger.http",
        name: websiteName,
        description: String(form.description ?? "").trim(),
        websiteName,
        apiUrl,
        authorizedKeys,
      });
      const webPos = { x: trigNode.position.x, y: trigNode.position.y + 150 };
      setNodes((prev) => prev.map((n) => (n.id === webId ? { ...n, position: webPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(trigNode.id, webId)]);
      tidyRefsUnderTail(trigNode.id);
      closeModal();
      return;
    }

    if (modal.type === "cap.http.get" || modal.type === "cap.http.post") {
      const attach = getAttachPoint();
      if (!attach) return;
      const websiteName = String(form.websiteName ?? "").trim();
      const apiUrl = String(form.apiUrl ?? "").trim();
      if (!websiteName || !apiUrl) return;
      const webId = ensureWebsite(websiteName, apiUrl);
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const isPost = modal.type === "cap.http.post";
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: isPost
          ? {
              kind: "cap.http.post",
              name: websiteName,
              description: String(form.description ?? "").trim(),
              websiteName,
              apiUrl,
              cacheEnabled: Boolean(form.cacheEnabled),
              cacheMaxAgeMs: form.cacheEnabled ? Number(form.cacheMaxAgeMs ?? 60000) : undefined,
            }
          : {
              kind: "cap.http.get",
              name: websiteName,
              description: String(form.description ?? "").trim(),
              websiteName,
              apiUrl,
            },
      };
      appendCapability(attach, capNode);
      const webPos = { x: pos.x, y: pos.y + 150 };
      setNodes((prev) => prev.map((n) => (n.id === webId ? { ...n, position: webPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(capNode.id, webId)]);
      tidyRefsUnderTail(capNode.id);
      closeModal();
      return;
    }

    if (modal.type === "cap.evmRead") {
      const attach = getAttachPoint();
      if (!attach) return;
      const smartContractName = String(form.smartContractName ?? "").trim();
      const functionName = String(form.functionName ?? "").trim();
      const chainSelector = String(form.chainSelector ?? "").trim();
      const blockSelection = (form.blockSelection as EvmBlockSelection) || "";
      if (!smartContractName || !functionName || !chainSelector || !blockSelection) return;
      const contractAddress = form.contractAddress ? String(form.contractAddress).trim() : undefined;
      const customBlockDepth = blockSelection === "Custom" ? Number(form.customBlockDepth ?? 1) : undefined;
      const scId = ensureSmartContract(smartContractName, undefined, functionName);
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: {
          kind: "cap.evmRead",
          name: functionName,
          description: String(form.description ?? "").trim(),
          smartContractName,
          functionName,
          contractAddress,
          chainSelector,
          blockSelection,
          customBlockDepth,
        },
      };
      appendCapability(attach, capNode);
      const scPos = { x: pos.x, y: pos.y + 280 };
      setNodes((prev) => prev.map((n) => (n.id === scId ? { ...n, position: scPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(capNode.id, scId)]);
      tidyRefsUnderTail(capNode.id);
      closeModal();
      return;
    }

    if (modal.type === "cap.evmWrite") {
      const attach = getAttachPoint();
      if (!attach) return;
      const smartContractName = String(form.smartContractName ?? "").trim();
      const functionName = String(form.functionName ?? "").trim();
      const chainSelector = String(form.chainSelector ?? "").trim();
      if (!smartContractName || !functionName || !chainSelector) return;
      const contractAddress = form.contractAddress ? String(form.contractAddress).trim() : undefined;
      const scId = ensureSmartContract(smartContractName, undefined, functionName);
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: {
          kind: "cap.evmWrite",
          name: functionName,
          description: String(form.description ?? "").trim(),
          smartContractName,
          functionName,
          contractAddress,
          chainSelector,
        },
      };
      appendCapability(attach, capNode);
      const scPos = { x: pos.x, y: pos.y + 280 };
      setNodes((prev) => prev.map((n) => (n.id === scId ? { ...n, position: scPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(capNode.id, scId)]);
      tidyRefsUnderTail(capNode.id);
      closeModal();
      return;
    }

    if (modal.type === "cap.localExecution") {
      const attach = getAttachPoint();
      if (!attach) return;
      const name = String(form.name ?? "").trim();
      if (!name) return;
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: {
          kind: "cap.localExecution",
          name,
          description: String(form.description ?? "").trim(),
          logic: String(form.logic ?? "").trim(),
        },
      };
      appendCapability(attach, capNode);
      closeModal();
      return;
    }
  }

  /* -------------------- derived -------------------- */
  const triggers = useMemo(() => nodes.filter((n) => isTrigger(n.data.kind)), [nodes]);
  const canAddCaps = workflow.created && (Boolean(getAttachPoint()) || triggers.length === 1);

  const canDelete = useMemo(() => {
    if (!selectedNode) return false;
    return !edges.some((e) => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, edges]);

  /* -------------------- render -------------------- */
  return (
    <div className="app">
      <Header
        workflow={workflow}
        setWorkflow={setWorkflow}
        onExport={exportWorkflowJson}
        onExportTs={workflow.created ? () => setShowExport(true) : undefined}

        onImportClick={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        onImportFilePicked={onImportFilePicked}
        ioError={ioError}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {showExport && (
        <ExportModal
          workflowName={workflow.name}
          workflowDescription={workflow.description}
          nodes={nodes}
          edges={edges}
          onClose={() => setShowExport(false)}
        />
      )}



      <div className="body">
        <LeftPanel
          workflowCreated={workflow.created}
          canAddCaps={canAddCaps}
          isOpen={isLeftOpen}
          setIsOpen={setIsLeftOpen}
          openModal={openModal}
          selectedNode={selectedNode}
          patchSelected={patchSelected}
          canDelete={canDelete}
          onDelete={() => selectedNode && deleteNode(selectedNode.id)}
          nodes={nodes}
          edges={edges}
          onUnlinkEdge={(edgeId) => setEdges((prev) => prev.filter((e) => e.id !== edgeId))}
        />

        <main className={isLeftOpen ? "flow flow--withLeft" : "flow flow--full"}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </main>
      </div>

      <ModalsPanel
        modal={modal}
        up={up}
        submitModal={submitModal}
        closeModal={closeModal}
      />
    </div>
  );
}
