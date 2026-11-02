import { z } from "zod";

// Only paths inside the app. Browsers treat `//host` and `/\host` as other sites, so without this a
// crafted link could send someone elsewhere right after they sign in.
const InternalPath = z.string().regex(/^\/(?![/\\])/);

/** Search params for pages that send the user back where they came from. Invalid values are dropped. */
export const RedirectSearch = z.object({
	redirect: InternalPath.optional().catch(undefined),
});
