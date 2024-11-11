// src/utils/html-templates.util.ts

export function tokenExpiredHtml(): string {
  return `
      <html>
        <body>
          <h2>Token Expired</h2>
          <p>The token for email verification has expired.</p>
          <a href="yourapp://redirect">Go back to the app to reverify</a>
        </body>
      </html>
    `;
}

export function emailVerifiedHtml(): string {
  return `
      <html>
        <body>
          <h2>Email Verified Successfully</h2>
          <p>Your email has been verified. You can now use the app.</p>
          <a href="yourapp://redirect">Go to the app</a>
        </body>
      </html>
    `;
}

export function verificationFailedHtml(): string {
  return `
      <html>
        <body>
          <h2>Verification Failed</h2>
          <p>The token does not match. Please try again.</p>
          <a href="yourapp://redirect">Go back to the app</a>
        </body>
      </html>
    `;
}

export function errorHtml(): string {
  return `
      <html>
        <body>
          <h2>Error</h2>
          <p>There was an error during verification. Please try again later.</p>
        </body>
      </html>
    `;
}
