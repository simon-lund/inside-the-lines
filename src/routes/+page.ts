// The studio is a purely client-side app: the REPL bundler runs in web workers
// and the Workspace/Bundler classes cannot exist during SSR.
export const ssr = false;
