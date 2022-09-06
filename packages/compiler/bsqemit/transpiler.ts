import { ModelStatementNode, Statement, SyntaxKind } from "../core/index.js";
import { parse } from "../core/parser.js";
import { transpileModelStatement } from "./typetranspiler.js";

export function transpile(contents: string): string {
  const prog = parse(contents);

  const stmts = prog.statements.map((stmt) => transpileStatement(stmt)).join("\n");

  return `Hello World\n\n${stmts}`;
}

function transpileStatement(stmt: Statement): string {
  switch (stmt.kind) {
    case SyntaxKind.ImportStatement: {
      return "[ImportStatementNode]";
    }
    case SyntaxKind.ModelStatement: {
      return transpileModelStatement(stmt as ModelStatementNode);
    }
    case SyntaxKind.NamespaceStatement: {
      return "[NamespaceStatementNode]";
    }
    case SyntaxKind.InterfaceStatement: {
      return "[InterfaceStatementNodes]";
    }
    case SyntaxKind.UnionStatement: {
      return "[UnionStatementNode]";
    }
    case SyntaxKind.UsingStatement: {
      return "[UsingStatementNode]";
    }
    case SyntaxKind.EnumStatement: {
      return "[EnumStatementNode]";
    }
    case SyntaxKind.AliasStatement: {
      return "[AliasStatementNode]";
    }
    case SyntaxKind.OperationStatement: {
      return "[OperationStatementNode]";
    }
    case SyntaxKind.EmptyStatement: {
      return "[EmptyStatementNode]";
    }
    case SyntaxKind.InvalidStatement: {
      return "[InvalidStatementNode]";
    }
    case SyntaxKind.ProjectionStatement: {
      return "[ProjectionStatementNode]";
    }
  }
}
