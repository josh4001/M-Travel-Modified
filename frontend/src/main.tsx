import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import { queryClient } from './lib/queryClient';
import { CurrencyProvider } from './context/CurrencyContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CurrencyProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
