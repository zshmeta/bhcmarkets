// Redirect helpers are security-sensitive.
// We allow:
// - relative paths within this auth app (e.g. "/")
// - absolute URLs back to the parent/base domain (different subdomains allowed)
// Everything else is rejected to prevent open-redirect attacks.

export type SafeReturnTo =
	| { kind: "relative"; value: string }
	| { kind: "absolute"; value: string };

export function isSafeRelativePath(path: string): boolean {
	if (!path.startsWith("/")) return false;
	if (path.startsWith("//")) return false;
	// Disallow attempts to smuggle a scheme.
	if (path.includes("://")) return false;
	return true;
}

function inferBaseDomain(hostname: string): string {
	const parts = hostname.split(".").filter(Boolean);
	if (parts.length < 2) return hostname;
	return parts.slice(-2).join(".");
}

function getAllowedBaseDomain(hostname: string): string {
	return inferBaseDomain(hostname.toLowerCase());
}

function isAllowedAbsoluteReturnTo(url: URL, currentHost: string): boolean {
	// Never allow credentials in URLs.
	if (url.username || url.password) return false;

	const hostname = url.hostname.toLowerCase();
	const currentHostLower = currentHost.toLowerCase();

	// Development mode: Allow same localhost with any port
	// This covers localhost:3000 → localhost:5173 redirects during dev
	const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
	const currentIsLocalhost = currentHostLower === "localhost" || currentHostLower === "127.0.0.1" || currentHostLower.endsWith(".localhost");
	
	if (isLocalhost && currentIsLocalhost) {
		// In dev, allow any localhost-to-localhost redirect (different ports OK)
		if (url.protocol === "http:" || url.protocol === "https:") {
			return true;
		}
		return false;
	}

	// Production mode: Same parent domain validation
	const baseDomain = getAllowedBaseDomain(currentHost);
	const domainOk = hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
	if (!domainOk) return false;

	// Prefer https; allow http only during dev
	if (url.protocol === "https:") return true;
	if (url.protocol === "http:") {
		return Boolean(import.meta.env.DEV);
	}

	return false;
}

export function parseSafeReturnTo(raw: string, currentHost: string): SafeReturnTo | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	if (isSafeRelativePath(trimmed)) {
		return { kind: "relative", value: trimmed };
	}

	try {
		const url = new URL(trimmed);
		if (!isAllowedAbsoluteReturnTo(url, currentHost)) return null;
		return { kind: "absolute", value: url.toString() };
	} catch {
		return null;
	}
}

function baseOriginFromCurrent(): string {
	if (typeof window === "undefined") return "/";
	const { protocol, hostname, port } = window.location;
	const baseDomain = getAllowedBaseDomain(hostname);
	const hostPort = port ? `:${port}` : "";
	return `${protocol}//${baseDomain}${hostPort}`;
}

export function resolveReturnTo(params: URLSearchParams): SafeReturnTo {
	const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
	const raw = params.get("returnTo");

	if (raw) {
		const safe = parseSafeReturnTo(raw, currentHost);
		if (safe) return safe;
	}

	// Fallback: send to base origin root.
	const fallback = baseOriginFromCurrent();
	return { kind: "absolute", value: fallback };
}

export function redirectToReturnTo(
	target: SafeReturnTo,
	navigate: (to: string, opts?: { replace?: boolean }) => void,
) {
	if (target.kind === "relative") {
		navigate(target.value, { replace: true });
		return;
	}

	// Cross-subdomain redirect back to the calling app.
	window.location.replace(target.value);
}

export function buildReturnToQuery(returnTo?: string): string {
	if (!returnTo) return "";
	const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
	const safe = parseSafeReturnTo(returnTo, currentHost);
	if (!safe) return "";
	return `?returnTo=${encodeURIComponent(safe.value)}`;
}
