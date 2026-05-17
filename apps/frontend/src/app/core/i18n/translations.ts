export type Locale = 'en' | 'ru';

export type TranslationKey = keyof (typeof translations)['en'];

export const translations = {
  en: {
    'app.title': 'Dutchy',
    'app.tagline': 'Snap a receipt and split the bill with friends.',

    'shell.step': 'Step {n}',
    'shell.localeToRu': 'Switch to Russian',
    'shell.localeToEn': 'Switch to English',
    'shell.themeLight': 'Switch to light mode',
    'shell.themeDark': 'Switch to dark mode',
    'shell.back': 'Back',
    'shell.parseReceipt': 'Parse receipt',
    'shell.continue': 'Continue',
    'shell.startOver': 'Start over',

    'setup.addReceipt': 'Add your receipt',
    'setup.takePhoto': 'Take photo',
    'setup.photoLibrary': 'Photo library',
    'setup.receiptPreviewAlt': 'Receipt preview',
    'setup.friends': 'Friends',
    'setup.friendPlaceholder': 'Friend name',
    'setup.add': 'Add',
    'setup.removeFriend': 'Remove {name}',

    'review.title': 'Review items',
    'review.subtitle': 'Fix names and prices until the sum matches the receipt.',
    'review.parsing': 'Reading your receipt…',
    'review.parseErrorManual':
      'Use {addItem} to enter lines manually, then set the total to pay.',
    'review.addItemBtn': '+ Add item',
    'review.totalToPay': 'Total to pay (₸)',
    'review.itemsSubtotal': 'Items subtotal',
    'review.serviceCharge': 'Service charge on receipt',
    'review.serviceLine': 'Service: {service} · Total with service: {total}',
    'review.useTotalWithService': 'Use total with service ({total})',
    'review.totalsMismatchPreService':
      'Total looks like pre-service subtotal. Turn on service above or tap “Use total with service”.',
    'review.totalsMismatchDiff':
      'Difference: {diff} — adjust items, service %, or total to pay.',
    'review.totalsMatch': 'Totals match the receipt.',
    'review.qty': 'Qty',
    'review.unitPrice': 'Unit ₸',
    'review.remove': 'Remove',
    'review.line': 'Line: {amount}',
    'review.newItem': 'New item',

    'assign.title': 'Assign dishes',
    'assign.subtitle':
      'Set how many pieces each friend ordered. All pieces must be assigned.',
    'assign.itemMeta': '{qty} pcs × {price}',
    'assign.leftToAssign': 'Left to assign:',
    'assign.friendQty': '{name}: {qty}',

    'summary.title': 'Summary',
    'summary.withService': 'Includes service charge from the receipt.',
    'summary.noService': 'No service charge on this receipt.',
    'summary.noItems': 'No items assigned',
    'summary.subtotal': 'Subtotal',
    'summary.serviceCharge': 'Service charge',
    'summary.finalTotal': 'Final total',
    'summary.share': 'Share summary',
    'summary.sharedOk': 'Copied or shared!',
    'summary.sharedFail': 'Could not share on this device',

    'parse.noItems':
      'No line items were found on this receipt. Try another photo or tap “+ Add item” below.',
    'parse.network':
      'Cannot reach the API. Run npm run dev (backend on :3000) and try again.',
    'parse.withStatus': 'Could not read the receipt ({status}): {detail}',
    'parse.http': 'Could not read the receipt (HTTP {status}). Try again or add items manually.',
    'parse.generic': 'Could not read the receipt. Try again or edit items manually.',

    'share.line': '  • {name} ×{qty} — {amount}',
    'share.subtotal': 'Subtotal: {amount}',
    'share.service': 'Service: {amount}',
    'share.total': 'Total: {amount}',
  },
  ru: {
    'app.title': 'Dutchy',
    'app.tagline': 'Сфотографируйте чек и разделите счёт с друзьями.',

    'shell.step': 'Шаг {n}',
    'shell.localeToRu': 'Переключить на русский',
    'shell.localeToEn': 'Переключить на английский',
    'shell.themeLight': 'Светлая тема',
    'shell.themeDark': 'Тёмная тема',
    'shell.back': 'Назад',
    'shell.parseReceipt': 'Распознать чек',
    'shell.continue': 'Далее',
    'shell.startOver': 'Сначала',

    'setup.addReceipt': 'Добавьте чек',
    'setup.takePhoto': 'Сделать фото',
    'setup.photoLibrary': 'Из галереи',
    'setup.receiptPreviewAlt': 'Превью чека',
    'setup.friends': 'Друзья',
    'setup.friendPlaceholder': 'Имя друга',
    'setup.add': 'Добавить',
    'setup.removeFriend': 'Удалить {name}',

    'review.title': 'Проверка позиций',
    'review.subtitle':
      'Исправьте названия и цены, пока сумма не совпадёт с чеком.',
    'review.parsing': 'Читаем чек…',
    'review.parseErrorManual':
      'Нажмите {addItem}, чтобы ввести позиции вручную, затем укажите итог к оплате.',
    'review.addItemBtn': '+ Добавить позицию',
    'review.totalToPay': 'Итого к оплате (₸)',
    'review.itemsSubtotal': 'Сумма позиций',
    'review.serviceCharge': 'Обслуживание в чеке',
    'review.serviceLine': 'Обслуживание: {service} · Итого с обслуживанием: {total}',
    'review.useTotalWithService': 'Подставить итого с обслуживанием ({total})',
    'review.totalsMismatchPreService':
      'Итого похоже на сумму до обслуживания. Включите обслуживание выше или нажмите «Подставить итого с обслуживанием».',
    'review.totalsMismatchDiff':
      'Расхождение: {diff} — измените позиции, % обслуживания или итог к оплате.',
    'review.totalsMatch': 'Суммы совпадают с чеком.',
    'review.qty': 'Кол-во',
    'review.unitPrice': 'Цена ₸',
    'review.remove': 'Удалить',
    'review.line': 'Строка: {amount}',
    'review.newItem': 'Новая позиция',

    'assign.title': 'Кто что заказал',
    'assign.subtitle':
      'Укажите, сколько порций взял каждый друг. Все порции должны быть распределены.',
    'assign.itemMeta': '{qty} шт. × {price}',
    'assign.leftToAssign': 'Осталось распределить:',
    'assign.friendQty': '{name}: {qty}',

    'summary.title': 'Итог',
    'summary.withService': 'Включено обслуживание из чека.',
    'summary.noService': 'Обслуживание в этом чеке не учитывается.',
    'summary.noItems': 'Позиции не назначены',
    'summary.subtotal': 'Подытог',
    'summary.serviceCharge': 'Обслуживание',
    'summary.finalTotal': 'К оплате',
    'summary.share': 'Поделиться итогом',
    'summary.sharedOk': 'Скопировано или отправлено!',
    'summary.sharedFail': 'Не удалось поделиться на этом устройстве',

    'parse.noItems':
      'На чеке не найдено позиций. Сделайте другое фото или нажмите «+ Добавить позицию» ниже.',
    'parse.network':
      'Нет связи с API. Запустите npm run dev (бэкенд на :3000) и попробуйте снова.',
    'parse.withStatus': 'Не удалось прочитать чек ({status}): {detail}',
    'parse.http':
      'Не удалось прочитать чек (HTTP {status}). Попробуйте снова или введите позиции вручную.',
    'parse.generic':
      'Не удалось прочитать чек. Попробуйте снова или отредактируйте позиции вручную.',

    'share.line': '  • {name} ×{qty} — {amount}',
    'share.subtotal': 'Подытог: {amount}',
    'share.service': 'Обслуживание: {amount}',
    'share.total': 'Итого: {amount}',
  },
} as const satisfies Record<Locale, Record<string, string>>;
