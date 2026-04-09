import './globals.css';

export const metadata = {
  title: 'BTCbot App',
  description: 'Painel pessoal do BTCbot',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
