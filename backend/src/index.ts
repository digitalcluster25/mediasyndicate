import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startBot } from './services/telegram';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`TG Rating Board API running on http://localhost:${PORT}`);
});

// Start Telegram bot polling
startBot();
