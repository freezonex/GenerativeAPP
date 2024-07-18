import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-textarea/styles.css'; // also import this if you want to use the CopilotTextarea component
import '@copilotkit/react-ui/styles.css';
import { Inter } from 'next/font/google';
import './globals.css';
import { CopilotSidebar } from '@copilotkit/react-ui';
import { EndpointsContext } from './agent';
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <CopilotKit url="/api/copilotkit/openai/">
          <CopilotSidebar>{children}</CopilotSidebar>
        </CopilotKit> */}
        <div className="flex flex-col p-4 md:p-12 h-[100vh]">
          <EndpointsContext>{children}</EndpointsContext>
        </div>
      </body>
    </html>
  );
}
