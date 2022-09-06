import { ok } from "assert";
import {
  Expression,
  IdentifierNode,
  ModelPropertyNode,
  ModelSpreadPropertyNode,
  ModelStatementNode,
  SyntaxKind,
  TypeReferenceNode,
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
  .set("integer", "BitInt")
  .set("float", "Float")
  .set("numeric", "[NUMERIC]");

export function transpileModelStatement(stmt: ModelStatementNode): string {
  const typename = stmt.id.sv;

  if (stmt.is !== undefined) {
    const aliasname = getAliasedTypeName(stmt.is);

    if (PrimitiveTypeMap.has(aliasname) !== undefined) {
      return `typedecl ${typename} = ${PrimitiveTypeMap.get(aliasname)};`;
    } else {
      return `typedef ${typename} = ${aliasname};`;
    }
  }

  const members = stmt.properties.map((prop) => transpileProperty(prop));

  return `entity ${typename} provides APIType {\n${members.join("\n")}\n}`;
}

function getAliasedTypeName(exp: Expression): string {
  ok(
    exp.kind === SyntaxKind.TypeReference &&
      (exp as TypeReferenceNode).target.kind === SyntaxKind.Identifier,
    "Type alias of literal -- need to do something else"
  );

  return ((exp as TypeReferenceNode).target as IdentifierNode).sv;
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
  const ftype =
    prop.value.kind === SyntaxKind.TypeReference
      ? ((prop.value as TypeReferenceNode).target as IdentifierNode).sv
      : "[OTHER]";

  //TODO: type expression transpile and call above

  ok(prop.default === undefined && !prop.optional, "Need to do expression transpile");

  return "    " + `field ${fname}: ${ftype};`;
}

function transpileSpreadProperty(prop: ModelSpreadPropertyNode): string {
  return "[ModelSpreadPropertyNode]";
}
