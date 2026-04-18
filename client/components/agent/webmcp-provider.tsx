"use client";

import { useEffect } from "react";

type WebMcpNavigator = Navigator & {
  modelContext?: {
    registerTool?: (tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    }) => (() => void) | void;
    provideContext?: (payload: { tools: unknown[] }) => void;
  };
};

export function WebMcpProvider() {
  useEffect(() => {
    const nav = navigator as WebMcpNavigator;
    const unregisters: Array<() => void> = [];

    const getTool = {
      name: "get_devmeter_docs",
      description: "Get the DevMeter documentation URL.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: async () => ({
        ok: true,
        url: "/docs",
      }),
    };

    const getCatalogTool = {
      name: "get_devmeter_api_catalog",
      description: "Get the DevMeter API catalog URL.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: async () => ({
        ok: true,
        url: "/.well-known/api-catalog",
      }),
    };

    if (typeof nav.modelContext?.registerTool === "function") {
      const unregisterDocs = nav.modelContext.registerTool(getTool);
      const unregisterCatalog = nav.modelContext.registerTool(getCatalogTool);
      if (typeof unregisterDocs === "function") unregisters.push(unregisterDocs);
      if (typeof unregisterCatalog === "function") unregisters.push(unregisterCatalog);
    }

    if (typeof nav.modelContext?.provideContext === "function") {
      nav.modelContext.provideContext({
        tools: [
          {
            name: getTool.name,
            description: getTool.description,
            inputSchema: getTool.inputSchema,
          },
          {
            name: getCatalogTool.name,
            description: getCatalogTool.description,
            inputSchema: getCatalogTool.inputSchema,
          },
        ],
      });
    }

    return () => {
      for (const unregister of unregisters) unregister();
    };
  }, []);

  return null;
}
