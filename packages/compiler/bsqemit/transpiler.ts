import {
  EnumStatementNode,
  IdentifierNode,
  InterfaceStatementNode,
  ModelExpressionNode,
  ModelPropertyNode,
  ModelStatementNode,
  OperationSignatureDeclarationNode,
  OperationStatementNode,
  Statement,
  StringLiteralNode,
  SyntaxKind,
} from "../core/index.js";
import { parse } from "../core/parser.js";
import {
  getPatternValidators,
  initializePatternValidators,
  transpileEnumStatement,
  transpileModelStatement,
  transpileTypeExpression,
} from "./typetranspiler.js";

export function transpile(contents: string): string {
  const prog = parse(contents);

  const stmts = prog.statements.map((stmt) => transpileStatement(stmt)).join("\n\n");

  return `namespace Main;\n\n${stmts}`;
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
      return transpileInterfaceStatement(stmt as InterfaceStatementNode);
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

function transpileInterfaceStatement(stmt: InterfaceStatementNode): string {
  return stmt.operations.map((op) => transpileOperationStatement(op)).join("\n\n");
}

function transpileOperationStatement(stmt: OperationStatementNode): string {
  const preconds: string[] = stmt.decorators
    .filter(
      (decorator) =>
        decorator.target.kind === SyntaxKind.Identifier &&
        (decorator.target as IdentifierNode).sv === "requires"
    )
    .map(
      (decorator) => "    requires " + (decorator.arguments[0] as StringLiteralNode).value + ";"
    );

  const postconds: string[] = stmt.decorators
    .filter(
      (decorator) =>
        decorator.target.kind === SyntaxKind.Identifier &&
        (decorator.target as IdentifierNode).sv === "ensures"
    )
    .map((decorator) => "    ensures " + (decorator.arguments[0] as StringLiteralNode).value + ";");

  const opname = stmt.id.sv;

  initializePatternValidators();
  const opargs: string[] = (
    (stmt.signature as OperationSignatureDeclarationNode).parameters as ModelExpressionNode
  ).properties.map((prop) => transpileParameter(prop as ModelPropertyNode));

  preconds.push(...getPatternValidators("    requires "));

  initializePatternValidators();
  const opres = transpileTypeExpression(
    (stmt.signature as OperationSignatureDeclarationNode).returnType
  );
  postconds.push(...getPatternValidators("    ensures "));

  return (
    `entrypoint function ${opname}` +
    `(${opargs.join(", ")})` +
    `: ${opres} ` +
    (preconds.length !== 0 ? "\n" + preconds.join("\n") : "") +
    (postconds.length !== 0 ? "\n" + postconds.join("\n") : "") +
    (preconds.length + postconds.length !== 0 ? "\n" : "") +
    `{\n    return s_reshavoc<${opres}>("${opname}");\n}`
  );
}

function transpileParameter(prop: ModelPropertyNode): string {
  const pname = prop.id.kind === SyntaxKind.Identifier ? prop.id.sv : prop.id.value;
  const ptype = transpileTypeExpression(prop.value, [prop.decorators, pname]);

  return `${pname}: ${ptype}`;
}
