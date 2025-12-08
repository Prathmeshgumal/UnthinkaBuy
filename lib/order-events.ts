/**
 * Order events logging utility.
 * Logs when a user clicks "Buy Now" or places an order.
 */

export type OrderEventType = "buy_now_clicked" | "order_placed"

export async function logOrderEvent(
  productId: string,
  eventType: OrderEventType,
  token?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch("/api/order-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        product_id: productId,
        event_type: eventType,
        metadata,
      }),
    })

    if (!response.ok) {
      console.error("[OrderEvents] Failed to log event", eventType, "for product", productId)
    }
  } catch (error) {
    console.error("[OrderEvents] Error logging event:", error)
  }
}





