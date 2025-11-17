import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { SettingsProvider } from './context/SettingsContext';
import { QueryProvider } from './context/QueryContext';
import { ScenarioProvider } from './context/ScenarioContext';
import { DevTeamProvider } from './context/DevTeamContext';
import './styles/index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// OpenTelemetry setup
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // OTLP HTTP endpoint for traces
});

const provider = new WebTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation(),
    new XMLHttpRequestInstrumentation(),
  ],
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const queryClient = new QueryClient();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <QueryProvider>
          <ScenarioProvider>
            <DevTeamProvider>
              <App />
            </DevTeamProvider>
          </ScenarioProvider>
        </QueryProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

registerServiceWorker();
