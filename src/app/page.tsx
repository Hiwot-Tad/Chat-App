export const dynamic = 'force-dynamic';

export default function HomePage() {
	return (
		<main style={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100vh',
			gap: 24,
			fontFamily: 'system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
		}}>
			{/* Logo */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<img
					src="/next.svg"
					alt="Next.js Logo"
					width={90}
					height={18}
					style={{ display: 'block' }}
				/>
			</div>

			{/* Instructions */}
			<ol style={{ color: '#666', margin: 0, padding: 0, listStyle: 'none', textAlign: 'center', lineHeight: 1.6 }}>
				<li>Get started by editing <code>app/page.tsx</code>.</li>
				<li>Save and see your changes instantly.</li>
			</ol>

			{/* Actions */}
			<div style={{ display: 'flex', gap: 12 }}>
				<a
					href="https://vercel.com/new"
					style={{
						padding: '10px 16px',
						background: '#111',
						color: 'white',
						borderRadius: 6,
						textDecoration: 'none'
					}}
					rel="noreferrer"
					target="_blank"
				>
					Deploy now
				</a>
				<a
					href="https://nextjs.org/docs"
					style={{
						padding: '10px 16px',
						background: '#f5f5f5',
						color: '#111',
						borderRadius: 6,
						textDecoration: 'none',
						border: '1px solid #e5e5e5'
					}}
					rel="noreferrer"
					target="_blank"
				>
					Read our docs
				</a>
			</div>

			{/* Helpful links */}
			<div style={{ display: 'flex', gap: 16, color: '#555', fontSize: 14 }}>
				<a href="https://nextjs.org/learn" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Learn</a>
				<a href="https://vercel.com/templates?framework=nextjs" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Examples</a>
				<a href="https://nextjs.org" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Go to nextjs.org →</a>
			</div>
		</main>
	);
}


