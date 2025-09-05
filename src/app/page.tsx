export default function HomePage() {
	return (
		<main style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100vh',
			fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
		}}>
			<h1 style={{ fontSize: 32, marginBottom: 8 }}>Next.js is running</h1>
			<p style={{ color: '#666', marginBottom: 24 }}>
				This backend-only app is deployed and healthy.
			</p>
			<p>
				Try the API health endpoint at <code>/api/health</code>.
			</p>
		</main>
	);
}


