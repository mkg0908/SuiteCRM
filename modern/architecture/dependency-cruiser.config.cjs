/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-prisma-in-routes',
      severity: 'error',
      comment: 'Routes must not import @prisma/client directly',
      from: { path: '^src/routes' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'no-repositories-in-routes',
      severity: 'error',
      comment: 'Routes must not import repositories directly',
      from: { path: '^src/routes' },
      to: { path: '^src/repositories' },
    },
    {
      name: 'no-prisma-in-ui',
      severity: 'error',
      comment: 'UI components must not import @prisma/client',
      from: { path: '^src/ui' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'no-repositories-in-ui',
      severity: 'error',
      comment: 'UI components must not import repositories',
      from: { path: '^src/ui' },
      to: { path: '^src/repositories' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'No circular dependencies allowed',
      from: { pathNot: 'node_modules' },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
