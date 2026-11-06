// Điểm vào: tải runtime config trước, rồi mới render ứng dụng
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { loadRuntimeConfig } from './shared/config';

const root = createRoot(document.getElementById('root')!);

loadRuntimeConfig()
  .then((config) =>
    root.render(
      <StrictMode>
        <App config={config} />
      </StrictMode>,
    ),
  )
  .catch((err: unknown) => {
    root.render(<p>Không khởi động được ứng dụng: {String(err)}</p>);
  });
