/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Circular dependencies make changes and initialization order unsafe.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "production-must-not-import-tests",
      comment: "Production modules must not depend on test-only code.",
      severity: "error",
      from: { pathNot: "(^|/)(test|tests|__tests__)(/|$)|[.](test|spec)[.]" },
      to: { path: "(^|/)(test|tests|__tests__)(/|$)|[.](test|spec)[.]" },
    },
    {
      name: "frontend-lower-layers-must-not-import-pages",
      comment: "Reusable frontend code must not depend on route-level pages.",
      severity: "error",
      from: {
        path: "^frontend/src/(components|hooks|lib|types)/",
      },
      to: { path: "^frontend/src/pages/" },
    },
    {
      name: "backend-models-must-not-import-routes",
      comment: "Persistence models must remain independent of HTTP routes.",
      severity: "error",
      from: { path: "^backend/src/models/" },
      to: { path: "^backend/src/routes/" },
    },
    {
      name: "backend-services-must-not-import-routes",
      comment: "Business services must remain independent of HTTP routes.",
      severity: "error",
      from: { path: "^backend/src/services/" },
      to: { path: "^backend/src/routes/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: "(^|/)(coverage|dist)(/|$)",
    tsConfig: { fileName: "tsconfig.architecture.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
}
