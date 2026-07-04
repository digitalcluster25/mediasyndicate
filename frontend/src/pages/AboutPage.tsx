import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">О проекте</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Что это?</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">
              TG Rating Board — независимая платформа для рейтингования Telegram-каналов.
              Мы собираем данные о подписчиках, вовлечённости и росте каналов, чтобы дать объективную картину экосистемы Telegram.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Как считается рейтинг?</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-600 list-disc pl-5">
              <li><strong>Подписчики</strong> — 30% итогового балла (логарифмическая шкала)</li>
              <li><strong>Вовлечённость за сутки</strong> — 35% (ER = реакции × 0.1 + репосты × 1 + комментарии × 2)</li>
              <li><strong>Темп роста</strong> — 15% (изменение подписчиков за неделю)</li>
              <li><strong>Экспертная оценка</strong> — 20% (ручная модерация, шкала 1–5)</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Как добавить канал?</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Любой пользователь может предложить канал для включения в рейтинг через форму на странице каталога.
              Все заявки проходят модерацию перед публикацией.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
