import { ModelStatementNode } from "../core/types.js";

export function transpileModelStatement(stmt: ModelStatementNode): string {
  return "[type]" + stmt.id.sv;
}
