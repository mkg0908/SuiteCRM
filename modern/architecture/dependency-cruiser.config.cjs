/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-prisma-in-routes',
      comment: 'Routes must not import @prisma/client directly - use services',
      severity: 'error',
      from: { path: '^src/routes' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'no-prisma-in-routes-via-repos',
      comment: 'Routes must not import repositories directly - use services',
      severity: 'error',
      from: { path: '^src/routes' },
      to: { path: '^src/repositories' },
    },
    {
      name: 'no-prisma-in-ui',
      comment: 'UI components must not import @prisma/client',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '@prisma/client' },
    },
    {
      name: 'no-repos-in-ui',
      comment: 'UI components must not import repositories',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/repositories' },
    },
    {
      name: 'no-services-in-ui',
      comment: 'UI components must not import server-side services',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/services' },
    },
    {
      name: 'no-circular',
      comment: 'No circular imports allowed',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    moduleSystems: ['es6', 'cjs'],
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/[^/]+' },
    },
  },
};
