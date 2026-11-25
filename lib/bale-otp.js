const BALE_API_KEY = process.env.BALE_API_ACCESS_KEY || "cHCicNdLSTzPVWF3";
const BALE_BOT_ID = Number(process.env.BALE_BOT_ID || "314716948");
const BALE_API_URL = "https://safir.bale.ai/api/v3/send_message";

const sendBaleOtp = async (otp, phoneNumber) => {
  try {
    const normalizedNumber = phoneNumber.startsWith("0")
      ? "98" + phoneNumber.slice(1)
      : phoneNumber.startsWith("98")
      ? phoneNumber
      : "98" + phoneNumber;

    const response = await fetch(BALE_API_URL, {
      method: "POST",
      headers: {
        "api-access-key": BALE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: BALE_BOT_ID,
        phone_number: normalizedNumber,
        message_data: {
          otp_message: {
            otp: otp,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.message_id) {
      return { success: true };
    }

    return { success: false, error: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default sendBaleOtp;
