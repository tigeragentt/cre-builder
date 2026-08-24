/**
 * RemixDesktop WebSocket Bridge
 *
 * Scaffold CRE acts as a WebSocket client. RemixDesktop runs a local WS server
 * (default port 27182) that listens for incoming project file payloads.
 *
 * Flow:
 *   1. User clicks "Send to RemixDesktop" in ExportModal
 *   2. CRE opens a WS connection to ws://localhost:27182
 *   3. CRE sends a JSON message with all project files
 *   4. RemixDesktop receives the payload, writes files to its workspace
 *   5. CRE receives an ACK and closes the connection
 *
 * Protocol (JSON messages):
 *
 *   CRE → Desktop:
 *   {
 *     type: "cre:import",
 *     version: 1,
 *     projectName: "my-workflow",
 *     files: {
 *       "workflow-my-workflow/workflow.ts": "<content>",
 *       "workflow-my-workflow/main.ts": "<content>",
 *       ...
 *     }
 *   }
 *
 *   Desktop → CRE (ACK):
 *   { type: "cre:import:ack", success: true, workspace: "my-workflow" }
 *
 *   Desktop → CRE (Error):
 *   { type: "cre:import:ack", success: false, error: "reason" }
 */

export const REMIX_DESKTOP_WS_PORT = 27182

export interface CREImportPayload {
  type: 'cre:import'
  version: 1
  projectName: string
  files: Record<string, string>
}

export interface CREImportAck {
  type: 'cre:import:ack'
  success: boolean
  workspace?: string
  error?: string
}

export type BridgeStatus =
  | 'idle'
  | 'connecting'
  | 'sending'
  | 'success'
  | 'error'
  | 'not-found'  // RemixDesktop not running / WS server not available

export interface BridgeResult {
  success: boolean
  workspace?: string
  error?: string
}

/**
 * Send project files to RemixDesktop via WebSocket.
 * Resolves with the ACK from RemixDesktop, or rejects with a descriptive error.
 */
export async function sendToRemixDesktop(
  projectName: string,
  files: Record<string, string>,
  port = REMIX_DESKTOP_WS_PORT,
  timeoutMs = 10000
): Promise<BridgeResult> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket
    let settled = false
    let timer: ReturnType<typeof setTimeout>

    const settle = (result: BridgeResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { ws?.close() } catch (_) { /* ignore */ }
      if (result.success) resolve(result)
      else reject(new Error(result.error ?? 'Unknown error'))
    }

    try {
      ws = new WebSocket(`ws://localhost:${port}`)
    } catch (err) {
      return reject(new Error(`Could not create WebSocket: ${String(err)}`))
    }

    timer = setTimeout(() => {
      settle({ success: false, error: 'Timed out waiting for RemixDesktop to respond.' })
    }, timeoutMs)

    ws.onopen = () => {
      const payload: CREImportPayload = {
        type: 'cre:import',
        version: 1,
        projectName,
        files,
      }
      ws.send(JSON.stringify(payload))
    }

    ws.onmessage = (event) => {
      try {
        const ack = JSON.parse(event.data as string) as CREImportAck
        if (ack.type === 'cre:import:ack') {
          settle(ack.success
            ? { success: true, workspace: ack.workspace }
            : { success: false, error: ack.error ?? 'RemixDesktop reported an error.' }
          )
        }
      } catch (_) {
        settle({ success: false, error: 'Invalid response from RemixDesktop.' })
      }
    }

    ws.onerror = () => {
      settle({
        success: false,
        error:
          `Could not connect to RemixDesktop on port ${port}. ` +
          `Make sure RemixDesktop is open and the CRE bridge is enabled.`,
      })
    }

    ws.onclose = (event) => {
      if (!settled) {
        settle({
          success: false,
          error: event.reason || 'WebSocket closed before receiving a response.',
        })
      }
    }
  })
}
