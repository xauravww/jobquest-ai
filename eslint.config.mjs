const eslintConfig = [
  {
    extends: ["next", "next/core-web-vitals", "next/typescript"],
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
