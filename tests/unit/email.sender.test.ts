import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendOrderEmail } from "../../src/services/notification/email.sender";
import { prisma } from "../../src/config/prisma";

const sendMailMock = vi.fn();

vi.mock("../../src/config/mailer", () => ({
  getTransporter: () => ({ sendMail: sendMailMock }),
  isEmailEnabled: () => true,
}));

describe("email.sender", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: "x" });
  });

  it("returns sent=false kalau buyer tidak punya email", async () => {
    const buyer = await prisma.pembeli.create({
      data: {
        full_name: "NoEmail",
        phone_number: `08${Date.now()}`,
        email: null,
      },
    });
    const r = await sendOrderEmail({
      orderId: 1,
      buyerId: buyer.user_id,
      template: "orderAccepted",
    });
    expect(r.sent).toBe(false);
    expect(r.error).toMatch(/tidak punya email/i);
  });

  it("calls sendMail dengan subject yang sesuai template", async () => {
    const buyer = await prisma.pembeli.create({
      data: {
        full_name: "E",
        phone_number: `08${Date.now()}`,
        email: `e${Date.now()}@test.com`,
      },
    });
    const r = await sendOrderEmail({
      orderId: 42,
      buyerId: buyer.user_id,
      template: "orderAccepted",
    });
    expect(r.sent).toBe(true);
    expect(sendMailMock).toHaveBeenCalledOnce();
    const call = sendMailMock.mock.calls[0][0];
    expect(call.subject).toContain("#42");
    expect(call.subject).toContain("diterima");
    expect(call.html).toContain("#42");
  });

  it("orderDelivered template subject", async () => {
    const buyer = await prisma.pembeli.create({
      data: {
        full_name: "E",
        phone_number: `08${Date.now()}`,
        email: `e${Date.now() + 1}@test.com`,
      },
    });
    await sendOrderEmail({
      orderId: 7,
      buyerId: buyer.user_id,
      template: "orderDelivered",
    });
    expect(sendMailMock.mock.calls[0][0].subject).toContain("dikirim");
  });
});
