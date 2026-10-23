const vietnamDateKey = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));

const deliveryDayReached = (plannedDeliveryAt, now = new Date()) => Boolean(plannedDeliveryAt) && vietnamDateKey(now) >= vietnamDateKey(plannedDeliveryAt);

module.exports = { vietnamDateKey, deliveryDayReached };
