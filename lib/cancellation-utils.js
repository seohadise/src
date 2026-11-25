/**
 * Calculate cancellation penalty and refund based on cancellation policy and timing
 * @param {Object} property - Property object with cancellationPolicy and cancellationRules
 * @param {Date} checkInDate - Check-in date of the reservation
 * @param {Number} totalAmount - Total amount paid for the reservation
 * @param {Date} paymentDate - Date when payment was made
 * @returns {Object} - { penaltyPercent, refundPercent, penaltyAmount, refundAmount, isFreeWindow }
 */
export function calculateCancellationPenalty(property, checkInDate, totalAmount, paymentDate) {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const paymentTime = paymentDate ? new Date(paymentDate) : now;

    // Free cancellation window: 30 minutes after payment
    const minutesSincePayment = (now - paymentTime) / (1000 * 60);
    if (minutesSincePayment <= 30) {
        return {
            penaltyPercent: 0,
            refundPercent: 100,
            penaltyAmount: 0,
            refundAmount: totalAmount,
            isFreeWindow: true,
        };
    }

    // Calculate hours until check-in
    const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

    // Get cancellation policy penalties
    const penalties = property.cancellationRules?.penalties || [];
    
    if (penalties.length === 0) {
        // Fallback: if no penalties defined, use default moderate policy
        console.warn("No cancellation penalties defined for property, using default");
        return {
            penaltyPercent: 50,
            refundPercent: 50,
            penaltyAmount: Math.round(totalAmount * 0.5),
            refundAmount: Math.round(totalAmount * 0.5),
            isFreeWindow: false,
        };
    }

    // Sort penalties by minHoursBefore (descending) to find applicable tier
    const sortedPenalties = [...penalties].sort((a, b) => b.minHoursBefore - a.minHoursBefore);

    // Find the applicable penalty tier
    let applicablePenalty = sortedPenalties[sortedPenalties.length - 1]; // Default to last (strictest)
    
    for (const penalty of sortedPenalties) {
        if (hoursUntilCheckIn >= penalty.minHoursBefore) {
            applicablePenalty = penalty;
            break;
        }
    }

    const penaltyPercent = applicablePenalty.hostPenaltyPercent;
    const refundPercent = applicablePenalty.guestRefundPercent;
    const penaltyAmount = Math.round((totalAmount * penaltyPercent) / 100);
    const refundAmount = Math.round((totalAmount * refundPercent) / 100);

    return {
        penaltyPercent,
        refundPercent,
        penaltyAmount,
        refundAmount,
        isFreeWindow: false,
        appliedRule: applicablePenalty.label,
    };
}

/**
 * Get cancellation policy summary for display
 * @param {Object} property - Property object with cancellationPolicy and cancellationRules
 * @returns {String} - Human-readable policy summary
 */
export function getCancellationPolicySummary(property) {
    const policyKey = property.cancellationPolicy || "balanced";
    const policyNames = {
        easy: "آسان",
        balanced: "متعادل",
        strict: "سختگیرانه",
    };

    return `سیاست لغو: ${policyNames[policyKey] || "متعادل"}`;
}
