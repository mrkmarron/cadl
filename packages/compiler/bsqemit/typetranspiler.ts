import { ok } from "assert";
import {
  Expression,
  IdentifierNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  SyntaxKind,
  TypeReferenceNode,
  ArrayExpressionNode,
  TupleExpressionNode,
  UnionExpressionNode,
  IntersectionExpressionNode,
  EnumStatementNode,
  EnumMemberNode,
  EnumSpreadMemberNode,
  StringLiteralNode,
  DecoratorExpressionNode,
} from "../core/types.js";

const PrimitiveTypeMap = new Map<string, string>()
  .set("bytes", "ByteBuffer")
  .set("int64", "Int")
  .set("int32", "Int")
  .set("int16", "Int")
  .set("int8", "Int")
  .set("uint64", "Nat")
  .set("uint32", "Nat")
  .set("uint16", "Nat")
  .set("uint8", "Nat")
  .set("float32", "Float")
  .set("float64", "Float")
  .set("null", "None")
  .set("boolean", "Bool")
  .set("string", "String")
  .set("safeint", "BigInt")
  .set("zonedDateTime", "DateTime")
  .set("plainDate", "CalendarDate")
  .set("plainTime", "RelativeTime")
  .set("duration", "TickTime")
  .set("integer", "BigInt")
  .set("float", "Float")
  .set("numeric", "[NUMERIC]");

let PatternValidators: string[] = [];

export function initializePatternValidators() {
  PatternValidators = [];
}

export function getPatternValidators(validator: string): string[] {
  return PatternValidators.map((pv) => validator + pv);
}

export function transpileModelStatement(stmt: ModelStatementNode): string {
  const typename = stmt.id.sv;

  if (stmt.is !== undefined) {
    const aliasname = transpileTypeExpression(stmt.is);

    if (PrimitiveTypeMap.has(aliasname) !== undefined) {
      return `typedecl ${typename} = ${PrimitiveTypeMap.get(aliasname)};`;
    } else {
      return `typedef ${typename} = ${aliasname};`;
    }
  }

  const invariants = stmt.decorators
    .filter(
      (decorator) =>
        decorator.target.kind === SyntaxKind.Identifier &&
        (decorator.target as IdentifierNode).sv === "invariant"
    )
    .map(
      (decorator) => "    invariant " + (decorator.arguments[0] as StringLiteralNode).value + ";"
    );

  initializePatternValidators();
  const members = stmt.properties.map((prop) => transpileProperty(prop));

  invariants.push(...getPatternValidators("    invariant "));

  return (
    `entity ${typename} provides APIType {\n` +
    `${members.join("\n")}` +
    `${invariants.length !== 0 ? "\n\n" + invariants.join("\n") : ""}\n}`
  );
}

function transpileProperty(prop: ModelPropertyNode | ModelSpreadPropertyNode): string {
  if (prop.kind === SyntaxKind.ModelProperty) {
    return transpileModelProperty(prop);
  } else {
    return transpileSpreadProperty(prop as ModelSpreadPropertyNode);
  }
}

function transpileModelProperty(prop: ModelPropertyNode): string {
  const fname = prop.id.kind === SyntaxKind.Identifier ? prop.id.sv : prop.id.value;
  const ftype = transpileTypeExpression(prop.value, [prop.decorators, fname]);

  //TODO: type expression transpile and call above

  ok(prop.default === undefined && !prop.optional, "Need to do expression transpile");

  return "    " + `field ${fname}: ${ftype};`;
}

function transpileSpreadProperty(prop: ModelSpreadPropertyNode): string {
  return "[ModelSpreadPropertyNode]";
}

export function transpileEnumStatement(stmt: EnumStatementNode): string {
  const typename = stmt.id.sv;

  const members = stmt.members.map((member) => transpileEnum(member));

  return `enum ${typename} {\n${members.join(",\n")}\n}`;
}

function transpileEnum(prop: EnumMemberNode | EnumSpreadMemberNode): string {
  if (prop.kind === SyntaxKind.EnumMember) {
    return transpileEnumMember(prop);
  } else {
    return transpileSpreadEnum(prop as EnumSpreadMemberNode);
  }
}

function transpileEnumMember(member: EnumMemberNode): string {
  const ename = member.id.kind === SyntaxKind.Identifier ? member.id.sv : member.id.value;

  ok(member.value === undefined, "Support custom values for enums?");

  return "    " + ename;
}

function transpileSpreadEnum(member: EnumSpreadMemberNode): string {
  return "[EnumSpreadMemberNode]";
}

export function transpileTypeExpression(
  exp: Expression,
  decorators?: [readonly DecoratorExpressionNode[], string]
): string {
  switch (exp.kind) {
    case SyntaxKind.ArrayExpression: {
      return `List<${transpileTypeExpression((exp as ArrayExpressionNode).elementType)}>`;
    }
    case SyntaxKind.MemberExpression: {
      return "[MemberExpressionNode]";
    }
    case SyntaxKind.ModelExpression: {
      return "[ModelExpression]";
    }
    case SyntaxKind.TupleExpression: {
      return `[${(exp as TupleExpressionNode).values
        .map((tval) => transpileTypeExpression(tval))
        .join(", ")}]`;
    }
    case SyntaxKind.UnionExpression: {
      return (exp as UnionExpressionNode).options
        .map((opt) => transpileTypeExpression(opt))
        .join(" | ");
    }
    case SyntaxKind.IntersectionExpression: {
      //TODO: this isn't supported in Bosque for Record or Tuple types... Only for Concepts/Entities
      return (exp as IntersectionExpressionNode).options
        .map((opt) => transpileTypeExpression(opt))
        .join(" & ");
    }
    case SyntaxKind.TypeReference: {
      const trgt = (exp as TypeReferenceNode).target;
      if (trgt.kind === SyntaxKind.Identifier) {
        const iname = (trgt as IdentifierNode).sv;
        const bname = PrimitiveTypeMap.get(iname) || iname;

        const pattern =
          decorators !== undefined
            ? decorators[0].find(
                (decorator) =>
                  decorator.target.kind === SyntaxKind.Identifier &&
                  (decorator.target as IdentifierNode).sv === "pattern"
              )
            : undefined;

        if (bname === "String" && pattern !== undefined) {
          const restr = (pattern.arguments[0] as StringLiteralNode).value;
          const vre = "/" + restr.slice(1, restr.length - 1) + "/";
          const vname = decorators !== undefined ? decorators[1] : "[X]";

          PatternValidators.push(`${vre}.accepts($${vname});`);
        }

        return bname;
      } else {
        return "[Unknown TypeReference Setup]";
      }
    }
    case SyntaxKind.Identifier: {
      const iname = (exp as IdentifierNode).sv;
      return PrimitiveTypeMap.get(iname) || iname;
    }
    case SyntaxKind.StringLiteral: {
      //TODO: we don't do string literal types -- map string literals to enum
      return "[StringLiteral]";
    }
    case SyntaxKind.NumericLiteral: {
      //TODO: we don't do numeric literal types
      return "[NumericLiteral]";
    }
    case SyntaxKind.BooleanLiteral: {
      //TODO: we don't do boolean literal types
      return "[BooleanLiteral]";
    }
    case SyntaxKind.VoidKeyword: {
      return "[Void]";
    }
    case SyntaxKind.NeverKeyword: {
      return "[Never]";
    }
    case SyntaxKind.UnknownKeyword: {
      return "Any";
    }
  }
}
