import type { AlertSeverity, Feedback, InventoryAlert, InventoryRecord, Promotion, PurchaseRecord, SaleRecord } from '@/types/domain';
export type CopilotIntent='PRIORITY'|'DISCREPANCIES'|'RESTOCK'|'LOW_ROTATION'|'DAILY_SUMMARY'|'PRODUCT_STATUS'|'GENERAL_HELP';
export type BusinessContext={inventory:InventoryRecord[];alerts:InventoryAlert[];discrepancies:InventoryRecord[];reorderProducts:InventoryRecord[];lowRotationProducts:InventoryRecord[];recentSales:SaleRecord[];recentPurchases:PurchaseRecord[];promotions:Promotion[];feedback:Feedback[];dailySummary:{priority:number;attention:number;opportunity:number;stable:number;sales:number;purchases:number}};
export type CopilotFact={label:string;value:string};
export type CopilotResponse={message:string;severity?:AlertSeverity;suggestedAction?:string;actionRoute?:string;facts?:CopilotFact[]};
export interface CopilotProvider{ask(question:string,context:BusinessContext,history?:Array<{role:'user'|'assistant';content:string}>):Promise<CopilotResponse>}
