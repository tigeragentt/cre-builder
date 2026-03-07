import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import type { Node } from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

import type { AnyNodeData, CronScheduleType, CronIntervalUnit, Workflow, WorkflowExportV1 } from "./types";
import { buildCronExpression } from "./utils/cronUtils";
import { AppNode } from "./nodes/AppNode";
import { useGraph, isTrigger, uid, getIdCounter, resetIdCounter } from "./graph/useGraph";
import { safeJsonParse, downloadText, validateAndNormalizeImport } from "./io/workflowIO";
import { Header } from "./components/Header";
import { LeftPanel } from "./components/LeftPanel";
import { ModalsPanel } from "./components/ModalsPanel";
import type { ModalType } from "./components/LeftPanel";

const NODE_TYPES = { appNode: AppNode };

export default function App() {
  const [workflow, setWorkflow] = useState<Workflow>({
    name: "",
    description: "",
    created: false,
  });
  const [isLeftOpen, setIsLeftOpen] = useState(true);

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
    downloadText(`${safeName}.json`, JSON.stringify(payload, null, 2));
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
      if (!smartContractName || !eventName) return;
      const scId = ensureSmartContract(smartContractName, eventName, undefined);
      const trigNode = createTriggerNode("trigger.evmLog", {
        kind: "trigger.evmLog",
        name: eventName,
        description: String(form.description ?? "").trim(),
        smartContractName,
        eventName,
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
      if (!websiteName || !apiUrl) return;
      const webId = ensureWebsite(websiteName, apiUrl);
      const trigNode = createTriggerNode("trigger.http", {
        kind: "trigger.http",
        name: websiteName,
        description: String(form.description ?? "").trim(),
        websiteName,
        apiUrl,
      });
      const webPos = { x: trigNode.position.x, y: trigNode.position.y + 150 };
      setNodes((prev) => prev.map((n) => (n.id === webId ? { ...n, position: webPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(trigNode.id, webId)]);
      tidyRefsUnderTail(trigNode.id);
      closeModal();
      return;
    }

    if (modal.type === "cap.http") {
      const attach = getAttachPoint();
      if (!attach) return;
      const websiteName = String(form.websiteName ?? "").trim();
      const apiUrl = String(form.apiUrl ?? "").trim();
      if (!websiteName || !apiUrl) return;
      const webId = ensureWebsite(websiteName, apiUrl);
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: {
          kind: "cap.http",
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

    if (modal.type === "cap.evmRead" || modal.type === "cap.evmWrite") {
      const attach = getAttachPoint();
      if (!attach) return;
      const smartContractName = String(form.smartContractName ?? "").trim();
      const functionName = String(form.functionName ?? "").trim();
      if (!smartContractName || !functionName) return;
      const scId = ensureSmartContract(smartContractName, undefined, functionName);
      const id = uid("cap");
      const pos = placeRightOf(attach, 300, 0);
      const capNode: Node<AnyNodeData> = {
        id,
        type: "appNode",
        position: pos,
        data: {
          kind: modal.type,
          name: functionName,
          description: String(form.description ?? "").trim(),
          smartContractName,
          functionName,
        } as AnyNodeData,
      };
      appendCapability(attach, capNode);
      const scPos = { x: pos.x, y: pos.y + 150 };
      setNodes((prev) => prev.map((n) => (n.id === scId ? { ...n, position: scPos } : n)));
      setEdges((prev) => [...prev, makeRefEdge(capNode.id, scId)]);
      tidyRefsUnderTail(capNode.id);
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
        onImportClick={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        onImportFilePicked={onImportFilePicked}
        ioError={ioError}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

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
