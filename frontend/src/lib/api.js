// Thin client for the FastAPI backend. In dev, Vite proxies /api -> :8000.
const BASE = '/api';

async function request(path, options = {}) {
	const res = await fetch(BASE + path, {
		headers: { 'Content-Type': 'application/json' },
		...options
	});
	if (!res.ok) {
		const detail = await res.text();
		throw new Error(`${res.status} ${res.statusText}: ${detail}`);
	}
	if (res.status === 204) return null;
	return res.json();
}

export const api = {
	listChants: ({ search = '', mode = '', office = '', limit = 50, offset = 0 } = {}) => {
		const p = new URLSearchParams({ limit, offset });
		if (search) p.set('search', search);
		if (mode) p.set('mode', mode);
		if (office) p.set('office', office);
		return request(`/chants?${p}`);
	},
	getChant: (id) => request(`/chants/${id}`),
	addToDeck: (id) => request(`/reviews/deck/${id}`, { method: 'POST' }),
	removeFromDeck: (id) => request(`/reviews/deck/${id}`, { method: 'DELETE' }),
	dueCards: (limit = 20) => request(`/reviews/due?limit=${limit}`),
	grade: (id, cardType, grade) =>
		request(`/reviews/${id}/${cardType}/grade`, {
			method: 'POST',
			body: JSON.stringify({ grade })
		}),
	stats: () => request('/reviews/stats')
};
