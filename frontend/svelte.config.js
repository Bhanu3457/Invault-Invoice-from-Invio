import adapterAuto from "@sveltejs/adapter-auto";
import adapterNode from "@sveltejs/adapter-node";

const useNodeAdapter =
  process.env.ADAPTER === "node" || process.env.NODE_ENV === "production" && !process.env.VERCEL && !process.env.NETLIFY;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: useNodeAdapter
      ? adapterNode({ out: "build" })
      : adapterAuto(),
  },
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) =>
      filename.includes("node_modules") ? undefined : { runes: true },
  },
};

export default config;

