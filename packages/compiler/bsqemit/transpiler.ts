import { EnumStatementNode, ModelStatementNode, Statement, SyntaxKind } from "../core/index.js";
import { parse } from "../core/parser.js";
import {
  GeneratedValidators,
  transpileEnumStatement,
  transpileModelStatement,
} from "./typetranspiler.js";

export function transpile(contents: string): string {
  const prog = parse(contents);

  const stmts = prog.statements.map((stmt) => transpileStatement(stmt)).join("\n\n");

  const validators =
    GeneratedValidators.length !== 0 ? GeneratedValidators.join("\n") + "\n\n" : "";

  return `namespace Main;\n${validators}${stmts}`;
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
      return transpileEnumStatement(stmt as EnumStatementNode);
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
