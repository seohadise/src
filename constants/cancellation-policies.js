export const CANCELLATION_POLICY_KEYS = {
  EASY: "easy",
  BALANCED: "balanced",
  STRICT: "strict",
};

export const DEFAULT_CANCELLATION_POLICY = CANCELLATION_POLICY_KEYS.BALANCED;

const createPenalty = (label, minHoursBefore, hostPenaltyPercent) => ({
  label,
  minHoursBefore,
  hostPenaltyPercent,
  guestRefundPercent: 100 - hostPenaltyPercent,
});

export const CANCELLATION_POLICIES = {
  [CANCELLATION_POLICY_KEYS.EASY]: {
    key: CANCELLATION_POLICY_KEYS.EASY,
    title: "آسان",
    tone: "green",
    badge: "افزایش رزرو",
    description:
      "با قوانین آسان، مهمان احساس امنیت بیشتری دارد و در نتیجه احتمال رزرو افزایش می‌یابد. در صورت لغو، بسته به فاصله تا زمان ورود بین ۳۰٪ تا ۷۰٪ از مبلغ کل نزد میزبان باقی می‌ماند.",
    notes: [
      "لغو تا ۳۰ دقیقه پس از پرداخت، بدون جریمه است.",
      "هرچه به تاریخ ورود نزدیک‌تر شویم، سهم بیشتری از مبلغ به عنوان خسارت نزد میزبان می‌ماند.",
    ],
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 30),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 50),
      createPenalty("کمتر از ۳ روز مانده", 0, 70),
    ],
  },
  [CANCELLATION_POLICY_KEYS.BALANCED]: {
    key: CANCELLATION_POLICY_KEYS.BALANCED,
    title: "متعادل (پیشنهادی)",
    tone: "blue",
    badge: "متعادل",
    description:
      "قوانین متعادل، تعادلی میان حق میزبان و انعطاف‌پذیری برای مهمان ایجاد می‌کند. در این حالت، لغوها بین ۴۰٪ تا ۸۰٪ از مبلغ رزرو را به عنوان خسارت برای میزبان نگه می‌دارند.",
    notes: [
      "لغو تا ۳۰ دقیقه پس از پرداخت، بدون جریمه است.",
      "این گزینه برای میزبان‌هایی مناسب است که می‌خواهند ضرر ناشی از رزروهای نزدیک به سفر را مدیریت کنند.",
    ],
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 40),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 60),
      createPenalty("کمتر از ۳ روز مانده", 0, 80),
    ],
  },
  [CANCELLATION_POLICY_KEYS.STRICT]: {
    key: CANCELLATION_POLICY_KEYS.STRICT,
    title: "سختگیرانه",
    tone: "red",
    badge: "کاهش رزرو",
    description:
      "در سیاست سختگیرانه تقریباً تمام مبلغ رزرو برای میزبان حفظ می‌شود و تنها در صورت لغو خیلی زودهنگام بخشی از مبلغ به مهمان بازمی‌گردد.",
    notes: [
      "به دلیل جریمه بالا، احتمال کاهش رزرو وجود دارد اما ضرر لغوهای ناگهانی تقریبا صفر است.",
      "لغو تا ۳۰ دقیقه پس از پرداخت همچنان رایگان است.",
    ],
    penalties: [
      createPenalty("بیش از ۷ روز مانده تا ورود", 168, 60),
      createPenalty("بین ۷ روز تا ۳ روز مانده", 72, 80),
      createPenalty("کمتر از ۳ روز مانده", 0, 100),
    ],
  },
};

export const getPolicyByKey = (key) =>
  CANCELLATION_POLICIES[key] || CANCELLATION_POLICIES[DEFAULT_CANCELLATION_POLICY];
