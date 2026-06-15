declare module "midtrans-client" {
  export interface SnapTransactionDetail {
    order_id: string;
    gross_amount: number;
  }
  export interface SnapCustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }
  export interface SnapItemDetail {
    id: string;
    price: number;
    quantity: number;
    name?: string;
  }
  export interface SnapTransactionRequest {
    transaction_details: SnapTransactionDetail;
    customer_details?: SnapCustomerDetails;
    item_details?: SnapItemDetail[];
    credit_card?: { secure?: boolean };
    callbacks?: { finish?: string };
  }
  export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }
  export interface CoreApiTransactionStatus {
    transaction_status: string;
    order_id: string;
    payment_type?: string;
    gross_amount?: string;
    settlement_time?: string;
  }
  export class Snap {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    createTransaction(
      req: SnapTransactionRequest,
    ): Promise<SnapTransactionResponse>;
    createTransactionToken(req: SnapTransactionRequest): Promise<string>;
  }
  export class CoreApi {
    constructor(config: {
      isProduction: boolean;
      serverKey: string;
      clientKey: string;
    });
    transaction: {
      status(orderId: string): Promise<CoreApiTransactionStatus>;
    };
  }
  const _default: { Snap: typeof Snap; CoreApi: typeof CoreApi };
  export default _default;
}
