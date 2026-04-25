'use client'

interface AuthQuoteProps {
  text: string
}

/**
 * Auth page headline — driven entirely by CSS variables set via DevTools.
 * Desktop and mobile have separate variables for size, weight, and top position.
 * Font is always Poppins Light (300) by default.
 */
export function AuthQuote({ text }: AuthQuoteProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600&display=swap');

        .auth-quote {
          /* Always absolute on mobile, within the relative auth container */
          position: absolute;
          left: 0;
          right: 0;
          text-align: center;
          padding: 0 20px;
          font-family: 'Poppins', var(--font-sans, sans-serif);
          color: var(--text1, #f0f0f0);
          line-height: 1.3;

          /* Mobile CSS variable values */
          font-size: var(--auth-quote-size-mob, 22px);
          font-weight: var(--auth-quote-weight-mob, 300);
          top: var(--auth-quote-top-mob, 12%);
        }

        @media (min-width: 1024px) {
          .auth-quote {
            /* On desktop: not absolute, sits in normal flow above the card */
            position: relative;
            top: auto;
            margin-bottom: 40px;

            /* Desktop CSS variable values */
            font-size: var(--auth-quote-size, 44px);
            font-weight: var(--auth-quote-weight, 300);
          }
        }
      `}</style>
      <h1 className="auth-quote">{text}</h1>
    </>
  )
}
