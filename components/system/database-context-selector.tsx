"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { SecondaryButton } from "@/components";
import type { DatabaseAttachmentTreeNode } from "@/types/system";

function findNode(nodes: DatabaseAttachmentTreeNode[], path: string): DatabaseAttachmentTreeNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }

    const nested = findNode(node.children, path);

    if (nested) {
      return nested;
    }
  }

  return null;
}

function findParentPath(nodes: DatabaseAttachmentTreeNode[], path: string, parentPath = "root"): string | null {
  for (const node of nodes) {
    if (node.path === path) {
      return parentPath;
    }

    const nested = findParentPath(node.children, path, node.path);

    if (nested) {
      return nested;
    }
  }

  return null;
}

function buildBreadcrumbs(nodes: DatabaseAttachmentTreeNode[], currentPath: string) {
  if (currentPath === "root") {
    return [{ path: "root", label: "Database" }];
  }

  const breadcrumbs: Array<{ path: string; label: string }> = [];
  let pointer: string | null = currentPath;

  while (pointer && pointer !== "root") {
    const node = findNode(nodes, pointer);

    if (!node) {
      break;
    }

    breadcrumbs.unshift({ path: node.path, label: node.label });
    pointer = findParentPath(nodes, pointer);
  }

  return [{ path: "root", label: "Database" }, ...breadcrumbs];
}

export function DatabaseContextSelector({
  nodes,
  selectedPaths,
  onChange,
  title = "Attach structured database context",
  description = "Select any branch or layer to include its fields and all descendant structured data."
}: {
  nodes: DatabaseAttachmentTreeNode[];
  selectedPaths: string[];
  onChange: (paths: string[]) => void;
  title?: string;
  description?: string;
}) {
  const [currentPath, setCurrentPath] = useState("root");

  const currentNode = useMemo(
    () => (currentPath === "root" ? null : findNode(nodes, currentPath)),
    [currentPath, nodes]
  );
  const childNodes = useMemo(
    () => (currentNode ? currentNode.children : nodes),
    [currentNode, nodes]
  );
  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(nodes, currentPath),
    [currentPath, nodes]
  );
  const parentPath = useMemo(
    () => (currentPath === "root" ? null : findParentPath(nodes, currentPath)),
    [currentPath, nodes]
  );

  useEffect(() => {
    if (currentPath !== "root" && !currentNode) {
      setCurrentPath("root");
    }
  }, [currentNode, currentPath]);

  function togglePath(path: string, checked: boolean) {
    onChange(
      checked
        ? Array.from(new Set([...selectedPaths, path]))
        : selectedPaths.filter((selectedPath) => selectedPath !== path)
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-synapse-border bg-synapse-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-card-title text-synapse-text">{title}</p>
          <p className="mt-1 text-body text-synapse-muted">{description}</p>
        </div>
        <span className="rounded-full border border-synapse-border bg-white px-3 py-1 text-meta text-synapse-muted">
          {selectedPaths.length} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {parentPath ? (
          <SecondaryButton
            type="button"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => setCurrentPath(parentPath)}
          >
            Back
          </SecondaryButton>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {breadcrumbs.map((crumb) => (
            <button
              key={crumb.path}
              type="button"
              className={`rounded-full px-3 py-1 text-meta transition ${
                crumb.path === currentPath
                  ? "bg-synapse-text text-white"
                  : "border border-synapse-border bg-white text-synapse-muted"
              }`}
              onClick={() => setCurrentPath(crumb.path)}
            >
              {crumb.label}
            </button>
          ))}
        </div>
      </div>

      {currentNode ? (
        <div className="rounded-2xl border border-synapse-border bg-white p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={selectedPaths.includes(currentNode.path)}
              onChange={(event) => togglePath(currentNode.path, event.target.checked)}
            />
            <span>
              <span className="block font-medium text-synapse-text">{currentNode.label}</span>
              <span className="text-body text-synapse-muted">
                {currentNode.description || "No short description yet."}
              </span>
            </span>
          </label>
        </div>
      ) : null}

      {childNodes.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {childNodes.map((node) => (
            <div key={node.path} className="rounded-2xl border border-synapse-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPaths.includes(node.path)}
                    onChange={(event) => togglePath(node.path, event.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-synapse-text">{node.label}</span>
                    <span className="line-clamp-3 text-body text-synapse-muted">
                      {node.description || "No short description yet."}
                    </span>
                  </span>
                </label>
                {node.children.length > 0 ? (
                  <button
                    type="button"
                    className="synapse-focus flex shrink-0 items-center gap-1 rounded-full border border-synapse-border bg-synapse-elevated px-3 py-1 text-meta text-synapse-muted transition hover:border-synapse-primary hover:text-synapse-primary"
                    onClick={() => setCurrentPath(node.path)}
                  >
                    Open
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-synapse-border bg-white p-5 text-body text-synapse-muted">
          No child branches in this layer. Selecting the current layer will include its fields.
        </div>
      )}
    </div>
  );
}
