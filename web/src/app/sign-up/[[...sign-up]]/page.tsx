import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--ink)',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-dm-serif)', 
          fontSize: '42px', 
          color: 'var(--mint)',
          margin: '0 0 10px 0'
        }}>
          Join CarePath
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px' }}>
          Create an account to start managing elder care with confidence.
        </p>
      </div>

      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'btn-primary',
            card: {
              backgroundColor: 'var(--ink2)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              borderRadius: 'var(--radius)'
            },
            headerTitle: { color: 'white', fontFamily: 'var(--font-dm-sans)' },
            headerSubtitle: { color: 'var(--muted)' },
            socialButtonsBlockButton: {
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'white'
            },
            dividerLine: { backgroundColor: 'rgba(255,255,255,0.1)' },
            dividerText: { color: 'var(--muted)' },
            formFieldLabel: { color: 'var(--muted)' },
            formFieldInput: {
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: 'var(--radius-sm)'
            },
            footerActionText: { color: 'var(--muted)' },
            footerActionLink: { color: 'var(--mint)' }
          }
        }}
      />
    </div>
  );
}
