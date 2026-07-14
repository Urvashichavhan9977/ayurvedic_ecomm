import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section
      className="container"
      style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '50vh' }}
    >
      <h1 style={{ fontSize: '4rem', color: 'var(--gold)', fontWeight: 900, marginBottom: '.5rem' }}>404</h1>
      <h2 style={{ color: 'var(--green)', marginBottom: '.75rem' }}>Page not found</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.75rem' }}>
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="btn btn-green">Back to Home</Link>
    </section>
  )
}
