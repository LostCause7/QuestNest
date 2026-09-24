"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "cn";

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  children?: ReactNode;
};

type Item = { value: string; label: string };

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function collect(node: ReactNode, acc: { items: Item[]; triggerClass: string; placeholder?: string }) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      value?: string;
      className?: string;
      placeholder?: string;
      children?: ReactNode;
    };
    if (child.type === SelectItem && props.value != null) {
      acc.items.push({ value: props.value, label: textOf(props.children) });
    }
    if (child.type === SelectTrigger && props.className) acc.triggerClass = props.className;
    if (child.type === SelectValue && props.placeholder) acc.placeholder = props.placeholder;
    if (props.children) collect(props.children, acc);
  });
}

const SELECT_CLASS =
  "h-8 w-full cursor-pointer rounded-lg border-2 border-slate-400/40 bg-slate-950/45 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

/** Native &lt;select&gt; so iPad opens the system picker instead of a Radix popover. */
export function Select({ value, defaultValue, onValueChange, disabled, name, children }: SelectProps) {
  const acc = { items: [] as Item[], triggerClass: "", placeholder: undefined as string | undefined };
  collect(children, acc);
  return (
    <select
      name={name}
      disabled={disabled}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => onValueChange?.(event.target.value)}
      className={cn(SELECT_CLASS, acc.triggerClass)}
      style={{ touchAction: "manipulation", WebkitAppearance: "menulist-button", appearance: "auto" }}
    >
      {acc.placeholder ? (
        <option value="" disabled>
          {acc.placeholder}
        </option>
      ) : null}
      {acc.items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export function SelectGroup({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function SelectValue(_props: { placeholder?: string }) {
  return null;
}
export function SelectTrigger({ children }: { className?: string; children?: ReactNode }) {
  return <>{children}</>;
}
export function SelectContent({ children }: { className?: string; children?: ReactNode }) {
  return <>{children}</>;
}
export function SelectItem(_props: { value: string; children?: ReactNode }) {
  return null;
}
export function SelectLabel(_props: { children?: ReactNode }) {
  return null;
}
export function SelectSeparator() {
  return null;
}
export function SelectScrollUpButton() {
  return null;
}
export function SelectScrollDownButton() {
  return null;
}
